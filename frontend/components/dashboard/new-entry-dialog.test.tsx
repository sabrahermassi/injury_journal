import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewEntryDialog } from "./new-entry-dialog";
import { NewEntryProvider, useNewEntry } from "./new-entry-provider";
import { InjuriesProvider } from "./injuries-provider";
import { createSymptom, createTreatment, getInjuries } from "@/services/api";

vi.mock("@/services/api", () => ({
  getInjuries: vi.fn(),
  createSymptom: vi.fn(),
  createTreatment: vi.fn(),
  createMedicalVisit: vi.fn(),
}));

const mockedGetInjuries = vi.mocked(getInjuries);
const mockedCreateSymptom = vi.mocked(createSymptom);
const mockedCreateTreatment = vi.mocked(createTreatment);

const INJURY = {
  id: 7,
  name: "Lower back strain",
  bodyArea: "Lower back",
  startDate: "2025-01-01T00:00:00.000Z",
};

function Opener() {
  const { openNewEntry } = useNewEntry();
  return (
    <button type="button" onClick={() => openNewEntry()}>
      open
    </button>
  );
}

function renderDialog() {
  return render(
    <InjuriesProvider>
      <NewEntryProvider>
        <Opener />
        <NewEntryDialog />
      </NewEntryProvider>
    </InjuriesProvider>,
  );
}

describe("NewEntryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedGetInjuries.mockResolvedValue([INJURY] as any);
    mockedCreateSymptom.mockResolvedValue(undefined as never);
    mockedCreateTreatment.mockResolvedValue(undefined as never);
  });

  it("stays closed until something opens it", () => {
    renderDialog();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves a single symptom against the selected injury", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /pain 6 out of 10/i }));
    await user.click(screen.getByRole("button", { name: /^save entry$/i }));

    await waitFor(() => expect(mockedCreateSymptom).toHaveBeenCalledTimes(1));
    expect(mockedCreateSymptom).toHaveBeenCalledWith(
      INJURY.id,
      expect.objectContaining({ painLevel: 6 }),
    );
  });

  it("stages entries with Add another and saves them together", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));
    await screen.findByRole("dialog");

    // One symptom onto the pile...
    await user.click(screen.getByRole("button", { name: /pain 4 out of 10/i }));
    await user.click(screen.getByRole("button", { name: /add another/i }));

    expect(await screen.findByText(/ready to save/i)).toBeInTheDocument();

    // ...then a treatment as the live entry. The button counts both.
    await user.click(screen.getByRole("button", { name: "Treatment" }));
    await user.type(screen.getByLabelText(/^treatment$/i), "Physiotherapy");

    await user.click(screen.getByRole("button", { name: /save 2 entries/i }));

    await waitFor(() => expect(mockedCreateTreatment).toHaveBeenCalledTimes(1));
    expect(mockedCreateSymptom).toHaveBeenCalledTimes(1);
    expect(mockedCreateTreatment).toHaveBeenCalledWith(
      INJURY.id,
      expect.objectContaining({ name: "Physiotherapy" }),
    );
  });

  it("keeps the unsaved remainder staged when a save fails part-way", async () => {
    const user = userEvent.setup();
    // The staged symptom writes; the treatment behind it does not.
    mockedCreateTreatment.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: /pain 4 out of 10/i }));
    await user.click(screen.getByRole("button", { name: /add another/i }));

    await user.click(screen.getByRole("button", { name: "Treatment" }));
    await user.type(screen.getByLabelText(/^treatment$/i), "Physiotherapy");
    await user.click(screen.getByRole("button", { name: /save 2 entries/i }));

    // The dialog stays open and says how many landed, rather than implying a
    // rollback that never happened.
    expect(await screen.findByText(/saved 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
