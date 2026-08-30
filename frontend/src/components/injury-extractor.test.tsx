import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InjuryExtractor } from "./injury-extractor";
import { extractInjury } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  extractInjury: vi.fn(),
}));

const mockedExtractInjury = vi.mocked(extractInjury);

describe("InjuryExtractor", () => {
  beforeEach(() => {
    mockedExtractInjury.mockReset();
  });

  it("shows the extraction result after a successful analyze", async () => {
    mockedExtractInjury.mockResolvedValue({
      injuryName: "Sprained ankle",
      bodyArea: "ankle",
      painLevel: 6,
      symptoms: ["swelling"],
      possibleCauses: ["twisted while running"],
    });

    const user = userEvent.setup();
    render(<InjuryExtractor />);

    await user.type(
      screen.getByLabelText(/injury description/i),
      "My ankle hurts after running.",
    );
    await user.click(screen.getByRole("button", { name: /analyze injury/i }));

    expect(await screen.findByText("Sprained ankle")).toBeInTheDocument();
    expect(mockedExtractInjury).toHaveBeenCalledWith(
      "My ankle hurts after running.",
    );
  });

  it("shows an error message when analysis fails", async () => {
    mockedExtractInjury.mockRejectedValue(new Error("Failed to extract injury"));

    const user = userEvent.setup();
    render(<InjuryExtractor />);

    await user.type(
      screen.getByLabelText(/injury description/i),
      "My ankle hurts after running.",
    );
    await user.click(screen.getByRole("button", { name: /analyze injury/i }));

    expect(await screen.findByText("Analysis failed")).toBeInTheDocument();
    expect(screen.getByText("Failed to extract injury")).toBeInTheDocument();
  });

  it("disables the analyze button until enough text is entered", async () => {
    render(<InjuryExtractor />);

    expect(screen.getByRole("button", { name: /analyze injury/i })).toBeDisabled();

    await userEvent.setup().type(screen.getByLabelText(/injury description/i), "ok");

    expect(screen.getByRole("button", { name: /analyze injury/i })).toBeDisabled();
  });
});
