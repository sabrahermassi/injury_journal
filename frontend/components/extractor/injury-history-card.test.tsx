import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InjuryHistoryCard } from "./injury-history-card";

describe("InjuryHistoryCard", () => {
  it("renders a saved injury entry", () => {
    render(
      <InjuryHistoryCard
        injury={{
          entryId: "abc-123",
          timestamp: "2026-08-30T00:00:00.000Z",
          rawText: "My ankle hurts.",
          extractedData: {
            injury_name: "Sprained ankle",
            body_area: "ankle",
            pain_level: 6,
            symptoms: ["swelling"],
            possible_causes: ["twisted while running"],
          },
        }}
      />,
    );

    expect(screen.getByText("Sprained ankle")).toBeInTheDocument();
    expect(screen.getByText("ankle")).toBeInTheDocument();
    expect(screen.getByText("swelling")).toBeInTheDocument();
    expect(screen.getByText("twisted while running")).toBeInTheDocument();
  });

  it("shows fallback copy when fields are empty", () => {
    render(
      <InjuryHistoryCard
        injury={{
          entryId: "abc-123",
          timestamp: "2026-08-30T00:00:00.000Z",
          rawText: "",
          extractedData: {
            injury_name: "",
            body_area: "",
            pain_level: null,
            symptoms: [],
            possible_causes: [],
          },
        }}
      />,
    );

    expect(screen.getByText("Unspecified injury")).toBeInTheDocument();
    expect(screen.getByText("Not specified")).toBeInTheDocument();
    expect(screen.getByText("Not mentioned")).toBeInTheDocument();
    expect(screen.getAllByText("None recorded.")).toHaveLength(2);
  });
});
