"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMedicalVisits, type MedicalVisit } from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function MedicalVisitsCard({ injuryId }: { injuryId: number }) {
  const router = useRouter();
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadVisits() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMedicalVisits(injuryId);

        if (!ignore) {
          setVisits(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Failed to load medical visits");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadVisits();

    return () => {
      ignore = true;
    };
  }, [injuryId]);

  const logHref = `/dashboard/log?injuryId=${injuryId}&type=visit`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical visits</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => router.push(logHref)}>
            Log visit
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
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground">
              No medical visits recorded yet.
            </p>
            <Button size="sm" onClick={() => router.push(logHref)}>
              Log a visit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                <p className="font-medium">{visit.doctor}</p>

                <p className="text-sm text-muted-foreground">
                  {new Date(visit.date).toLocaleDateString()}
                </p>

                {visit.clinic && (
                  <p className="text-sm">Clinic: {visit.clinic}</p>
                )}

                {visit.notes && <p className="text-sm">{visit.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
