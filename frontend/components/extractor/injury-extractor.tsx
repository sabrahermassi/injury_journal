"use client";

import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { extractInjury } from "@/services/extractor-api";
import { ExtractionResult } from "./extraction-result";
import { AcceptExtraction } from "./accept-extraction";
import type { InjuryExtraction } from "@/lib/injury-schema";

const EXAMPLE = "My left knee hurts after squats. Pain is 7 out of 10.";

// Numbered steps mirror the reference design ("1. Paste the note",
// "2. Extracted summary"). The page heading sits above this component, not
// inside the left column, so both columns start at the same height -- see the
// note in app/dashboard/extractor/page.tsx.
export function InjuryExtractor() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InjuryExtraction | null>(null);

  async function analyze() {
    if (description.trim().length < 3 || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractInjury(description);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey) &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      analyze();
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-7">
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">1.</span>
          <label
            htmlFor="injury-description"
            className="text-sm text-muted-foreground"
          >
            Paste the note
          </label>
        </div>

        <div className="mt-3 rounded-[20px] bg-popover ring-1 ring-border">
          <Textarea
            id="injury-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={EXAMPLE}
            rows={6}
            disabled={loading}
            className="min-h-40 resize-none border-0 bg-transparent p-[22px] text-[15px] leading-[1.75] shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
          <span className="text-xs text-muted-foreground-subtle">
            {description.length} characters
          </span>

          {description && !loading && (
            <button
              type="button"
              onClick={() => setDescription("")}
              className="text-xs font-medium text-accent-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            className="flex-1"
            onClick={analyze}
            disabled={loading || description.trim().length < 3}
          >
            {!loading && <Sparkles className="mr-2 size-4" />}
            {loading ? "Analyzing..." : "Analyze injury"}
          </Button>

          {!description && (
            <Button
              variant="ghost"
              onClick={() => setDescription(EXAMPLE)}
              disabled={loading}
            >
              Try an example
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground-subtle">
          Press Ctrl / Cmd + Enter to analyze.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-5">
            <AlertCircle />
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex w-full flex-none flex-col lg:w-[430px]">
        <div className="flex min-h-full flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          <div className="flex items-center gap-3 px-[22px] pt-5 pb-3.5">
            <span className="text-sm font-semibold text-foreground">2.</span>
            <h2 className="font-serif text-xl text-foreground">
              Extracted summary
            </h2>
          </div>

          {loading ? (
            <ResultSkeleton />
          ) : result ? (
            <>
              <ExtractionResult result={result} />
              <AcceptExtraction result={result} note={description} />
            </>
          ) : (
            <p className="px-[22px] pb-6 text-sm text-muted-foreground text-pretty">
              Nothing extracted yet. Paste a note and run it to see the
              structured breakdown here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-[22px] pb-6">
      <Skeleton className="h-6 w-40 rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}
