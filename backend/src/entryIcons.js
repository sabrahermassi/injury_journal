/**
 * The canonical entry-icon table.
 *
 * Every client that draws an entry reads its icon from here, via the `icon`
 * field on the API response, so two records that say the same thing can never
 * disagree about their picture. That was the bug this replaces: the frontend
 * used to guess from the entry's type *and* its description, so
 * `doctor_visit / "Saw GP, referred to physical therapy"` drew the physio icon
 * while `doctor_visit / "Urgent care visit"` drew the visit one.
 *
 * The rules that keep it stable:
 *
 *  1. One field decides. A treatment is matched on its name, a timeline event
 *     on its type. Free-text notes never influence the choice, because two
 *     entries of the same kind must not diverge on wording.
 *  2. Exact match first. The normalized string is looked up in TERMS before any
 *     pattern runs, so "physiotherapy" is a table entry, not a guess.
 *  3. Unknown means unknown. Anything unmatched gets `leaf`, never the nearest
 *     thing.
 *
 * There is no MRI or surgery illustration in the asset set, so those resolve to
 * `visit` — a scan is a clinical appointment. Add the art and give them their
 * own key here and every surface picks it up at once.
 */

export const ICONS = Object.freeze({
  PHYSIO: 'physio',
  INJECTION: 'injection',
  PIT: 'pit',
  SYMPTOM: 'symptom',
  VISIT: 'visit',
  LEAF: 'leaf',
});

export const CATEGORIES = Object.freeze({
  SYMPTOM: 'symptom',
  TREATMENT: 'treatment',
  VISIT: 'visit',
});

// Lowercase, collapse whitespace, drop punctuation and any leading article, so
// "Physio", "physiotherapy.", "PHYSICAL_THERAPY" and "the physio" all land on
// the same key.
const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9+ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(a|an|the) /, '');

// Exact terms. This is the part to extend when a new kind of entry becomes
// common — adding a row here is all it takes.
const TERMS = new Map(
  Object.entries({
    // Physio and hands-on therapy
    physio: ICONS.PHYSIO,
    physiotherapy: ICONS.PHYSIO,
    'physical therapy': ICONS.PHYSIO,
    pt: ICONS.PHYSIO,
    rehab: ICONS.PHYSIO,
    rehabilitation: ICONS.PHYSIO,
    'exercise therapy': ICONS.PHYSIO,
    exercises: ICONS.PHYSIO,
    stretching: ICONS.PHYSIO,
    massage: ICONS.PHYSIO,
    'massage therapy': ICONS.PHYSIO,
    chiropractic: ICONS.PHYSIO,
    osteopathy: ICONS.PHYSIO,
    pilates: ICONS.PHYSIO,
    acupuncture: ICONS.PHYSIO,
    'dry needling': ICONS.PHYSIO,
    'treatment started': ICONS.PHYSIO,
    treatment: ICONS.PHYSIO,

    // Injections and infusions
    injection: ICONS.INJECTION,
    injections: ICONS.INJECTION,
    'cortisone injection': ICONS.INJECTION,
    cortisone: ICONS.INJECTION,
    'steroid injection': ICONS.INJECTION,
    steroid: ICONS.INJECTION,
    prp: ICONS.INJECTION,
    'prp injection': ICONS.INJECTION,
    prolotherapy: ICONS.INJECTION,
    infusion: ICONS.INJECTION,
    'nerve block': ICONS.INJECTION,

    // Perineural injection therapy — its own illustration in the design
    pit: ICONS.PIT,
    'pit treatment': ICONS.PIT,
    'perineural injection therapy': ICONS.PIT,
    perineural: ICONS.PIT,

    // Symptoms and how the injury itself is recorded
    symptom: ICONS.SYMPTOM,
    symptoms: ICONS.SYMPTOM,
    pain: ICONS.SYMPTOM,
    flare: ICONS.SYMPTOM,
    'flare up': ICONS.SYMPTOM,
    swelling: ICONS.SYMPTOM,
    stiffness: ICONS.SYMPTOM,
    'pain check in': ICONS.SYMPTOM,

    // Clinical encounters, including scans (no scan art exists yet)
    visit: ICONS.VISIT,
    'medical visit': ICONS.VISIT,
    'doctor visit': ICONS.VISIT,
    appointment: ICONS.VISIT,
    consultation: ICONS.VISIT,
    'follow up': ICONS.VISIT,
    gp: ICONS.VISIT,
    specialist: ICONS.VISIT,
    surgeon: ICONS.VISIT,
    surgery: ICONS.VISIT,
    operation: ICONS.VISIT,
    mri: ICONS.VISIT,
    'mri scan': ICONS.VISIT,
    xray: ICONS.VISIT,
    'x ray': ICONS.VISIT,
    ultrasound: ICONS.VISIT,
    scan: ICONS.VISIT,
    'ct scan': ICONS.VISIT,
    imaging: ICONS.VISIT,
    'blood test': ICONS.VISIT,
  })
);

// Only consulted when the exact term is not in the table. Ordered: the more
// specific pattern must come first, or "cortisone injection" is claimed by the
// broader clinical words.
const PATTERNS = [
  [/\bpit\b|perineural/, ICONS.PIT],
  [/inject|cortisone|steroid|\bprp\b|prolo|infusion|nerve block/, ICONS.INJECTION],
  [
    /physio|physical therap|\bpt\b|rehab|stretch|massage|chiro|osteo|pilates|acupunct|needling|exercise/,
    ICONS.PHYSIO,
  ],
  [
    /\bmri\b|x ?ray|ultrasound|\bscan\b|imaging|surgery|operation|visit|doctor|\bdr\b|appointment|consult|clinic|\bgp\b|specialist/,
    ICONS.VISIT,
  ],
  [/symptom|\bpain\b|flare|ache|swelling|stiff|sore|spasm|numb/, ICONS.SYMPTOM],
];

/**
 * Resolve one label to an icon key. `label` must be the entry's own defining
 * field — a treatment's name, an event's type — never its free-text notes.
 */
export const iconFor = (label) => {
  const key = normalize(label);

  if (!key) return ICONS.LEAF;
  if (TERMS.has(key)) return TERMS.get(key);

  for (const [pattern, icon] of PATTERNS) {
    if (pattern.test(key)) return icon;
  }

  return ICONS.LEAF;
};

/**
 * Which of the timeline's three filters an event belongs to, or null when the
 * table cannot place it. Null events stay visible under "All" and nowhere
 * else: filing `injury_occurred` under a filter it may not belong to would be
 * worse than leaving it out of the narrow views.
 */
export const categoryFor = (label) => {
  const icon = iconFor(label);

  if (icon === ICONS.SYMPTOM) return CATEGORIES.SYMPTOM;
  if (icon === ICONS.VISIT) return CATEGORIES.VISIT;
  if (icon === ICONS.PHYSIO || icon === ICONS.INJECTION || icon === ICONS.PIT) {
    return CATEGORIES.TREATMENT;
  }

  return null;
};
