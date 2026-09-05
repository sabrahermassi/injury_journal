import { authFetch } from "@/services/api";
import { InjuryExtraction, InjuryHistoryEntry } from "@/lib/injury-schema";

// The extractor Lambda is no longer called from the browser. It has no auth of
// its own that a browser could satisfy, and it used to file every extraction
// under one shared user (issue #32) — so these go through this app's backend,
// which authenticates the caller and proxies onward.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const error = await response.json();
    if (error && typeof error.error === "string") {
      return error.error;
    }
  } catch {
    // response body wasn't valid JSON (empty, plain text, HTML, etc.)
  }
  return fallback;
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

  const response = await authFetch(`${API_URL}/api/extractions/extract`, {
    method: "POST",
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to extract injury"));
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

  const response = await authFetch(`${API_URL}/api/extractions/history`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to fetch injury history"));
  }

  const data = await response.json();

  if (!isInjuryHistoryPayload(data)) {
    throw new Error("Unexpected response from server");
  }

  return data;
}
