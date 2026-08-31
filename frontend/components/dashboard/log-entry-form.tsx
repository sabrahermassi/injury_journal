"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmitEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Injury } from "@/services/api";
import { createSymptom, createTreatment, createMedicalVisit } from "@/services/api";

type EntryType = "symptom" | "treatment" | "visit";

const ENTRY_LABELS: Record<EntryType, string> = {
  symptom: "Symptom",
  treatment: "Treatment",
  visit: "Medical visit",
};

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function todayLocalDate() {
  return new Date().toISOString().slice(0, 10);
}

export function LogEntryForm({
  injuries,
  defaultInjuryId,
  defaultType,
}: {
  injuries: Injury[];
  defaultInjuryId?: number;
  defaultType?: EntryType;
}) {
  const router = useRouter();

  const [injuryId, setInjuryId] = useState<number>(
    defaultInjuryId ?? injuries[0]?.id,
  );
  const [entryType, setEntryType] = useState<EntryType>(defaultType ?? "symptom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Symptom fields
  const [painLevel, setPainLevel] = useState(3);
  const [location, setLocation] = useState("");
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");

  // Treatment fields
  const [treatmentName, setTreatmentName] = useState("");
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [checkBackInDays, setCheckBackInDays] = useState("");

  // Visit fields
  const [doctor, setDoctor] = useState("");
  const [clinic, setClinic] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  const [date, setDate] = useState(todayLocalDate());

  function resetFields() {
    setPainLevel(3);
    setLocation("");
    setTrigger("");
    setNotes("");
    setTreatmentName("");
    setProvider("");
    setCost("");
    setCheckBackInDays("");
    setDoctor("");
    setClinic("");
    setVisitNotes("");
    setDate(todayLocalDate());
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!injuryId) return;

    setLoading(true);
    setError("");
    setSaved(false);

    const isoDate = new Date(date).toISOString();

    try {
      if (entryType === "symptom") {
        await createSymptom(injuryId, {
          date: isoDate,
          painLevel,
          location,
          trigger: trigger || undefined,
          notes: notes || undefined,
        });
      } else if (entryType === "treatment") {
        const followUpDueAt = checkBackInDays
          ? new Date(
              new Date(isoDate).getTime() +
                Number(checkBackInDays) * 24 * 60 * 60 * 1000,
            ).toISOString()
          : undefined;

        await createTreatment(injuryId, {
          name: treatmentName,
          date: isoDate,
          provider: provider || undefined,
          cost: cost ? Number(cost) : undefined,
          followUpDueAt,
        });
      } else {
        await createMedicalVisit(injuryId, {
          doctor,
          date: isoDate,
          clinic: clinic || undefined,
          notes: visitNotes || undefined,
        });
      }

      setSaved(true);
      resetFields();
    } catch (err) {
      console.error(err);
      setError("Could not save this entry — try again.");
    } finally {
      setLoading(false);
    }
  };

  if (injuries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-2">
          <p className="text-muted-foreground">
            You&apos;ll need an injury profile before you can log anything
            against it.
          </p>
          <Button onClick={() => router.push("/dashboard/injuries")}>
            Set up an injury profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-2">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ENTRY_LABELS) as EntryType[]).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={entryType === type ? "default" : "outline"}
              onClick={() => setEntryType(type)}
            >
              {ENTRY_LABELS[type]}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="injury">Injury</Label>
            <select
              id="injury"
              className={selectClassName}
              value={injuryId}
              onChange={(e) => setInjuryId(Number(e.target.value))}
            >
              {injuries.map((injury) => (
                <option key={injury.id} value={injury.id}>
                  {injury.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              max={todayLocalDate()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {entryType === "symptom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="painLevel">
                  Pain level — <span className="tabular font-serif">{painLevel}</span>/10
                </Label>
                <input
                  id="painLevel"
                  type="range"
                  min={1}
                  max={10}
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Lower back, left side"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">What brought it on</Label>
                <Input
                  id="trigger"
                  placeholder="Sitting for a long stretch"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {entryType === "treatment" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="treatmentName">What did you try</Label>
                <Input
                  id="treatmentName"
                  placeholder="Physio session, cortisone injection..."
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  placeholder="Dr. Okafor"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkBackInDays">
                  Check back in (days) — optional
                </Label>
                <Input
                  id="checkBackInDays"
                  type="number"
                  min={0}
                  placeholder="e.g. 14"
                  value={checkBackInDays}
                  onChange={(e) => setCheckBackInDays(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll surface a reminder on your home screen to ask how
                  it went.
                </p>
              </div>
            </>
          )}

          {entryType === "visit" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Input
                  id="doctor"
                  placeholder="Dr. Okafor"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic</Label>
                <Input
                  id="clinic"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitNotes">Notes</Label>
                <Textarea
                  id="visitNotes"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                />
              </div>
            </>
          )}

          <Button type="submit" disabled={loading || !injuryId}>
            {loading ? "Saving..." : "Save entry"}
          </Button>

          {saved && (
            <p className="text-sm text-muted-foreground">
              Noted and added to the record.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
