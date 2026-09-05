import { afterEach, describe, expect, it, vi } from "vitest";

// extractor-api.ts reads NEXT_PUBLIC_API_URL into a module-level const at
// import time (and services/api.ts, which it now imports, throws outright
// without it), so the env var must be set before the module is evaluated — a
// dynamic import after setting it, rather than a static import + vi.stubEnv,
// which runs too late relative to the hoisted static import.
process.env.NEXT_PUBLIC_API_URL = "https://api.example.invalid";
const { extractInjury, getInjuryHistory } = await import("./extractor-api");

const VALID_EXTRACTION_PAYLOAD = {
  injury_name: "Sprained ankle",
  body_area: "ankle",
  pain_level: 6,
  symptoms: ["swelling"],
  possible_causes: ["twisted while running"],
};

const VALID_HISTORY_PAYLOAD = [
  {
    entryId: "abc-123",
    timestamp: "2026-08-30T00:00:00+00:00",
    rawText: "ankle hurts",
    extractedData: VALID_EXTRACTION_PAYLOAD,
  },
];

function mockFetchOnce(body: unknown, ok = true) {
  const mock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });

  vi.stubGlobal("fetch", mock);

  return mock;
}

describe("api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("extractInjury", () => {
    it("returns the mapped extraction on a valid payload", async () => {
      mockFetchOnce(VALID_EXTRACTION_PAYLOAD);

      const result = await extractInjury("my ankle hurts");

      expect(result).toEqual({
        injuryName: "Sprained ankle",
        bodyArea: "ankle",
        painLevel: 6,
        symptoms: ["swelling"],
        possibleCauses: ["twisted while running"],
      });
    });

    it("posts to the backend proxy with the session credentials", async () => {
      const fetchMock = mockFetchOnce(VALID_EXTRACTION_PAYLOAD);

      await extractInjury("my ankle hurts");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.invalid/api/extractions/extract",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("throws when the response shape is unexpected", async () => {
      mockFetchOnce({ injury_name: "Sprained ankle" });

      await expect(extractInjury("my ankle hurts")).rejects.toThrow(
        "Unexpected response from server",
      );
    });

    it("uses the server error message when the error response is valid JSON", async () => {
      mockFetchOnce({ error: "text too long" }, false);

      await expect(extractInjury("my ankle hurts")).rejects.toThrow("text too long");
    });

    it("falls back to the default message when the error body isn't valid JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        }),
      );

      await expect(extractInjury("my ankle hurts")).rejects.toThrow(
        "Failed to extract injury",
      );
    });
  });

  describe("getInjuryHistory", () => {
    it("returns the payload when every entry matches the expected shape", async () => {
      mockFetchOnce(VALID_HISTORY_PAYLOAD);

      const result = await getInjuryHistory();

      expect(result).toEqual(VALID_HISTORY_PAYLOAD);
    });

    it("reads from the backend proxy with the session credentials", async () => {
      const fetchMock = mockFetchOnce(VALID_HISTORY_PAYLOAD);

      await getInjuryHistory();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.invalid/api/extractions/history",
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("throws when an entry is malformed", async () => {
      mockFetchOnce([{ entryId: "abc-123" }]);

      await expect(getInjuryHistory()).rejects.toThrow(
        "Unexpected response from server",
      );
    });

    it("falls back to the default message when the error body isn't valid JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        }),
      );

      await expect(getInjuryHistory()).rejects.toThrow(
        "Failed to fetch injury history",
      );
    });
  });
});
