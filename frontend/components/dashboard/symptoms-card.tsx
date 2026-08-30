"use client";

import { useEffect, useState } from "react";
import { getSymptoms, type Symptom } from "@/services/api";

export function SymptomsCard({ injuryId }: { injuryId: number }) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSymptoms() {
      try {
        setLoading(true);
        setError(null);
        setSymptoms([]);

        const data = await getSymptoms(injuryId);

        if (!ignore) {
          setSymptoms(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Failed to load symptoms");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSymptoms();

    return () => {
      ignore = true;
    };
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Symptoms</h2>

      {loading ? (
        <p className="mt-3 text-muted-foreground">Loading symptoms...</p>
      ) : error ? (
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
