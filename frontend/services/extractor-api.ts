import { InjuryExtraction, InjuryHistoryEntry } from "@/lib/injury-schema";
import { authFetch } from "@/services/api";

// api.ts already throws at import time if NEXT_PUBLIC_API_URL is unset.
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

// Goes through this app's own backend rather than calling the extractor
// Lambda directly: the JWT lives in an httpOnly cookie, so the browser has
// no token to send as a Bearer header. The backend forwards its verified
// token on our behalf (see backend/src/services/extractorService.js).
export async function extractInjury(text: string): Promise<InjuryExtraction> {
  const response = await authFetch(`${API_URL}/api/extract`, {
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
  const response = await authFetch(`${API_URL}/api/extract/injuries`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to fetch injury history"));
  }

  const data = await response.json();

  if (!isInjuryHistoryPayload(data)) {
    throw new Error("Unexpected response from server");
  }

  return data;
}
