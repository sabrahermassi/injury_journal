"use client";

import { useEffect, useState } from "react";

import { getTreatments, type Treatment } from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TreatmentOutcomes } from "@/components/dashboard/treatment-outcomes";
import { useNewEntry } from "@/components/dashboard/new-entry-provider";

export function TreatmentsCard({ injuryId }: { injuryId: number }) {
  const { openNewEntry } = useNewEntry();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadTreatments() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTreatments(injuryId);

        if (!ignore) {
          setTreatments(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Failed to load treatments");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTreatments();

    return () => {
      ignore = true;
    };
  }, [injuryId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatments</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => openNewEntry({ injuryId, kind: "Treatment" })}>
            Log treatment
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : treatments.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground">
              Nothing logged yet - treatments you try are what this app is
              for.
            </p>
            <Button size="sm" onClick={() => openNewEntry({ injuryId, kind: "Treatment" })}>
              Log your first treatment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {treatments.map((treatment) => (
              <div key={treatment.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                <p className="font-medium">{treatment.name}</p>

                <p className="text-sm text-muted-foreground">
                  {new Date(treatment.date).toLocaleDateString()}
                </p>

                {treatment.provider && (
                  <p className="text-sm">Provider: {treatment.provider}</p>
                )}

                {treatment.cost !== null && treatment.cost !== undefined && (
                  <p className="text-sm">Cost: {treatment.cost}</p>
                )}

                {treatment.outcome && (
                  <p className="text-sm">Outcome: {treatment.outcome}</p>
                )}

                <TreatmentOutcomes treatmentId={treatment.id} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
