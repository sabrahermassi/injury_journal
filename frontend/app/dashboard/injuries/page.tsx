"use client";

import { InjuryCard } from "@/components/dashboard/injury-card";
import { useInjuries } from "@/components/dashboard/injuries-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function InjuriesPage() {
  const { injuries, loading, error, refresh } = useInjuries();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">Failed to load injuries.</p>
          <button onClick={refresh} className="mt-4 underline">
            Retry
          </button>
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
