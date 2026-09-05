import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthGuard } from "./auth-guard";
import { fetchCurrentUser } from "@/services/api";

vi.mock("@/services/api", () => ({
  fetchCurrentUser: vi.fn(),
}));

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

describe("AuthGuard", () => {
  beforeEach(() => {
    mockedFetchCurrentUser.mockReset();
    replace.mockReset();
  });

  it("renders children once the server confirms a session", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ id: 1, email: "a@example.com" });

    render(
      <AuthGuard>
        <div>dashboard content</div>
      </AuthGuard>,
    );

    expect(await screen.findByText("dashboard content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /login instead of rendering children when there is no session", async () => {
    mockedFetchCurrentUser.mockResolvedValue(null);

    render(
      <AuthGuard>
        <div>dashboard content</div>
      </AuthGuard>,
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });

  it("does not render children while the check is still pending", () => {
    // Never resolves within this test -- asserts the guard's default state is
    // "not authenticated yet", not an accidental pass-through.
    mockedFetchCurrentUser.mockReturnValue(new Promise(() => {}));

    render(
      <AuthGuard>
        <div>dashboard content</div>
      </AuthGuard>,
    );

    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });
});
