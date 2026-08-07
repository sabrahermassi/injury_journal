"use client";

import { useEffect, useState } from "react";
import { getSymptoms } from "@/services/api";

export function SymptomsCard({ injuryId }: { injuryId: number }) {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSymptoms() {
      try {
        setError(null);

        const data = await getSymptoms(injuryId);
        setSymptoms(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load symptoms");
      }
    }

    loadSymptoms();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Symptoms</h2>

      {error ? (
        <p className="mt-3 text-muted-foreground">{error}</p>
      ) : symptoms.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No symptoms recorded.</p>
      ) : (
        symptoms.map((symptom) => (
          <div key={symptom.id} className="mt-4">
            <p>Pain level: {symptom.painLevel}/10</p>

            <p>Location: {symptom.location}</p>

            {symptom.trigger && <p>Trigger: {symptom.trigger}</p>}

            {symptom.notes && <p>Notes: {symptom.notes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
