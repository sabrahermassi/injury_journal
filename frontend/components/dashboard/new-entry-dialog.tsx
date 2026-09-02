"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import {
  createSymptom,
  createTreatment,
  createMedicalVisit,
  type Injury,
} from "@/services/api";
import { useInjuries } from "./injuries-provider";
import { useNewEntry } from "./new-entry-provider";
import { CreateInjuryDialog } from "./create-injury-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AiBadge } from "@/components/ui/ai-badge";
import { ToolIcon } from "@/components/ui/tool-icon";

/**
 * The reference design's ten-step pain ramp — a finer-grained sibling of the
 * five `--pain-*` tokens in globals.css. Used only here, on the swatches
 * themselves, so it stays a local constant rather than ten more theme tokens.
 *
 * Steps 1–8 are the design's own hexes. Steps 9 and 10 are its last two with
 * their OKLab lightness raised (hue and chroma held exactly): as drawn they
 * were `#A9757F` and `#916678`, and the selected swatch — full opacity under
 * a 15px semibold numeral — measured 3.9:1 and 3.1:1 against this ink, below
 * the 4.5:1 that text this size needs.
 *
 * Ink alone could not fix it. Step 9 sits at mid luminance, so it fails both
 * ways (3.9:1 dark, 3.5:1 light) and even pure black only reaches 4.4:1 on
 * step 10 — the swatch itself had to move. Lightness was the only axis
 * touched, so the sweep still reads as the same hue progression, and the
 * ramp's lightness spread narrows from 0.273 to 0.177, which is closer to the
 * constant-lightness rule UI_GUIDE.md sets out than the design was.
 *
 * Now: 4.58:1 at worst selected, 8.05:1 at worst unselected (0.55 over the
 * modal surface).
 */
const RAMP = [
  "#AEBCA4",
  "#BDC2A1",
  "#CCC79F",
  "#D9C79A",
  "#E2BD93",
  "#DDAC8C",
  "#D19A8A",
  "#C08789",
  "#B6818B",
  "#AF8295",
];

type Kind = "Symptom" | "Visit" | "Treatment";

const KINDS: Kind[] = ["Symptom", "Visit", "Treatment"];

type Draft = {
  kind: Kind;
  injuryId: number;
  injuryName: string;
  title: string;
  meta: string;
  payload: Record<string, unknown>;
};

// Only the staged list needs a stable identity, and only React needs it. It is
// handed out when an entry is staged, never while building the draft -- that
// runs during render (to decide whether "Save" is live) and must stay pure.
type Staged = Draft & { key: number };

// `<input type="date">` and toISOString() both work in UTC; naive use of
// either shifts the day for anyone west of UTC. Same helpers as the log form.
function todayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function localDateToIso(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
}

const FIELD =
  "flex h-[50px] w-full items-center justify-between rounded-[14px] bg-popover px-4 text-left text-sm font-medium text-foreground ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LABEL = "mb-2 block text-xs font-medium text-muted-foreground";

