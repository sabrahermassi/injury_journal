import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InjuryExtractor } from "./injury-extractor";
import { extractInjury } from "@/services/extractor-api";
import { InjuriesProvider } from "@/components/dashboard/injuries-provider";

vi.mock("@/services/extractor-api", () => ({
  extractInjury: vi.fn(),
}));

// The result panel now offers "save to my journal", which reads the injury
// list from the dashboard provider. Stubbed rather than removed: without it
// the component under test renders half of what the user sees.
vi.mock("@/services/api", () => ({
  getInjuries: vi.fn().mockResolvedValue([]),
  acceptExtraction: vi.fn(),
}));

const mockedExtractInjury = vi.mocked(extractInjury);

// InjuryExtractor is only ever rendered inside the dashboard shell, which
// supplies this provider.
function renderExtractor(ui: React.ReactNode = <InjuryExtractor />) {
  return render(<InjuriesProvider>{ui}</InjuriesProvider>);
}

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
    renderExtractor();

    await user.type(
      screen.getByLabelText(/paste the note/i),
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
    renderExtractor();

    await user.type(
      screen.getByLabelText(/paste the note/i),
      "My ankle hurts after running.",
    );
    await user.click(screen.getByRole("button", { name: /analyze injury/i }));

    expect(await screen.findByText("Analysis failed")).toBeInTheDocument();
    expect(screen.getByText("Failed to extract injury")).toBeInTheDocument();
  });

  it("disables the analyze button until enough text is entered", async () => {
    renderExtractor();

    expect(screen.getByRole("button", { name: /analyze injury/i })).toBeDisabled();

    await userEvent.setup().type(screen.getByLabelText(/paste the note/i), "ok");

    expect(screen.getByRole("button", { name: /analyze injury/i })).toBeDisabled();
  });
});
