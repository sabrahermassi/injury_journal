"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  createSymptom,
  createTreatment,
  createMedicalVisit,
  createTimelineEvent,
  type VoiceExtraction,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function toLocalInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(local: string) {
  const date = local ? new Date(local) : new Date();
  return date.toISOString();
}

function updateAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function ExtractionReview({
  injuryId,
  extraction,
  onSaved,
}: {
  injuryId: number;
  extraction: VoiceExtraction;
  onSaved: () => void;
}) {
  const [data, setData] = useState<VoiceExtraction>(extraction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems =
    data.symptoms.length +
    data.treatments.length +
    data.medicalVisits.length +
    data.timelineEvents.length;

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      for (const symptom of data.symptoms) {
        await createSymptom(injuryId, {
          date: symptom.date,
          painLevel: Number(symptom.painLevel),
          location: symptom.location ?? "",
          trigger: symptom.trigger ?? undefined,
          duration: symptom.duration ?? undefined,
          notes: symptom.notes ?? undefined,
        });
      }

      for (const treatment of data.treatments) {
        await createTreatment(injuryId, {
          name: treatment.name,
          date: treatment.date,
          provider: treatment.provider ?? undefined,
          cost: treatment.cost ?? undefined,
          outcome: treatment.outcome ?? undefined,
        });
      }

      for (const visit of data.medicalVisits) {
        await createMedicalVisit(injuryId, {
          doctor: visit.doctor ?? "",
          date: visit.date,
          clinic: visit.clinic ?? undefined,
          notes: visit.notes ?? undefined,
        });
      }

      for (const event of data.timelineEvents) {
        await createTimelineEvent(injuryId, {
          type: event.type,
          date: event.date,
          description: event.description,
          result: event.result ?? undefined,
        });
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError(
        "Something failed while saving — items already saved above stay saved. Try again to save the rest.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (totalItems === 0) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Nothing to review</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Claude didn&apos;t find any symptoms, treatments, visits, or timeline
          events in that entry. Try dictating again with more detail.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.symptoms.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">
            Symptoms ({data.symptoms.length})
          </h2>

          <div className="mt-4 space-y-4">
            {data.symptoms.map((symptom, index) => (
              <div
                key={index}
                className="relative grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  aria-label="Remove symptom"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      symptoms: removeAt(d.symptoms, index),
                    }))
                  }
                >
                  <Trash2 />
                </Button>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(symptom.date)}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        symptoms: updateAt(d.symptoms, index, {
                          date: fromLocalInput(e.target.value),
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pain level (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={symptom.painLevel}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        symptoms: updateAt(d.symptoms, index, {
                          painLevel: Number(e.target.value),
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={symptom.location ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        symptoms: updateAt(d.symptoms, index, {
                          location: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Input
                    value={symptom.trigger ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        symptoms: updateAt(d.symptoms, index, {
                          trigger: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={symptom.notes ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        symptoms: updateAt(d.symptoms, index, {
                          notes: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.treatments.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">
            Treatments ({data.treatments.length})
          </h2>

          <div className="mt-4 space-y-4">
            {data.treatments.map((treatment, index) => (
              <div
                key={index}
                className="relative grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  aria-label="Remove treatment"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      treatments: removeAt(d.treatments, index),
                    }))
                  }
                >
                  <Trash2 />
                </Button>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={treatment.name}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        treatments: updateAt(d.treatments, index, {
                          name: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(treatment.date)}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        treatments: updateAt(d.treatments, index, {
                          date: fromLocalInput(e.target.value),
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={treatment.provider ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        treatments: updateAt(d.treatments, index, {
                          provider: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Input
                    value={treatment.outcome ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        treatments: updateAt(d.treatments, index, {
                          outcome: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.medicalVisits.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">
            Medical visits ({data.medicalVisits.length})
          </h2>

          <div className="mt-4 space-y-4">
            {data.medicalVisits.map((visit, index) => (
              <div
                key={index}
                className="relative grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  aria-label="Remove visit"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      medicalVisits: removeAt(d.medicalVisits, index),
                    }))
                  }
                >
                  <Trash2 />
                </Button>

                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Input
                    value={visit.doctor ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        medicalVisits: updateAt(d.medicalVisits, index, {
                          doctor: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(visit.date)}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        medicalVisits: updateAt(d.medicalVisits, index, {
                          date: fromLocalInput(e.target.value),
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Clinic</Label>
                  <Input
                    value={visit.clinic ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        medicalVisits: updateAt(d.medicalVisits, index, {
                          clinic: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={visit.notes ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        medicalVisits: updateAt(d.medicalVisits, index, {
                          notes: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.timelineEvents.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">
            Timeline events ({data.timelineEvents.length})
          </h2>

          <div className="mt-4 space-y-4">
            {data.timelineEvents.map((event, index) => (
              <div
                key={index}
                className="relative grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  aria-label="Remove timeline event"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      timelineEvents: removeAt(d.timelineEvents, index),
                    }))
                  }
                >
                  <Trash2 />
                </Button>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={event.type}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        timelineEvents: updateAt(d.timelineEvents, index, {
                          type: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(event.date)}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        timelineEvents: updateAt(d.timelineEvents, index, {
                          date: fromLocalInput(e.target.value),
                        }),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={event.description}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        timelineEvents: updateAt(d.timelineEvents, index, {
                          description: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : `Save ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
