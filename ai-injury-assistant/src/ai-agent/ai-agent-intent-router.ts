// The label reported for the path an answer took. Retained as the vocabulary
// the evaluation harness scores against (`evaluateIntent`), even though the
// journal/rag choice is no longer made here -- the orchestrator decides it from
// request scope and size, and reports whichever path actually ran.
export type AgentIntent = 'rag' | 'journal' | 'safety';

// Questions asking the assistant to name a condition. This runs after the
// safety service's own check and before any retrieval, and is the one routing
// decision still made from the question text: it must not depend on what the
// journal happens to contain.
//
// This previously also chose between the journal and retrieval paths by keyword
// (`timeline|history|when|events`), which meant a question like "give me a
// summary" fell through to vector retrieval and could be answered with "no
// information" while the complete record sat one branch away. That choice now
// lives in the orchestrator and is made on scope and size instead.
export function isDiagnosisRequest(question: string, requestId?: string): boolean {
  void requestId; // unused for now — reserved for future log correlation (#32)

  const normalized = question.toLowerCase();

  return (
    normalized.includes('diagnose') ||
    normalized.includes('do i have') ||
    normalized.includes('cancer') ||
    normalized.includes('condition')
  );
}
