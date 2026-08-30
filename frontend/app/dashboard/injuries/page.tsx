"use client";

import { useEffect, useState } from "react";

import { getInjuries, type Injury } from "@/services/api";
import { InjuryCard } from "@/components/dashboard/injury-card";

export default function InjuriesPage() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInjuries() {
      try {
        setError(null);

        const data = await getInjuries();
        setInjuries(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load injuries");
      }
    }

    fetchInjuries();
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Your Injuries</h1>

      {error ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : injuries.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">No injuries yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {injuries.map((injury) => (
            <InjuryCard key={injury.id} injury={injury} />
          ))}
        </div>
      )}
    </main>
  );
}
