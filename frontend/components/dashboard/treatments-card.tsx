"use client";

import { useEffect, useState } from "react";
import { getTreatments, type Treatment } from "@/services/api";

export function TreatmentsCard({ injuryId }: { injuryId: number }) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTreatments() {
      try {
        setError(null);

        const data = await getTreatments(injuryId);
        setTreatments(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load treatments");
      }
    }

    loadTreatments();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Treatments</h2>

      {error ? (
        <p className="mt-3 text-muted-foreground">{error}</p>
      ) : treatments.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No treatments recorded.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {treatments.map((treatment) => (
            <div key={treatment.id}>
              <p className="font-medium">{treatment.name}</p>

              <p className="text-sm text-muted-foreground">
                Date: {new Date(treatment.date).toLocaleDateString()}
              </p>

              {treatment.provider && (
                <p className="text-sm">Provider: {treatment.provider}</p>
              )}

              {treatment.cost !== undefined && (
                <p className="text-sm">Cost: {treatment.cost}</p>
              )}

              {treatment.outcome && (
                <p className="text-sm">Outcome: {treatment.outcome}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
