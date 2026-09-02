"use client";

import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";
import { SendHorizonal } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntryIcon } from "@/components/dashboard/entry-icon";
import { ArtIcon } from "@/components/ui/art-icon";
import {
  askAssistant,
  getInjuries,
  type AssistantAnswer,
  type Injury,
} from "@/services/api";

// Radix Select has no concept of an empty value, so "all" stands in for
// "no injuryId". It is never sent to the API -- see handleSubmit.
const ALL_INJURIES = "all";

// Mirrors the assistant's journalTool "Body area: knee (left)" formatting so
// the two surfaces describe an injury the same way.
function formatInjuryLabel(injury: Injury) {
  const area = `${injury.bodyArea}${injury.side ? ` (${injury.side})` : ""}`;

  return `${injury.name} — ${area}`;
}

export function AskForm() {
  const [question, setQuestion] = useState("");
  const [injuryId, setInjuryId] = useState(ALL_INJURIES);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [injuriesError, setInjuriesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AssistantAnswer | null>(null);
  // What was actually submitted -- `question` keeps changing if the user
  // edits the textarea after getting an answer, so the echoed bubble below
  // needs its own snapshot rather than reading live state.
  const [askedQuestion, setAskedQuestion] = useState("");

  // The injury list comes from this app's own API, not the assistant's
  // stopgap GET /injuries — the journal owns that data, and the user is
  // already authenticated here.
  useEffect(() => {
    let cancelled = false;

    async function loadInjuries() {
      try {
        const data = await getInjuries();

        if (!cancelled) {
          setInjuries(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setInjuriesError("Could not load your injuries.");
        }
      }
    }

    loadInjuries();

    return () => {
      cancelled = true;
    };
  }, []);

  // SelectContent is unmounted until the dropdown is first opened, so Radix has
  // no registered item text to reflect and SelectValue would render empty on
  // load. Passing the label explicitly is Radix's supported escape hatch.
  const selectedInjury = injuries.find(
    (injury) => String(injury.id) === injuryId,
  );
  const selectedLabel = selectedInjury
    ? formatInjuryLabel(selectedInjury)
    : "All injuries";

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("A question is required.");
      return;
    }

    setLoading(true);

    try {
      const answer = await askAssistant(
        trimmedQuestion,
        injuryId === ALL_INJURIES ? undefined : Number(injuryId),
      );

      setAskedQuestion(trimmedQuestion);
      setResult(answer);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong — try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-6.5 lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col">
        {/* The design draws a settled conversation. Before anything is asked
            there is nothing to draw, so the thread is replaced by the same
            prompt the empty state would otherwise have to invent. */}
        {result ? (
          <div className="flex flex-col">
            <div className="ml-auto max-w-[60%] rounded-[20px_20px_6px_20px] bg-accent px-5 py-4">
              <p className="text-[15px] leading-[1.5] text-foreground">
                {askedQuestion}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <ArtIcon src="/art-sparkle.png" size={30} className="mt-2" />

              <div className="min-w-0 flex-1 rounded-[20px_20px_20px_6px] bg-card px-5.5 py-5 ring-1 ring-border">
                <p className="text-[15px] leading-[1.65] whitespace-pre-wrap text-foreground/80">
                  {result.answer}
                </p>

                {result.citations && result.citations.length > 0 && (
                  <p className="mt-3.5 text-[12.5px] text-muted-foreground">
                    Based on {result.citations.length} journal{" "}
                    {result.citations.length === 1 ? "entry" : "entries"}.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] bg-secondary px-5.5 py-5">
            <p className="font-serif text-[19px] leading-[1.2] font-medium text-foreground">
              Ask about your own record
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-foreground/80">
              Which treatments helped, how a month went, what you told the last
              doctor. Every answer cites the entries behind it.
            </p>
          </div>
        )}

        {/* Kept from before, not in the design: the assistant answers per
            injury, and without this there is no way to say which one. */}
        <div className="mt-4.5 flex flex-wrap items-center gap-3">
          <Select value={injuryId} onValueChange={setInjuryId}>
            <SelectTrigger
              id="injury"
              aria-label="Injury to ask about"
              className="h-12 w-full rounded-full bg-popover px-5 text-[13.5px] ring-1 ring-border sm:w-auto sm:min-w-[240px]"
            >
              <SelectValue>{selectedLabel}</SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={ALL_INJURIES}>All injuries</SelectItem>

              {injuries.map((injury) => (
                <SelectItem key={injury.id} value={String(injury.id)}>
                  {formatInjuryLabel(injury)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {injuriesError && (
            <p className="text-sm text-destructive">{injuriesError}</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-3.5 flex items-center gap-3"
        >
          <div className="flex h-14 min-w-0 flex-1 items-center rounded-full bg-popover px-5.5 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
            <input
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.currentTarget.value)}
              maxLength={10000}
              placeholder="Ask anything about your injury…"
              aria-label="Your question"
              className="min-w-0 flex-1 bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground-subtle"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label={loading ? "Asking" : "Ask"}
            className="flex size-14 flex-none items-center justify-center rounded-full bg-accent-foreground text-background transition-[filter] hover:brightness-[0.93] disabled:opacity-50"
          >
            <SendHorizonal className="size-[21px]" aria-hidden="true" />
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="w-full flex-none rounded-3xl bg-card p-5.5 ring-1 ring-border lg:w-[380px]">
        <p className="text-[11px] leading-none font-medium tracking-[0.14em] text-muted-foreground-subtle uppercase">
          Sources
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {result?.citations && result.citations.length > 0 ? (
            result.citations.map((citation, index) => (
              <div
                key={`${citation.sourceType ?? "source"}-${citation.sourceId}-${index}`}
                className="flex items-center gap-3 rounded-[18px] bg-popover p-3.5 ring-1 ring-border"
              >
                <EntryIcon icon={citation.icon} size={40} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[15px] leading-[1.2] font-medium text-foreground">
                    {citation.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] leading-[1.3] text-muted-foreground">
                    {[citation.sourceType, citation.date]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <span className="flex-none text-[11.5px] text-muted-foreground-subtle">
                  #{citation.sourceId}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {loading
                ? "Looking through your entries…"
                : "The entries behind an answer are listed here once you ask something."}
            </p>
          )}
        </div>

        <p className="mt-4 text-[11.5px] leading-[1.6] text-muted-foreground-subtle">
          Always review with your healthcare professional.
        </p>
      </div>
    </div>
  );
}
