"use client";

import { useState } from "react";
import type { SubmitEventHandler } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createInjury } from "@/services/api";

import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewInjuryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bodyArea, setBodyArea] = useState("");
  const [side, setSide] = useState("");
  const [startDate, setStartDate] = useState("");
  const [cause, setCause] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createInjury({
        name,
        bodyArea,
        side,
        startDate: new Date(startDate).toISOString(),
        cause,
        description,
        status: "Active",
      });

      router.push("/dashboard");
    } catch {
      setError("Could not create injury");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Injury</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Injury name</Label>
              <Input
                id="name"
                placeholder="Lower back pain and pelvis"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyArea">Body area</Label>
              <Input
                id="bodyArea"
                placeholder="Lower back and pelvis"
                value={bodyArea}
                onChange={(event) => setBodyArea(event.currentTarget.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Input
                id="side"
                placeholder="Left"
                value={side}
                onChange={(event) => setSide(event.currentTarget.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.currentTarget.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cause">Cause</Label>
              <Input
                id="cause"
                placeholder="Deadlift"
                value={cause}
                onChange={(event) => setCause(event.currentTarget.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Started after heavy lifting"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Injury"}
            </Button>

            <Link
              href="/dashboard"
              className="block text-center text-sm text-muted-foreground underline"
            >
              Cancel
            </Link>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
