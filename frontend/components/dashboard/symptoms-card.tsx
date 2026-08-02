"use client";

import { useEffect, useState } from "react";
import { getSymptoms } from "@/services/api";

export function SymptomsCard({ injuryId }: { injuryId: number }) {
  const [symptoms, setSymptoms] = useState<any[]>([]);

  useEffect(() => {
    async function loadSymptoms() {
      const data = await getSymptoms(injuryId);
      setSymptoms(data);
    }

    loadSymptoms();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Symptoms</h2>

      {symptoms.length === 0 ? (
        <p className="text-muted-foreground">No symptoms recorded.</p>
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
