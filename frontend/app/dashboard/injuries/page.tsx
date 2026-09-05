"use client";

import { InjuryCard } from "@/components/dashboard/injury-card";
import { useInjuries } from "@/components/dashboard/injuries-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function InjuriesPage() {
  const { injuries, loading, error, refresh } = useInjuries();

  return (
    <main className="flex flex-1 flex-col gap-7 p-4 md:p-11">
      <div>
        <h2 className="font-serif text-4xl leading-tight font-light tracking-tight text-foreground md:text-[42px]">
          Your injuries
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
          Each profile keeps its own symptoms, treatments and visits together.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-3xl bg-card p-6 ring-1 ring-border">
          <p className="text-muted-foreground">Failed to load injuries.</p>
          <button
            onClick={refresh}
            className="text-[13.5px] font-medium text-accent-foreground hover:text-foreground"
          >
            Retry
          </button>
        </div>
      ) : injuries.length === 0 ? (
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <p className="text-muted-foreground">
            No injury profiles yet — use &ldquo;Add injury&rdquo; above to start
            one.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {injuries.map((injury) => (
            <InjuryCard key={injury.id} injury={injury} />
          ))}
        </div>
      )}
    </main>
  );
}
