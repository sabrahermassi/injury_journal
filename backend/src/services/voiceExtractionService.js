import { corti } from './cortiService.js';

// Each entry describes one section of the Guided Documents dynamic template.
// `key` matches the field name in the extraction result returned to the
// frontend; `heading` is how we find the section's server-generated ID back
// in the response (dynamic templates don't let the caller assign IDs).
const SECTION_DEFS = [
  {
    key: 'symptoms',
    heading: 'Symptoms',
    contentPrompt: (entryDate) =>
      `List each distinct symptom the speaker describes. If a date isn't stated, use ${entryDate}. Return an empty array if no symptoms are mentioned.`,
    fields: [
      { key: 'date', description: 'ISO 8601 date-time the symptom occurred', value: { type: 'string' } },
      {
        key: 'painLevel',
        description:
          'Pain level 1-10. Infer from qualitative words (e.g. "mild"~2-3, "moderate"~4-6, "severe"/"unbearable"~8-10) when no number is given.',
        value: { type: 'number', minimum: 1, maximum: 10 },
      },
      { key: 'location', description: 'Body location of the symptom', value: { type: 'string' } },
      { key: 'trigger', description: 'What triggered or worsened it', value: { type: 'string' } },
      { key: 'duration', description: 'How long it lasted', value: { type: 'string' } },
      { key: 'notes', description: 'Any other relevant detail', value: { type: 'string' } },
    ],
  },
  {
    key: 'treatments',
    heading: 'Treatments',
    contentPrompt: (entryDate) =>
      `List each treatment or medication the speaker describes. If a date isn't stated, use ${entryDate}. Return an empty array if none are mentioned.`,
    fields: [
      { key: 'name', description: 'Treatment or medication name', value: { type: 'string' } },
      { key: 'provider', description: 'Who provided or prescribed it', value: { type: 'string' } },
      { key: 'date', description: 'ISO 8601 date-time', value: { type: 'string' } },
      { key: 'cost', description: 'Cost if mentioned', value: { type: 'number' } },
      { key: 'outcome', description: 'Result or outcome if mentioned', value: { type: 'string' } },
    ],
  },
  {
    key: 'medicalVisits',
    heading: 'Medical visits',
    contentPrompt: (entryDate) =>
      `List each medical visit or appointment the speaker describes. If a date isn't stated, use ${entryDate}. Return an empty array if none are mentioned.`,
    fields: [
      { key: 'doctor', description: 'Doctor or provider name', value: { type: 'string' } },
      { key: 'clinic', description: 'Clinic or facility name', value: { type: 'string' } },
      { key: 'date', description: 'ISO 8601 date-time', value: { type: 'string' } },
      { key: 'notes', description: 'Any other relevant detail', value: { type: 'string' } },
    ],
  },
  {
    key: 'timelineEvents',
    heading: 'Timeline events',
    contentPrompt: (entryDate) =>
      `List each notable timeline event the speaker describes (e.g. symptom onset, imaging, surgery, follow-up). If a date isn't stated, use ${entryDate}. Return an empty array if none are mentioned.`,
    fields: [
      {
        key: 'type',
        description: 'Short label, e.g. "Symptom onset", "Imaging", "Surgery", "Follow-up"',
        value: { type: 'string' },
      },
      { key: 'date', description: 'ISO 8601 date-time', value: { type: 'string' } },
      {
        key: 'description',
        description: "Description of the event, close to the speaker's own words",
        value: { type: 'string' },
      },
      { key: 'result', description: 'Result or outcome if mentioned', value: { type: 'string' } },
    ],
  },
];

function buildSections(entryDate) {
  return SECTION_DEFS.map((def) => ({
    heading: def.heading,
    instructions: { contentPrompt: def.contentPrompt(entryDate) },
    outputSchema: {
      type: 'array',
      description: `One entry per distinct item described. Empty array if none.`,
      items: { type: 'object', fields: def.fields },
    },
  }));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function str(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requiredStr(value) {
  return str(value) ?? '';
}

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function dateOrEntryDate(value, entryDate) {
  const raw = str(value);
  if (!raw) return entryDate;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? entryDate : parsed.toISOString();
}

function painLevelOrDefault(value) {
  const n = num(value);
  if (n === null) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

// Reads the structured output for one section, matched by heading since
// dynamic-template sections get a server-generated ID we don't know until
// the response comes back.
function readSection(document, heading) {
  const section = document.sections?.find((s) => s.heading === heading);
  if (!section) return [];
  return toArray(document.structuredDocument?.[section.sectionId]);
}

// Sends a free-form dictated transcript to Corti's Guided Documents endpoint
// and gets back structured entries matching the Injury Journal schema, for
// the user to review and edit before anything is saved. Never invents
// entries the speaker didn't describe — empty categories come back as empty
// arrays.
export const extractInjuryEntry = async ({ transcript, injury, entryDate }) => {
  const sideText = injury.side ? `, side: ${injury.side}` : '';

  try {
    const response = await corti.documents.generate({
      outputLanguage: 'en',
      context: [{ type: 'text', text: transcript }],
      dynamicTemplate: {
        name: 'injury-journal-voice-extraction',
        generation: {
          instructions: {
            prompt: `You extract structured medical self-report data from a patient's spoken voice journal entry about one of their tracked injuries.

Injury being discussed: "${injury.name}" (body area: ${injury.bodyArea}${sideText}).

Only include items the speaker actually describes in the transcript. Never invent or infer entries that aren't mentioned. Keep free-text fields close to the speaker's own words.`,
          },
          sections: buildSections(entryDate),
        },
      },
    });

    const document = response.document;

    return {
      symptoms: readSection(document, 'Symptoms').map((item) => ({
        date: dateOrEntryDate(item.date, entryDate),
        painLevel: painLevelOrDefault(item.painLevel),
        location: str(item.location),
        trigger: str(item.trigger),
        duration: str(item.duration),
        notes: str(item.notes),
      })),
      treatments: readSection(document, 'Treatments').map((item) => ({
        name: requiredStr(item.name),
        provider: str(item.provider),
        date: dateOrEntryDate(item.date, entryDate),
        cost: num(item.cost),
        outcome: str(item.outcome),
      })),
      medicalVisits: readSection(document, 'Medical visits').map((item) => ({
        doctor: str(item.doctor),
        clinic: str(item.clinic),
        date: dateOrEntryDate(item.date, entryDate),
        notes: str(item.notes),
      })),
      timelineEvents: readSection(document, 'Timeline events').map((item) => ({
        type: requiredStr(item.type),
        date: dateOrEntryDate(item.date, entryDate),
        description: requiredStr(item.description),
        result: str(item.result),
      })),
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const wrapped = new Error(`Voice extraction failed: ${error.message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};
