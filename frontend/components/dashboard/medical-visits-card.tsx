"use client";

import { useEffect, useState } from "react";
import { getMedicalVisits } from "@/services/api";

export function MedicalVisitsCard({ injuryId }: { injuryId: number }) {
  const [visits, setVisits] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVisits() {
      try {
        setError(null);

        const data = await getMedicalVisits(injuryId);
        setVisits(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load medical visits");
      }
    }

    loadVisits();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg-semibold">Medical Visits</h2>

      {error ? (
        <p className="mt-3 text-muted-foreground">{error}</p>
      ) : visits.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          No medical visits recorded.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {visits.map((visit) => (
            <div key={visit.id}>
              <p className="font-medium">{visit.doctor}</p>

              <p className="text-sm text-muted-foreground">
                Date: {new Date(visit.date).toLocaleDateString()}
              </p>

              {visit.clinic && (
                <p className="text-sm">Clinic: {visit.clinic}</p>
              )}

              {visit.notes && <p className="text-sm">Notes: {visit.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
