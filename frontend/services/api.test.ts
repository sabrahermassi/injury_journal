import { afterEach, describe, expect, it, vi } from "vitest";

// api.ts reads NEXT_PUBLIC_API_URL into a module-level const at import time
// and throws if it's unset, so the env var must be set before the module is
// evaluated -- a dynamic import after setting it, rather than a static
// import + vi.stubEnv, which runs too late relative to the hoisted static
// import. Same convention as extractor-api.test.ts.
process.env.NEXT_PUBLIC_API_URL = "https://api.example.invalid";
const {
  getCurrentUser,
  authFetch,
  loginUser,
  logoutUser,
  getInjuries,
  createInjury,
} = await import("./api");

function mockFetchOnce(body: unknown, ok = true, status = ok ? 200 : 400) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  describe("getCurrentUser", () => {
    it("returns null when nothing is stored", () => {
      expect(getCurrentUser()).toBeNull();
    });

    it("returns the stored user", () => {
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({ id: 1, email: "a@example.com" }),
      );
      expect(getCurrentUser()).toEqual({ id: 1, email: "a@example.com" });
    });

    it("returns null rather than throwing on malformed JSON", () => {
      sessionStorage.setItem("currentUser", "{not json");
      expect(getCurrentUser()).toBeNull();
    });

    it("returns null when sessionStorage itself is unavailable (SSR)", () => {
      vi.stubGlobal("sessionStorage", undefined);
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe("authFetch", () => {
    it("sends credentials: include and a default Content-Type", async () => {
      const fetchMock = mockFetchOnce({});

      await authFetch("https://api.example.invalid/x");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.invalid/x",
        expect.objectContaining({
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("omits the CSRF header when no token is stored", async () => {
      const fetchMock = mockFetchOnce({});

      await authFetch("https://api.example.invalid/x");

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers).not.toHaveProperty("X-CSRF-Token");
    });

    it("attaches the CSRF header when a token is stored", async () => {
      sessionStorage.setItem("csrfToken", "abc123");
      const fetchMock = mockFetchOnce({});

      await authFetch("https://api.example.invalid/x");

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers).toMatchObject({ "X-CSRF-Token": "abc123" });
    });

    it("merges caller-supplied headers without dropping the defaults", async () => {
      const fetchMock = mockFetchOnce({});

      await authFetch("https://api.example.invalid/x", {
        headers: { "X-Custom": "yes" },
      });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers).toMatchObject({
        "Content-Type": "application/json",
        "X-Custom": "yes",
      });
    });
  });

  describe("loginUser", () => {
    it("stores the csrfToken and user from the response on success", async () => {
      mockFetchOnce({
        token: "jwt",
        csrfToken: "csrf-abc",
        user: { id: 1, email: "a@example.com" },
      });

      await loginUser("a@example.com", "password123");

      expect(sessionStorage.getItem("csrfToken")).toBe("csrf-abc");
      expect(sessionStorage.getItem("currentUser")).toBe(
        JSON.stringify({ id: 1, email: "a@example.com" }),
      );
    });

    it("throws and stores nothing on a non-OK response", async () => {
      mockFetchOnce({ error: "Invalid credentials" }, false);

      await expect(loginUser("a@example.com", "wrong")).rejects.toThrow(
        "Login failed",
      );
      expect(sessionStorage.getItem("csrfToken")).toBeNull();
      expect(sessionStorage.getItem("currentUser")).toBeNull();
    });
  });

  describe("logoutUser", () => {
    it("clears both stored keys on success", async () => {
      sessionStorage.setItem("csrfToken", "csrf-abc");
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({ id: 1, email: "a@example.com" }),
      );
      mockFetchOnce({});

      await logoutUser();

      expect(sessionStorage.getItem("csrfToken")).toBeNull();
      expect(sessionStorage.getItem("currentUser")).toBeNull();
    });

    it("throws on a non-OK response", async () => {
      mockFetchOnce({}, false);

      await expect(logoutUser()).rejects.toThrow("Logout failed");
    });
  });

  // Representative wrappers only -- the ~30 CRUD functions in this file all
  // reduce to the same authFetch -> throw-on-!ok -> response.json() shape
  // already exercised above and at the integration level (backend/tests/*).
  // These two cover the GET happy/error path and the "read error text and
  // throw it" variant several write wrappers use instead of a fixed message.
  describe("getInjuries", () => {
    it("returns the parsed list on success", async () => {
      mockFetchOnce([{ id: 1, name: "Ankle" }]);
      const result = await getInjuries();
      expect(result).toEqual([{ id: 1, name: "Ankle" }]);
    });

    it("throws on a non-OK response", async () => {
      mockFetchOnce({}, false);
      await expect(getInjuries()).rejects.toThrow("Failed to fetch injuries");
    });
  });

  describe("createInjury", () => {
    const payload = {
      name: "Ankle sprain",
      bodyArea: "Ankle",
      side: null,
      startDate: "2025-01-01T00:00:00.000Z",
      cause: null,
      description: null,
      status: "Active",
    };

    it("throws the server's error text rather than a fixed message", async () => {
      mockFetchOnce("injury name is required", false);
      await expect(createInjury(payload)).rejects.toThrow(
        "injury name is required",
      );
    });
  });
});
