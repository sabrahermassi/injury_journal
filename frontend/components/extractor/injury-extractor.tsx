"use client";

import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { extractInjury } from "@/services/extractor-api";
import { ExtractionResult } from "./extraction-result";
import type { InjuryExtraction } from "@/lib/injury-schema";

const EXAMPLE = "My left knee hurts after squats. Pain is 7 out of 10.";

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Describe your injury</CardTitle>
          <CardDescription>
            Write in plain language. The AI will pull out the key details for
            you.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <label htmlFor="injury-description" className="font-medium">
              Injury description
            </label>

            <Textarea
              id="injury-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={EXAMPLE}
              rows={5}
              className="resize-none"
              disabled={loading}
            />

            <p className="text-sm text-muted-foreground">
              Example: &ldquo;{EXAMPLE}&rdquo; · Press{" "}
              <kbd className="rounded bg-muted px-1 font-mono text-[0.7rem]">
                Ctrl / Cmd
              </kbd>{" "}
              +{" "}
              <kbd className="rounded bg-muted px-1 font-mono text-[0.7rem]">
                Enter
              </kbd>{" "}
              to analyze.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={analyze}
                disabled={loading || description.trim().length < 3}
              >
                {!loading && <Sparkles className="mr-2 size-4" />}
                {loading ? "Analyzing..." : "Analyze Injury"}
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
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <ResultSkeleton />}
      {result && !loading && <ExtractionResult result={result} />}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-48" />
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