export function NewEntryDialog() {
  const { open, options, closeNewEntry } = useNewEntry();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeNewEntry();
      }}
    >
      {/* Radix supplies what a hand-rolled overlay does badly: a real focus
          trap, scroll lock, Escape, and restoring focus to whatever opened
          it. The classes below reset its defaults to the design's sheet --
          620px, 26px radius, its own surface, no ring, no inner padding. */}
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[rgba(20,41,34,0.3)] supports-backdrop-filter:backdrop-blur-none"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[620px] flex-col gap-0 overflow-y-auto rounded-[26px] bg-entry-surface p-0 ring-0 shadow-[0_30px_70px_-30px_rgba(20,41,34,0.5)] sm:max-w-[620px] md:max-h-[calc(100dvh-5rem)]"
      >
        {/* Keyed so every open starts from the initialisers rather than
            whatever the last entry left behind. */}
        {open && (
          <NewEntryForm
            key={`${options.injuryId ?? "any"}-${options.kind ?? "Symptom"}`}
            options={options}
            onClose={closeNewEntry}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewEntryForm({
  options,
  onClose,
}: {
  options: { injuryId?: number; kind?: Kind };
  onClose: () => void;
}) {
  const { injuries, refresh } = useInjuries();

  const [kind, setKind] = useState<Kind>(options.kind ?? "Symptom");
  const [injuryId, setInjuryId] = useState<number | undefined>(
    options.injuryId,
  );
  const [injuryOpen, setInjuryOpen] = useState(false);
  const [creatingInjury, setCreatingInjury] = useState(false);

  const [pain, setPain] = useState(3);
  const [doctor, setDoctor] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [provider, setProvider] = useState("");
  const [outcome, setOutcome] = useState("");
  const [date, setDate] = useState(todayLocalDate());
  const [notes, setNotes] = useState("");

  const [staged, setStaged] = useState<Staged[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stagedKey = useRef(0);

  const selectedInjury: Injury | undefined =
    injuries.find((injury) => injury.id === injuryId) ?? injuries[0];

  function resetFields() {
    setPain(3);
    setDoctor("");
    setTreatmentName("");
    setProvider("");
    setOutcome("");
    setDate(todayLocalDate());
    setNotes("");
  }

  function currentEntry(): Draft | null {
    if (!selectedInjury) return null;

    const iso = localDateToIso(date);
    const base = {
      kind,
      injuryId: selectedInjury.id,
      injuryName: selectedInjury.name,
      meta: new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    };

    if (kind === "Symptom") {
      return {
        ...base,
        title: `Pain ${pain}/10 · ${selectedInjury.name}`,
        payload: { date: iso, painLevel: pain, notes: notes || undefined },
      };
    }

    if (kind === "Visit") {
      if (!doctor.trim()) return null;
      return {
        ...base,
        title: `${doctor.trim()} · ${selectedInjury.name}`,
        payload: {
          doctor: doctor.trim(),
          date: iso,
          notes: notes || undefined,
        },
      };
    }

    if (!treatmentName.trim()) return null;
    return {
      ...base,
      title: `${treatmentName.trim()} · ${selectedInjury.name}`,
      payload: {
        name: treatmentName.trim(),
        date: iso,
        provider: provider.trim() || undefined,
        outcome: outcome.trim() || undefined,
      },
    };
  }

  const ready = currentEntry() !== null;

  function addAnother() {
    const entry = currentEntry();
    if (!entry) return;

    setStaged((list) => [...list, { ...entry, key: (stagedKey.current += 1) }]);
    resetFields();
    setError(null);
  }

  async function persist(entry: Draft) {
    if (entry.kind === "Symptom") {
      await createSymptom(entry.injuryId, entry.payload as never);
    } else if (entry.kind === "Visit") {
      await createMedicalVisit(entry.injuryId, entry.payload as never);
    } else {
      await createTreatment(entry.injuryId, entry.payload as never);
    }
  }

  async function save() {
    const entry = currentEntry();
    // Keyed here too: on a partial failure the unsaved remainder goes back
    // into the staged list, which needs stable identities to render.
    const queue: Staged[] = entry
      ? [...staged, { ...entry, key: (stagedKey.current += 1) }]
      : staged;

    if (queue.length === 0) return;

    setSaving(true);
    setError(null);

    // Saved one at a time, oldest first. There is no batch endpoint, so a
    // failure part-way through leaves the earlier entries written — the
    // survivors stay staged and the message says exactly how many landed,
    // rather than pretending the whole thing rolled back.
    for (let i = 0; i < queue.length; i += 1) {
      try {
        await persist(queue[i]);
      } catch (err) {
        console.error(err);
        setStaged(queue.slice(i));
        setSaving(false);
        setError(
          i === 0
            ? "Couldn't save that - nothing was written. Try again."
            : `Saved ${i} of ${queue.length}. The rest are still here - try again.`,
        );
        return;
      }
    }

    setSaving(false);
    refresh();
    onClose();
  }

  const total = staged.length + (ready ? 1 : 0);
  const saveLabel =
    total > 1 ? `Save ${total} entries` : saving ? "Saving..." : "Save entry";

  return (
    <>
      <CreateInjuryDialog
        open={creatingInjury}
        onOpenChange={setCreatingInjury}
        onCreated={(created) => {
          // Select it directly, from the record the create call returned --
          // not by re-fetching and guessing which entry in the refreshed list
          // is newest. getInjuries has no orderBy, so that order is not
          // guaranteed to put it anywhere in particular.
          setInjuryId(created.id);
          refresh();
        }}
      />

      <div className="flex items-start justify-between gap-4 px-6.5 pt-6 pb-4">
        <div>
          <DialogTitle className="font-serif text-[28px] leading-[1.12] font-normal text-foreground">
            New entry
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
            Log as many as you like, then save them together
          </DialogDescription>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 flex-none items-center justify-center rounded-xl bg-popover text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6.5 pb-6.5">
        {/* The design's copy here is "The Injury Extractor fills the fields
              for you". It doesn't — the extractor keeps its own records and
              files them straight into the journal from its own screen, with
              no path back into this form. Reworded to what actually happens;
              everything else about the card is the design's. */}
        <Link
          href="/dashboard/extractor"
          onClick={onClose}
          className="flex items-center gap-3.5 rounded-[18px] bg-secondary p-4 transition-[filter] hover:brightness-[0.985]"
        >
          <ToolIcon tool="extractor" size={36} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-serif text-[17px] leading-[1.2] font-medium text-foreground">
                Paste a clinical note
              </span>
              <AiBadge />
            </div>
            <p className="mt-1 text-[12.5px] leading-[1.4] text-foreground/80">
              The Injury Extractor structures it and files it for you
            </p>
          </div>

          <ChevronRight
            className="size-[17px] flex-none text-accent-foreground"
            aria-hidden="true"
          />
        </Link>

        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="min-w-0 flex-1">
            <span className={LABEL}>Injury</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setInjuryOpen((wasOpen) => !wasOpen)}
                aria-expanded={injuryOpen}
                className={FIELD}
              >
                <span className="truncate">
                  {selectedInjury?.name ?? "No injury profiles yet"}
                </span>
                <ChevronDown
                  className="size-3.5 flex-none text-muted-foreground-subtle"
                  aria-hidden="true"
                />
              </button>

              {injuryOpen && (
                <div className="absolute top-[57px] right-0 left-0 z-10 overflow-hidden rounded-[14px] bg-popover shadow-[0_10px_26px_-16px_rgba(20,41,34,0.42)] ring-1 ring-border">
                  {injuries.map((injury) => (
                    <button
                      key={injury.id}
                      type="button"
                      onClick={() => {
                        setInjuryId(injury.id);
                        setInjuryOpen(false);
                      }}
                      className={cn(
                        "block w-full px-4 py-3 text-left text-[13.5px] text-foreground transition-colors hover:bg-muted",
                        injury.id === selectedInjury?.id && "bg-muted",
                      )}
                    >
                      {injury.name}
                    </button>
                  ))}

                  {/* Opens the create-injury dialog over this one. It used to
                      navigate to the injuries list, which closed the entry you
                      were part-way through and left you on a page with no way
                      to create anything - the broken path. */}
                  <button
                    type="button"
                    onClick={() => {
                      setInjuryOpen(false);
                      setCreatingInjury(true);
                    }}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-[13.5px] font-semibold text-accent-foreground transition-colors hover:bg-muted"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add a new injury
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* The design has a fourth pill here, "Appt". There is no
                  scheduled-appointment model — MedicalVisit records a visit
                  that already happened — so a fourth tab would open a panel
                  whose Save could not write anything. */}
            <span className={LABEL}>What are you logging</span>
            <div className="flex gap-[7px]">
              {KINDS.map((option) => {
                const active = kind === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setKind(option)}
                    aria-pressed={active}
                    className={cn(
                      "h-[50px] flex-1 rounded-full text-[12.5px] font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground ring-1 ring-[#C6D6C8] dark:ring-accent"
                        : "bg-popover text-foreground/80 ring-1 ring-border hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {kind === "Symptom" && (
          <div>
            <div className="mb-[9px] flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pain today
              </span>
              <span className="text-[12.5px] text-foreground/80">
                {pain} of 10
              </span>
            </div>

            <div className="flex gap-1.5">
              {RAMP.map((color, index) => {
                const level = index + 1;
                const active = pain === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPain(level)}
                    aria-label={`Pain ${level} out of 10`}
                    aria-pressed={active}
                    className="h-[52px] flex-1 rounded-[13px] text-[15px] font-semibold text-[#1E2A22] transition-opacity"
                    style={{
                      background: color,
                      opacity: active ? 1 : 0.55,
                      boxShadow: active
                        ? "inset 0 0 0 2px #3B5C4A"
                        : "inset 0 0 0 2px transparent",
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kind === "Visit" && (
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1">
              <label className={LABEL} htmlFor="entry-doctor">
                Who did you see
              </label>
              <input
                id="entry-doctor"
                value={doctor}
                onChange={(event) => setDoctor(event.currentTarget.value)}
                placeholder="GP, physio, specialist…"
                className={cn(
                  FIELD,
                  "placeholder:text-muted-foreground-subtle",
                )}
              />
            </div>

            <div className="sm:w-[150px] sm:flex-none">
              <label className={LABEL} htmlFor="entry-visit-date">
                Date
              </label>
              <input
                id="entry-visit-date"
                type="date"
                value={date}
                max={todayLocalDate()}
                onChange={(event) => setDate(event.currentTarget.value)}
                className={FIELD}
              />
            </div>
          </div>
        )}

        {kind === "Treatment" && (
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className={LABEL} htmlFor="entry-treatment">
                Treatment
              </label>
              <input
                id="entry-treatment"
                value={treatmentName}
                onChange={(event) =>
                  setTreatmentName(event.currentTarget.value)
                }
                placeholder="Physiotherapy"
                className={cn(
                  FIELD,
                  "placeholder:text-muted-foreground-subtle",
                )}
              />
            </div>

            {/* The design's middle column is "How long". Treatment has no
                  duration field (name, provider, date, cost, outcome,
                  followUpDueAt), so this slot takes the provider instead of
                  a control with nowhere to save to. */}
            <div className="sm:w-[130px] sm:flex-none">
              <label className={LABEL} htmlFor="entry-provider">
                Provider
              </label>
              <input
                id="entry-provider"
                value={provider}
                onChange={(event) => setProvider(event.currentTarget.value)}
                placeholder="Dr. Okafor"
                className={cn(
                  FIELD,
                  "placeholder:text-muted-foreground-subtle",
                )}
              />
            </div>

            <div className="sm:w-[190px] sm:flex-none">
              <label className={LABEL} htmlFor="entry-outcome">
                How did it leave you
              </label>
              <input
                id="entry-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.currentTarget.value)}
                placeholder="Felt better"
                className={cn(
                  "flex h-[50px] w-full items-center rounded-[14px] bg-accent px-4 text-[13px] font-medium text-accent-foreground ring-1 ring-[#C6D6C8] outline-none placeholder:text-accent-foreground/60 focus-visible:ring-2 focus-visible:ring-ring dark:ring-accent",
                )}
              />
            </div>
          </div>
        )}

        <div>
          <label className={LABEL} htmlFor="entry-notes">
            Notes
          </label>
          <textarea
            id="entry-notes"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            placeholder="Anything you want to remember"
            className="min-h-[84px] w-full resize-none rounded-2xl bg-popover p-4 text-[13.5px] leading-[1.65] text-foreground ring-1 ring-border outline-none placeholder:text-muted-foreground-subtle focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {staged.length > 0 && (
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-[11px] leading-none font-medium tracking-[0.12em] text-accent-foreground uppercase">
              Ready to save
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {staged.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center gap-3 rounded-xl bg-popover px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] leading-[1.25] font-medium text-foreground">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {entry.kind} · {entry.meta}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${entry.title}`}
                    onClick={() =>
                      setStaged((list) =>
                        list.filter((item) => item.key !== entry.key),
                      )
                    }
                    className="flex-none text-muted-foreground-subtle transition-colors hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={addAnother}
            disabled={!ready || saving}
            className="flex h-[54px] flex-none items-center gap-2.5 rounded-full bg-popover px-5 text-[13.5px] font-semibold text-foreground/80 ring-1 ring-border transition-colors hover:ring-[#CFD8C9] disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add another
          </button>

          <button
            type="button"
            onClick={save}
            disabled={total === 0 || saving}
            className="h-[54px] flex-1 rounded-full bg-primary text-[14.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}
