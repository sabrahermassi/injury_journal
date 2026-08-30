const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { InjuryExtraction, InjuryHistoryEntry } from "./injury-schema";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isInjuryExtractionPayload(data: unknown): data is {
  injury_name: string;
  body_area: string;
  pain_level: number | null;
  symptoms: string[];
  possible_causes: string[];
} {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    typeof d.injury_name === "string" &&
    typeof d.body_area === "string" &&
    (d.pain_level === null || typeof d.pain_level === "number") &&
    isStringArray(d.symptoms) &&
    isStringArray(d.possible_causes)
  );
}

function isInjuryHistoryPayload(data: unknown): data is InjuryHistoryEntry[] {
  if (!Array.isArray(data)) return false;

  return data.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;

    const e = entry as Record<string, unknown>;

    return (
      typeof e.entryId === "string" &&
      typeof e.timestamp === "string" &&
      typeof e.rawText === "string" &&
      isInjuryExtractionPayload(e.extractedData)
    );
  });
}

export async function extractInjury(text: string): Promise<InjuryExtraction> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract injury");
  }

  const data = await response.json();

  if (!isInjuryExtractionPayload(data)) {
    throw new Error("Unexpected response from server");
  }

  return {
    injuryName: data.injury_name,
    bodyArea: data.body_area,
    painLevel: data.pain_level ?? undefined,
    symptoms: data.symptoms,
    possibleCauses: data.possible_causes,
  };
}

export async function getInjuryHistory(): Promise<InjuryHistoryEntry[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}/injuries`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch injury history");
  }

  const data = await response.json();

  if (!isInjuryHistoryPayload(data)) {
    throw new Error("Unexpected response from server");
  }

  return data;
}
