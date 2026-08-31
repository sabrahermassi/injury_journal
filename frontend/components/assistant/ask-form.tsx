"use client";

import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  type AssistantCitation,
  type AssistantAnswer,
  type Injury,
} from "@/services/api";

// Radix Select has no concept of an empty value, so "all" stands in for
// "no injuryId". It is never sent to the API -- see handleSubmit.
const ALL_INJURIES = "all";

function formatCitation(citation: AssistantCitation) {
  const parts = [citation.label, citation.sourceType, `#${citation.sourceId}`];

  if (citation.date) {
    parts.push(citation.date);
  }

  return parts.filter(Boolean).join(" — ");
}

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
        <CardContent className="pt-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">{result.answer}</p>

            {result.citations && result.citations.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium">Citations</h2>

                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.citations.map((citation, index) => (
                    <li
                      key={`${citation.sourceType ?? "source"}-${citation.sourceId}-${index}`}
                    >
                      {formatCitation(citation)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
