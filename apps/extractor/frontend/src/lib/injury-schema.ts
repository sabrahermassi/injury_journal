export interface InjuryExtraction {
  injuryName: string;
  bodyArea: string;
  painLevel?: number;
  symptoms: string[];
  possibleCauses: string[];
}

export interface InjuryHistoryEntry {
  entryId: string;
  timestamp: string;
  rawText: string;
  extractedData: {
    injury_name: string;
    body_area: string;
    pain_level: number | null;
    symptoms: string[];
    possible_causes: string[];
  };
}
