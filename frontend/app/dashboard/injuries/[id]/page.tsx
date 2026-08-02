"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getInjury } from "@/services/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InjuryDetailsPage() {
  const params = useParams();

  const [injury, setInjury] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInjury() {
      try {
        const data = await getInjury(String(params.id));
        setInjury(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjury();
  }, [params.id]);

  if (loading) {
    return <p className="p-6">Loading injury...</p>;
  }

  if (!injury) {
    return <p className="p-6">Injury not found</p>;
  }

  return (
    <main className="p-6">
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
    </main>
  );
}
