"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getInjury, type Injury } from "@/services/api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SymptomsCard } from "@/components/dashboard/symptoms-card";
import { TreatmentsCard } from "@/components/dashboard/treatments-card";
import { MedicalVisitsCard } from "@/components/dashboard/medical-visits-card";
import { TimelineCard } from "@/components/dashboard/timeline-card";

export default function InjuryDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [injury, setInjury] = useState<Injury | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchInjury() {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);

      try {
        const data = await getInjury(String(params.id));

        if (!cancelled) {
          setInjury(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          const status = (error as { status?: number }).status;
          if (status === 404) {
            setNotFound(true);
          } else {
            setLoadError(true);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInjury();

    return () => {
      cancelled = true;
    };
  }, [params.id, retryKey]);

  if (loading) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-11">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex flex-col items-start gap-3 p-4 md:p-11">
        <p className="text-muted-foreground">
          Couldn&apos;t load this injury — try again.
        </p>
        <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
          Retry
        </Button>
      </main>
    );
  }

  if (notFound || !injury) {
    return (
      <main className="flex flex-col items-start gap-3 p-4 md:p-11">
        <p className="text-muted-foreground">
          This injury profile couldn&apos;t be found.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/injuries")}>
          Back to injuries
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-11">
      {/* The design's per-injury header: the name at display size, then a
          single status line. It also shows an entry count there -- left out,
          because the counts live in the cards below and nothing on this page
          knows the total before they have each loaded. */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h2 className="font-serif text-4xl leading-tight font-light tracking-tight text-foreground md:text-[42px]">
            {injury.name}
          </h2>
          <div className="mt-3 flex items-center gap-2.5">
            <span
              className="size-[7px] flex-none rounded-full bg-accent-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground/80">
              {injury.status ? `${injury.status} · ` : ""}since{" "}
              {new Date(injury.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/log?injuryId=${injury.id}`)}
        >
          Log entry
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Area</dt>
              <dd>{injury.bodyArea}</dd>
            </div>

            {injury.side && (
              <div>
                <dt className="text-muted-foreground">Side</dt>
                <dd>{injury.side}</dd>
              </div>
            )}

            {/* Status and start date moved up into the header line above --
                repeating them here would just be the same two facts twice. */}

            {injury.cause && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Cause</dt>
                <dd>{injury.cause}</dd>
              </div>
            )}

            {injury.description && (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-muted-foreground">Description</dt>
                <dd>{injury.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <SymptomsCard injuryId={injury.id} />

      <TreatmentsCard injuryId={injury.id} />

      <MedicalVisitsCard injuryId={injury.id} />

      <TimelineCard injuryId={injury.id} />
    </main>
  );
}
