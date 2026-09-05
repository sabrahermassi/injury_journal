"use client";

import { useState } from "react";
import Link from "next/link";

import { acceptExtraction, type Injury } from "@/services/api";
import { useInjuries } from "@/components/dashboard/injuries-provider";
import type { InjuryExtraction } from "@/lib/injury-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NEW_INJURY = "new";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * The design's "Accept summary" step, wired to POST /api/extractions/accept.
 *
 * It asks where the summary should go rather than guessing. Matching an
 * extraction to an existing injury by name would be the app quietly deciding
 * that "lower back pain" and "Lower Back Strain" are the same complaint, and
 * getting that wrong merges two conditions in a medical record.
 */
export function AcceptExtraction({
  result,
  note,
}: {
  result: InjuryExtraction;
  note: string;
}) {
  const { injuries, refresh } = useInjuries();

  const [target, setTarget] = useState<string>(NEW_INJURY);
  const [name, setName] = useState(result.injuryName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<Injury | null>(null);

  const creatingNew = target === NEW_INJURY;
  const canSave = creatingNew ? name.trim().length > 0 : true;

  async function handleAccept() {
    if (!canSave) return;

    setSaving(true);
    setError(false);

    try {
      const created = await acceptExtraction({
        ...(creatingNew
          ? { injuryName: name.trim() }
          : { injuryId: Number(target) }),
        bodyArea: result.bodyArea || "Not specified",
        painLevel: result.painLevel ?? null,
        symptoms: result.symptoms,
        possibleCauses: result.possibleCauses,
        note: note.trim() || undefined,
      });

      setSaved(created.injury);
      // The sidebar and every injury picker read this list.
      refresh();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="border-t border-border px-[22px] py-5">
        <p className="text-sm text-foreground">
          Saved to your journal under{" "}
          <span className="font-medium">{saved.name}</span>.
        </p>
        <Link
          href={`/dashboard/injuries/${saved.id}`}
          className="mt-2 inline-block text-[13px] font-medium text-accent-foreground hover:text-foreground"
        >
          Open it
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 border-t border-border px-[22px] py-5">
      <div className="space-y-2">
        <Label htmlFor="accept-target">Save this to</Label>
        <select
          id="accept-target"
          className={selectClassName}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value={NEW_INJURY}>A new injury profile</option>
          {injuries.map((injury) => (
            <option key={injury.id} value={injury.id}>
              {injury.name}
            </option>
          ))}
        </select>
      </div>

      {creatingNew && (
        <div className="space-y-2">
          <Label htmlFor="accept-name">Name it</Label>
          <Input
            id="accept-name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Lower back strain"
          />
        </div>
      )}

      <Button onClick={handleAccept} disabled={!canSave || saving}>
        {saving ? "Saving..." : "Save to my journal"}
      </Button>

      {/* Said plainly, because the difference matters when a clinician reads
          this back: a pain level is what turns the extracted symptoms into
          real check-ins, and there is no honest number to use without one. */}
      <p className="text-xs leading-relaxed text-muted-foreground-subtle">
        {result.painLevel === undefined || result.painLevel === null
          ? "No pain level was found in the note, so the symptoms are kept with the entry rather than logged as check-ins."
          : `Each symptom is logged as a check-in at ${result.painLevel}/10. The original note is kept with the entry.`}
      </p>

      {error && (
        <p className="text-sm text-destructive">
          Couldn&apos;t save that - nothing was written. Try again.
        </p>
      )}
    </div>
  );
}
