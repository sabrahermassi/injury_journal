"use client";

import { useState } from "react";
import { getInjuryHistory } from "@/services/extractor-api";
import { InjuryHistoryEntry } from "@/lib/injury-schema";
import { Button } from "@/components/ui/button";
import { InjuryHistoryCard } from "./injury-history-card";

export function InjuryHistory() {
  const [injuries, setInjuries] = useState<InjuryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const data = await getInjuryHistory();

      setInjuries(data);
      setHasLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load injury history",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={loadHistory} disabled={loading}>
        {loading ? "Loading..." : "Get Injury History"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {injuries.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Injury History</h2>

          {injuries.map((injury) => (
            <InjuryHistoryCard key={injury.entryId} injury={injury} />
          ))}
        </div>
      )}

      {hasLoaded && !loading && !error && injuries.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No saved injury entries.
        </p>
      )}
    </div>
  );
}
