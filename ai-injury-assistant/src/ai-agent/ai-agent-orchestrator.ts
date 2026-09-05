import { safetyTool } from './tools/safety-tool.js';
import { ragTool } from './tools/rag-tool.js';
import {
  journalTool,
  journalToolAll,
  formatInjuryRecord,
  formatInjuryRecords,
  collectRecordSources,
  estimateTokens,
} from './tools/journal-tool.js';
import { buildAllInjuryStats } from './tools/journal-stats-tool.js';
import { isDiagnosisRequest } from './ai-agent-intent-router.js';
import { AgentState } from './ai-agent-state.js';
import { SYSTEM_PROMPT, buildUserPrompt } from '../rag/prompt-builder.js';
import { generateAnswer } from '../llm/llm-client.js';
import { buildCitations } from '../rag/citation-builder.js';
import { CONTEXT_TOKEN_BUDGET } from '../config/retrieval.js';
import {
  checkContentSafety,
  checkAnswerSafety,
  DIAGNOSIS_REQUEST_MESSAGE,
} from '../safety/safety-service.js';

function safetyRefusalResponse(message: string) {
  return {
    answer: message,
    citations: [],
    intent: 'safety' as const,
    metadata: {
      retrievedChunks: [],
    },
  };
}

function emptyJournalResponse(message: string) {
  return {
    answer: message,
    citations: [],
    intent: 'journal' as const,
    metadata: {
      retrievedChunks: [],
    },
  };
}

async function runRetrievalPath(
  question: string,
  injuryId: number | undefined,
  userId: number,
  state: AgentState,
  requestId?: string,
) {
  state.toolUsed = 'rag-tool';

  const result = await ragTool(question, injuryId, userId, 5, requestId);

  state.result = result;

  return {
    answer: result.answer,
    citations: result.citations,
    intent: 'rag' as const,
    metadata: {
      retrievedChunks: result.chunks.map((chunk) => ({
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        injuryId: chunk.injuryId,
      })),
    },
  };
}

export async function runAgent(
  question: string,
  userId: number,
  injuryId?: number,
  requestId?: string,
) {
  const state: AgentState = {
    question,
  };

  const safety = safetyTool(question, requestId);

  state.safety = safety;

  if (!safety.allowed) {
    state.intent = 'safety';

    return safetyRefusalResponse(safety.message);
  }

  if (isDiagnosisRequest(question, requestId)) {
    state.intent = 'safety';

    return safetyRefusalResponse(DIAGNOSIS_REQUEST_MESSAGE);
  }

  // Load the whole record rather than searching within it.
  //
  // This corpus is far smaller than the model's context window -- the largest
  // measured injury is ~1.8k tokens and a complete 10-injury journal ~11k,
  // against a 131k window -- so narrowing to the most similar few records buys
  // nothing and risks dropping the answer entirely. It did exactly that: a
  // question carrying little topical signal ("give me a summary") sits a near
  // uniform distance from every record, and the retrieval cutoff then returned
  // nothing at all for some injuries and a single record for others (#122).
  //
  // Retrieval still runs when the journal is genuinely too large to hand over
  // whole; see the budget check below.
  const injuries =
    injuryId === undefined
      ? await journalToolAll(userId, requestId)
      : [await journalTool(injuryId, userId, requestId)].filter(
          (injury): injury is NonNullable<typeof injury> => injury !== null,
        );

  if (injuries.length === 0) {
    state.toolUsed = 'journal-tool';
    state.intent = 'journal';

    return emptyJournalResponse(
      injuryId === undefined
        ? 'There are no injuries in the journal yet. Add one, and log symptoms, treatments or visits against it, and I can answer questions about it.'
        : 'No injury record was found.',
    );
  }

  const records =
    injuries.length === 1
      ? formatInjuryRecord(injuries[0], requestId)
      : formatInjuryRecords(injuries, requestId);

  // Aggregates first: the model reads them as given rather than deriving
  // totals, orderings and differences from the prose below.
  const stats = buildAllInjuryStats(injuries);
  const context = `${stats}\n\n${records}`;

  if (estimateTokens(context) > CONTEXT_TOKEN_BUDGET) {
    return runRetrievalPath(question, injuryId, userId, state, requestId);
  }

  state.toolUsed = 'journal-tool';
  state.intent = 'journal';

  const contentSafety = checkContentSafety(context, requestId);

  if (!contentSafety.allowed) {
    return emptyJournalResponse(contentSafety.message);
  }

  const userPrompt = buildUserPrompt(question, context, requestId);
  const answer = await generateAnswer(SYSTEM_PROMPT, userPrompt, requestId);

  if (!answer) {
    return emptyJournalResponse(
      'Unable to generate a summary from your injury record right now.',
    );
  }

  const answerSafety = checkAnswerSafety(answer, context, requestId);

  if (!answerSafety.allowed) {
    return emptyJournalResponse(answerSafety.message);
  }

  // Every record that went into the prompt is a source the answer could have
  // drawn on, so all of them are cited. Unlike the retrieval path there is no
  // verification step: these records were just read from the database under
  // this user's id, so there is nothing to confirm they exist.
  const sources = injuries.flatMap((injury) => collectRecordSources(injury));
  const injuryNames = new Map(injuries.map((injury) => [injury.id, injury.name]));
  const citations = buildCitations(sources, injuryNames, requestId);

  return {
    answer,
    citations,
    intent: 'journal' as const,
    metadata: {
      retrievedChunks: sources.map((source) => ({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        injuryId: source.injuryId,
      })),
    },
  };
}
