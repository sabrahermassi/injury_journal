"use client";

import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  createTreatmentOutcome,
  deleteTreatmentOutcome,
  getTreatmentOutcomes,
  updateTreatment,
  type TreatmentOutcome,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_PRESETS = ["Still helping", "Wearing off", "Didn't help", "Stopped"];

// Outcomes are append-only observations — see TreatmentOutcome in
// schema.prisma. Loaded lazily on expand rather than alongside every
// treatment, so this reads as a follow-up you check in on, not a second
// screen bolted onto every card.
export function TreatmentOutcomes({ treatmentId }: { treatmentId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [outcomes, setOutcomes] = useState<TreatmentOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");
  const [reliefDays, setReliefDays] = useState("");
  const [painLevel, setPainLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    let ignore = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getTreatmentOutcomes(treatmentId);
        if (!ignore) setOutcomes(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setLoadError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [expanded, treatmentId]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    // `loading` guards against the initial GET (still pending) resolving after
    // this submit and overwriting the outcome it's about to append with a
    // stale, pre-create list. The trigger button below is disabled while
    // loading for the same reason; this is a defensive second guard.
    if (!status || loading) return;

    setSaving(true);
    setError("");

    try {
      const created = await createTreatmentOutcome(treatmentId, {
        status,
        reliefDays: reliefDays ? Number(reliefDays) : undefined,
        painLevel: painLevel ? Number(painLevel) : undefined,
        notes: notes || undefined,
      });
      setOutcomes((prev) => [...prev, created]);

      // Checking in answers the follow-up prompt — clear it so Home stops
      // asking about this treatment until a new one is set.
      updateTreatment(treatmentId, { followUpDueAt: null }).catch((err) =>
        console.error(err),
      );
      setStatus("");
      setReliefDays("");
      setPainLevel("");
      setNotes("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Couldn't save that - try again.");
    } finally {
      setSaving(false);
    }
  };

  async function handleDelete(id: number) {
    try {
      await deleteTreatmentOutcome(id);
      setOutcomes((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        How&apos;s it going?
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 border-l-2 border-border pl-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : loadError ? (
            <p className="text-xs text-destructive">
              Couldn&apos;t load check-ins - try again.
            </p>
          ) : outcomes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No check-ins recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {outcomes.map((outcome) => (
                <div key={outcome.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p>{outcome.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(outcome.recordedAt).toLocaleDateString()}
                      {outcome.reliefDays != null && ` · relief lasted ~${outcome.reliefDays}d`}
                      {outcome.painLevel != null && ` · pain ${outcome.painLevel}/10`}
                    </p>
                    {outcome.notes && (
                      <p className="text-xs text-muted-foreground">{outcome.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(outcome.id)}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="xs"
                    variant={status === preset ? "default" : "outline"}
                    onClick={() => setStatus(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>

              <Input
                placeholder="Or describe it in your own words"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`relief-${treatmentId}`} className="text-xs">
                    Relief lasted (days)
                  </Label>
                  <Input
                    id={`relief-${treatmentId}`}
                    type="number"
                    min={0}
                    value={reliefDays}
                    onChange={(e) => setReliefDays(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`pain-${treatmentId}`} className="text-xs">
                    Pain now (0-10)
                  </Label>
                  <Input
                    id={`pain-${treatmentId}`}
                    type="number"
                    min={0}
                    max={10}
                    value={painLevel}
                    onChange={(e) => setPainLevel(e.target.value)}
                  />
                </div>
              </div>

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!status || saving}>
                  {saving ? "Saving..." : "Save check-in"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
            </form>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setShowForm(true)}
            >
              Record a check-in
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
