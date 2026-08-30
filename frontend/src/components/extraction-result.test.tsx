import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExtractionResult } from "./extraction-result";

describe("ExtractionResult", () => {
  it("renders all extracted fields", () => {
    render(
      <ExtractionResult
        result={{
          injuryName: "Sprained ankle",
          bodyArea: "ankle",
          painLevel: 6,
          symptoms: ["swelling", "bruising"],
          possibleCauses: ["twisted while running"],
        }}
      />,
    );

    expect(screen.getByText("Sprained ankle")).toBeInTheDocument();
    expect(screen.getByText("ankle")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("swelling")).toBeInTheDocument();
    expect(screen.getByText("bruising")).toBeInTheDocument();
    expect(screen.getByText("twisted while running")).toBeInTheDocument();
  });

  it("shows fallback copy for missing/empty fields", () => {
    render(
      <ExtractionResult
        result={{
          injuryName: "",
          bodyArea: "",
          symptoms: [],
          possibleCauses: [],
        }}
      />,
    );

    expect(screen.getByText("Unspecified injury")).toBeInTheDocument();
    expect(screen.getByText("Not specified")).toBeInTheDocument();
    expect(screen.getByText("Not mentioned")).toBeInTheDocument();
    expect(screen.getByText("No symptoms detected.")).toBeInTheDocument();
    expect(screen.getByText("No causes detected.")).toBeInTheDocument();
  });
});
