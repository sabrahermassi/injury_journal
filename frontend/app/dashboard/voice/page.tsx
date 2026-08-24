"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Plus } from "lucide-react";

import {
  getInjuries,
  createInjury,
  extractVoiceEntry,
  type VoiceExtraction,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExtractionReview } from "@/components/dashboard/voice/extraction-review";

// @corti/dictation-web registers a custom element that extends HTMLElement
// at module load time, which crashes Next's server-side prerender (no DOM
// in Node). Load it client-only so the module never evaluates during SSR.
const DictationPanel = dynamic(
  () =>
    import("@/components/dashboard/voice/dictation-panel").then(
      (mod) => mod.DictationPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading microphone…</p>
    ),
  },
);

type InjuryOption = { id: number; name: string; bodyArea: string };

export default function VoiceEntryPage() {
  const [injuries, setInjuries] = useState<InjuryOption[]>([]);
  const [loadingInjuries, setLoadingInjuries] = useState(true);
  const [selectedInjuryId, setSelectedInjuryId] = useState<number | null>(null);

  const [newName, setNewName] = useState("");
  const [newBodyArea, setNewBodyArea] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<VoiceExtraction | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedInjury = injuries.find((i) => i.id === selectedInjuryId) ?? null;

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getInjuries();
        if (!ignore) setInjuries(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoadingInjuries(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  function resetEntry() {
    setSelectedInjuryId(null);
    setTranscript("");
    setExtraction(null);
    setExtractError(null);
    setSaved(false);
  }

  async function handleCreateInjury() {
    setCreating(true);
    setCreateError(null);

    try {
      const injury = await createInjury({
        name: newName,
        bodyArea: newBodyArea,
        side: null,
        startDate: new Date().toISOString(),
        cause: null,
        description: null,
        status: "Active",
      });

      setInjuries((list) => [...list, injury]);
      setSelectedInjuryId(injury.id);
      setNewName("");
      setNewBodyArea("");
    } catch (err) {
      console.error(err);
      setCreateError("Could not create injury");
    } finally {
      setCreating(false);
    }
  }

  async function handleExtract() {
    if (!selectedInjury) return;

    setExtracting(true);
    setExtractError(null);

    try {
      const result = await extractVoiceEntry(selectedInjury.id, transcript);
      setExtraction(result);
    } catch (err) {
      console.error(err);
      setExtractError(
        err instanceof Error ? err.message : "Extraction failed",
      );
    } finally {
      setExtracting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft />
          </Link>
        </Button>

        <div>
          <h1 className="text-xl font-semibold">Log by voice</h1>
          <p className="text-sm text-muted-foreground">
            Speak freely about how this injury is doing — pain, what
            triggered it, treatments, appointments.
          </p>
        </div>
      </div>

      {!selectedInjury && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Which injury is this about?</h2>

          {loadingInjuries ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Loading your injuries...
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {injuries.map((injury) => (
                <button
                  key={injury.id}
                  type="button"
                  onClick={() => setSelectedInjuryId(injury.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{injury.name}</span>
                  <span className="text-muted-foreground">
                    {injury.bodyArea}
                  </span>
                </button>
              ))}

              {injuries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any injuries yet — create one below.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Or create a new injury</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-injury-name">Injury name</Label>
                <Input
                  id="new-injury-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Lower back pain"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-injury-area">Body area</Label>
                <Input
                  id="new-injury-area"
                  value={newBodyArea}
                  onChange={(e) => setNewBodyArea(e.target.value)}
                  placeholder="Lower back"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateInjury}
              disabled={creating || !newName.trim() || !newBodyArea.trim()}
            >
              <Plus /> {creating ? "Creating..." : "Create and continue"}
            </Button>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
        </section>
      )}

      {selectedInjury && !saved && (
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedInjury.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedInjury.bodyArea}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={resetEntry}>
              Change
            </Button>
          </div>

          <div className="mt-4">
            <DictationPanel
              transcript={transcript}
              onTranscriptChange={setTranscript}
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="transcript">Entry</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              placeholder="Your dictated entry appears here — you can also type or edit it directly."
            />
          </div>

          <Button
            className="mt-4 w-full"
            onClick={handleExtract}
            disabled={extracting || !transcript.trim()}
          >
            {extracting ? "Reading your entry..." : "Get structured summary"}
          </Button>

          {extractError && (
            <p className="mt-2 text-sm text-destructive">{extractError}</p>
          )}
        </section>
      )}

      {selectedInjury && extraction && !saved && (
        <ExtractionReview
          injuryId={selectedInjury.id}
          extraction={extraction}
          onSaved={() => setSaved(true)}
        />
      )}

      {saved && selectedInjury && (
        <section className="rounded-xl border bg-card p-5 text-center">
          <h2 className="text-lg font-semibold">Saved</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your entry has been added to {selectedInjury.name}.
          </p>

          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/injuries/${selectedInjury.id}`}>
                View injury
              </Link>
            </Button>

            <Button
              onClick={() => {
                setTranscript("");
                setExtraction(null);
                setSaved(false);
              }}
            >
              Log another entry
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
