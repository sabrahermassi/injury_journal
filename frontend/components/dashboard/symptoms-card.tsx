"use client";

import { useEffect, useState } from "react";

import { getSymptoms, type Symptom } from "@/services/api";
import { painToneClass } from "@/lib/pain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewEntry } from "@/components/dashboard/new-entry-provider";

export function SymptomsCard({ injuryId }: { injuryId: number }) {
  const { openNewEntry } = useNewEntry();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSymptoms() {
      try {
        setLoading(true);
        setError(null);

        const data = await getSymptoms(injuryId);

        if (!ignore) {
          setSymptoms(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Failed to load symptoms");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSymptoms();

    return () => {
      ignore = true;
    };
  }, [injuryId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Symptoms</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => openNewEntry({ injuryId, kind: "Symptom" })}>
            Log symptom
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
        ) : symptoms.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground">
              No symptoms recorded yet for this injury.
            </p>
            <Button size="sm" onClick={() => openNewEntry({ injuryId, kind: "Symptom" })}>
              Log your first symptom
            </Button>
          </div>
        ) : (
          symptoms.map((symptom) => (
            <div key={symptom.id} className="flex gap-4 border-t pt-4 first:border-t-0 first:pt-0">
              <div className="flex flex-col items-center">
                <span
                  className={`font-serif tabular text-2xl leading-none ${painToneClass(symptom.painLevel)}`}
                >
                  {symptom.painLevel}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>

              <div className="flex-1 space-y-0.5">
                <p className="text-sm text-muted-foreground">
                  {new Date(symptom.date).toLocaleDateString()}
                </p>
                {symptom.location && <p>{symptom.location}</p>}
                {symptom.trigger && (
                  <p className="text-sm text-muted-foreground">
                    Trigger: {symptom.trigger}
                  </p>
                )}
                {symptom.notes && <p className="text-sm">{symptom.notes}</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
