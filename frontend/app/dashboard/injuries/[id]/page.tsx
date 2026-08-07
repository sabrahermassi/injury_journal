"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getInjury } from "@/services/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SymptomsCard } from "@/components/dashboard/symptoms-card";
import { TreatmentsCard } from "@/components/dashboard/treatments-card";
import { MedicalVisitsCard } from "@/components/dashboard/medical-visits-card";
import { TimelineCard } from "@/components/dashboard/timeline-card";

export default function InjuryDetailsPage() {
  const params = useParams();

  const [injury, setInjury] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setInjury(null);

    async function fetchInjury() {
      try {
        const data = await getInjury(String(params.id));

        if (!cancelled) {
          setInjury(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
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
    return <p className="p-6">Loading injury...</p>;
  }

  if (!injury) {
    return <p className="p-6">Injury not found</p>;
  }

  return (
    <main className="flex flex-col gap-6 p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{injury.name}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Area:</strong> {injury.bodyArea}
            </p>

            <p>
              <strong>Side:</strong> {injury.side}
            </p>

            <p>
              <strong>Status:</strong> {injury.status}
            </p>

            <p>
              <strong>Cause:</strong> {injury.cause}
            </p>

            <p>
              <strong>Description:</strong> {injury.description}
            </p>

            <p>
              <strong>Started:</strong>{" "}
              {new Date(injury.startDate).toLocaleDateString()}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {new Date(injury.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <SymptomsCard injuryId={injury.id} />

      <TreatmentsCard injuryId={injury.id} />

      <MedicalVisitsCard injuryId={injury.id} />

      <TimelineCard injuryId={injury.id} />
    </main>
  );
}
