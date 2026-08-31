"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getInjury, type Injury } from "@/services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
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

  useEffect(() => {
    let cancelled = false;

    async function fetchInjury() {
      setLoading(true);
      setNotFound(false);

      try {
        const data = await getInjury(String(params.id));

        if (!cancelled) {
          setInjury(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setNotFound(true);
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
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </main>
    );
  }

  if (notFound || !injury) {
    return (
      <main className="flex flex-col items-start gap-3 p-4 md:p-6">
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
    <main className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{injury.name}</CardTitle>
          <CardAction>
            <Button
              size="sm"
              onClick={() => router.push(`/dashboard/log?injuryId=${injury.id}`)}
            >
              Log entry
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
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

            {injury.status && (
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{injury.status}</dd>
              </div>
            )}

            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd>{new Date(injury.startDate).toLocaleDateString()}</dd>
            </div>

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
