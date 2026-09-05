import { isDiagnosisRequest } from '../src/ai-agent/ai-agent-intent-router.js';

describe('isDiagnosisRequest', () => {
  it('flags a question asking for a diagnosis', () => {
    expect(isDiagnosisRequest('Do I have cancer?')).toBe(true);
  });

  it('flags a question asking the assistant to diagnose', () => {
    expect(isDiagnosisRequest('Can you diagnose this pain?')).toBe(true);
  });

  it('flags a question asking to name a condition', () => {
    expect(isDiagnosisRequest('What condition is this?')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isDiagnosisRequest('DIAGNOSE ME')).toBe(true);
  });

  it('allows a question about recorded treatments', () => {
    expect(isDiagnosisRequest('What treatments failed?')).toBe(false);
  });

  // These previously routed on keywords to decide between the journal and
  // retrieval paths. That decision now lives in the orchestrator and is made
  // from scope and size, so neither phrasing is special here any more.
  it('does not treat a timeline question as special', () => {
    expect(isDiagnosisRequest('Show my injury timeline')).toBe(false);
  });

  it('does not treat an open-ended question as special', () => {
    expect(isDiagnosisRequest('Tell me something about my injury')).toBe(false);
  });
});
