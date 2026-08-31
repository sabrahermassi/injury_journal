"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { LogEntryForm } from "@/components/dashboard/log-entry-form";
import { Skeleton } from "@/components/ui/skeleton";

function LogPageContent() {
  const { injuries, loading } = useInjuries();
  const searchParams = useSearchParams();

  const injuryIdParam = searchParams.get("injuryId");
  const typeParam = searchParams.get("type");

  if (loading) {
    return <Skeleton className="h-80 rounded-xl" />;
  }

  return (
    <LogEntryForm
      injuries={injuries}
      defaultInjuryId={injuryIdParam ? Number(injuryIdParam) : undefined}
      defaultType={
        typeParam === "treatment" || typeParam === "visit" || typeParam === "symptom"
          ? typeParam
          : undefined
      }
    />
  );
}

export default function LogEntryPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="max-w-lg">
        <h2 className="font-heading text-xl font-medium">New entry</h2>
        <p className="text-sm text-muted-foreground">
          A symptom, a treatment you tried, or a visit — whatever happened,
          it&apos;s worth putting down while it&apos;s fresh.
        </p>
      </div>

      <div className="max-w-lg">
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <LogPageContent />
        </Suspense>
      </div>
    </main>
  );
}
