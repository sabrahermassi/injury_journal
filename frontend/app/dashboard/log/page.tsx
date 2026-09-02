"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { LogEntryForm } from "@/components/dashboard/log-entry-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AiBadge } from "@/components/ui/ai-badge";

function LogPageContent() {
  const { injuries, loading } = useInjuries();
  const searchParams = useSearchParams();

  const injuryIdParam = searchParams.get("injuryId");
  const typeParam = searchParams.get("type");

  if (loading) {
    return <Skeleton className="h-80 rounded-xl" />;
  }

  const parsedInjuryId = injuryIdParam ? Number(injuryIdParam) : NaN;
  const defaultInjuryId = injuries.some((injury) => injury.id === parsedInjuryId)
    ? parsedInjuryId
    : undefined;

  return (
    <LogEntryForm
      injuries={injuries}
      defaultInjuryId={defaultInjuryId}
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
    <main className="flex flex-1 flex-col gap-5 p-4 md:p-11">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl leading-tight font-normal text-foreground">
          New entry
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          A symptom, a treatment you tried, or a visit — whatever happened,
          it&apos;s worth putting down while it&apos;s fresh.
        </p>
      </div>

      {/* The design offers this as "the Injury Extractor fills the fields for
          you". It doesn't: the extractor keeps its own records and nothing
          pipes its output into this form, so this is a plain link to that
          tool rather than a promise it will populate anything. */}
      <Link
        href="/dashboard/extractor"
        className="flex max-w-2xl items-center gap-3.5 rounded-[18px] bg-secondary p-4 transition-colors hover:bg-accent"
      >
        <Image
          src="/art-sparkle.png"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          className="size-7 flex-none select-none"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-serif text-[17px] leading-tight font-medium text-foreground">
              Have a clinical note?
            </span>
            <AiBadge />
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            Run it through the Injury Extractor to pull out the structure
          </p>
        </div>

        <ChevronRight
          className="size-4 flex-none text-accent-foreground"
          aria-hidden="true"
        />
      </Link>

      <div className="max-w-2xl">
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <LogPageContent />
        </Suspense>
      </div>
    </main>
  );
}
