"use client";

import { useEffect, useState } from "react";

import { getInjuries } from "@/services/api";
import { InjuryCard } from "@/components/dashboard/injury-card";

export default function InjuriesPage() {
  const [injuries, setInjuries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInjuries() {
      try {
        const data = await getInjuries();
        setInjuries(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuries();
  }, []);

  if (loading) {
    return <p>Loading injuries...</p>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Your Injuries</h1>

      {injuries.length === 0 ? (
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
