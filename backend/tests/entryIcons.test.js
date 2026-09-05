import { iconFor, categoryFor, ICONS } from '../src/entryIcons.js';

// The whole point of this table is that the same entry always draws the same
// picture. These lock that down, plus the fallback.

describe('iconFor', () => {
  test('two records saying the same thing resolve identically', () => {
    // The reported bug: repeat courses of one treatment drew different icons.
    expect(iconFor('Physiotherapy')).toBe(iconFor('physiotherapy'));
    expect(iconFor('Physiotherapy')).toBe(iconFor('  PHYSIOTHERAPY  '));
    expect(iconFor('Physical therapy')).toBe(iconFor('physical_therapy'));
    expect(iconFor('Physiotherapy')).toBe(ICONS.PHYSIO);
  });

  test('every doctor_visit gets the same icon regardless of wording', () => {
    // Previously the description leaked in, so a visit that mentioned physio
    // drew the physio icon. Type is now the only input.
    expect(iconFor('doctor_visit')).toBe(ICONS.VISIT);
    expect(iconFor('DOCTOR_VISIT')).toBe(ICONS.VISIT);
    expect(iconFor('doctor visit')).toBe(ICONS.VISIT);
  });

  test('names the terms the user asked for by name', () => {
    expect(iconFor('MRI')).toBe(ICONS.VISIT);
    expect(iconFor('MRI scan')).toBe(ICONS.VISIT);
    expect(iconFor('X-ray')).toBe(ICONS.VISIT);
    expect(iconFor('Ultrasound')).toBe(ICONS.VISIT);
    expect(iconFor('Cortisone injection')).toBe(ICONS.INJECTION);
    expect(iconFor('PIT Treatment')).toBe(ICONS.PIT);
  });

  test('prefers the more specific match', () => {
    // "Cortisone injection" contains no clinical-visit word, but
    // "PIT" must not be swallowed by the injection pattern.
    expect(iconFor('Perineural injection therapy')).toBe(ICONS.PIT);
    expect(iconFor('Steroid injection')).toBe(ICONS.INJECTION);
  });

  test('strips articles and punctuation before matching', () => {
    expect(iconFor('The physio')).toBe(ICONS.PHYSIO);
    expect(iconFor('physio.')).toBe(ICONS.PHYSIO);
  });

  test('falls back to the leaf rather than the nearest thing', () => {
    expect(iconFor('injury_occurred')).toBe(ICONS.LEAF);
    expect(iconFor('recovered')).toBe(ICONS.LEAF);
    expect(iconFor('')).toBe(ICONS.LEAF);
    expect(iconFor(null)).toBe(ICONS.LEAF);
    expect(iconFor(undefined)).toBe(ICONS.LEAF);
  });
});

describe('categoryFor', () => {
  test('folds the three treatment icons into one bucket', () => {
    expect(categoryFor('Physiotherapy')).toBe('treatment');
    expect(categoryFor('Cortisone injection')).toBe('treatment');
    expect(categoryFor('PIT Treatment')).toBe('treatment');
  });

  test('keeps symptoms and visits apart', () => {
    expect(categoryFor('symptom')).toBe('symptom');
    expect(categoryFor('doctor_visit')).toBe('visit');
  });

  test('returns null for anything it cannot place', () => {
    // These stay under "All" and are not filed under a filter they may not
    // belong to. Both are types the app's own seed writes.
    expect(categoryFor('injury_occurred')).toBeNull();
    expect(categoryFor('recovered')).toBeNull();
  });
});
