"use client";

import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">AI Assistant</CardTitle>
          <CardDescription>
            Your recovery companion — every answer cites the entry it came
            from.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="injury">Injury</Label>

              <Select value={injuryId} onValueChange={setInjuryId}>
                <SelectTrigger id="injury" className="w-full">
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

              {injuriesError ? (
                <p className="text-sm text-destructive">{injuriesError}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {injuries.length === 0
                    ? "No injuries yet — add one to ask about it."
                    : "Leave as All injuries to search across all of them."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>

              <Textarea
                id="question"
                placeholder="What treatments have I tried?"
                maxLength={10000}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Asking..." : "Ask"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="flex flex-col gap-3">
          {/* Echoes what was actually asked -- see askedQuestion above -- as
              a chat-style bubble, matching the design's conversation
              treatment. This isn't a real multi-turn thread: the form still
              answers one question at a time, submitting again replaces this. */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm text-secondary-foreground">
              {askedQuestion}
            </div>
          </div>

          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-4 py-3.5 text-sm whitespace-pre-wrap text-card-foreground ring-1 ring-foreground/10">
            {result.answer}
          </div>

          {result.citations && result.citations.length > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Sources
              </p>

              <div className="flex flex-col gap-2">
                {result.citations.map((citation, index) => (
                  <div
                    key={`${citation.sourceType ?? "source"}-${citation.sourceId}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-2.5 ring-1 ring-foreground/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-serif text-sm text-foreground">
                        {citation.label}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[citation.sourceType, citation.date]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="flex-none rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      #{citation.sourceId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
