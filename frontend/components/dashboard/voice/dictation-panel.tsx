"use client";

import { useEffect, useRef, useState } from "react";
import "@corti/dictation-web";
import type {
  CortiDictation,
  CommandEventDetail,
  TranscriptEventDetail,
  UsageEventDetail,
  DeltaUsageEventDetail,
  ErrorEventDetail,
} from "@corti/dictation-web";

import { getVoiceToken } from "@/services/api";

function deleteLastSentence(text: string) {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  sentences.pop();
  return sentences.join(" ");
}

export function DictationPanel({
  transcript,
  onTranscriptChange,
}: {
  transcript: string;
  onTranscriptChange: (value: string) => void;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const transcriptRef = useRef(transcript);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const [interim, setInterim] = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  transcriptRef.current = transcript;
  onTranscriptChangeRef.current = onTranscriptChange;

  useEffect(() => {
    const el = elementRef.current as CortiDictation | null;
    if (!el) return;

    const handleReady = () => {
      el.authConfig = {
        refreshAccessToken: async () => {
          const token = await getVoiceToken();
          return { accessToken: token.accessToken, expiresIn: token.expiresIn };
        },
      };

      el.dictationConfig = {
        primaryLanguage: "en",
        interimResults: true,
        automaticPunctuation: true,
        spokenPunctuation: false,
        formatting: {
          numbers: "numerals_above_nine",
          measurements: "abbreviated",
        },
        commands: [
          {
            id: "delete_range",
            phrases: ["delete {delete_range}", "clear {delete_range}"],
            variables: [
              {
                key: "delete_range",
                type: "enum",
                enum: ["the last sentence", "that", "everything"],
              },
            ],
          },
        ],
      };
    };

    const handleTranscript = (event: Event) => {
      const message = (event as CustomEvent<TranscriptEventDetail>).detail;
      // TranscriptEventDetail also covers the ambient component's Stream
      // variant, which corti-dictation never emits — data is an array there,
      // so this check both excludes it and narrows the type for TS.
      if (Array.isArray(message.data)) return;

      setSessionActive(true);
      const { text, isFinal } = message.data;

      if (isFinal) {
        setInterim("");
        if (text.trim()) {
          const next = transcriptRef.current
            ? `${transcriptRef.current} ${text}`
            : text;
          onTranscriptChangeRef.current(next);
        }
      } else {
        setInterim(text);
      }
    };

    const handleCommand = (event: Event) => {
      const message = (event as CustomEvent<CommandEventDetail>).detail;
      setSessionActive(true);
      setInterim("");

      if (message.data.id !== "delete_range") return;

      const range = message.data.variables?.delete_range;
      if (range === "everything") {
        onTranscriptChangeRef.current("");
      } else if (range === "the last sentence" || range === "that") {
        onTranscriptChangeRef.current(deleteLastSentence(transcriptRef.current));
      }
    };

    const handleUsage = (event: Event) => {
      const message = (event as CustomEvent<UsageEventDetail>).detail;
      setCredits(message.credits);
    };

    const handleDeltaUsage = (event: Event) => {
      const message = (event as CustomEvent<DeltaUsageEventDetail>).detail;
      setCredits(message.credits);
    };

    const handleError = (event: Event) => {
      const message = (event as CustomEvent<ErrorEventDetail>).detail;
      setError(message.message);
    };

    el.addEventListener("ready", handleReady);
    el.addEventListener("transcript", handleTranscript);
    el.addEventListener("command", handleCommand);
    el.addEventListener("usage", handleUsage);
    el.addEventListener("delta-usage", handleDeltaUsage);
    el.addEventListener("error", handleError);

    return () => {
      el.removeEventListener("ready", handleReady);
      el.removeEventListener("transcript", handleTranscript);
      el.removeEventListener("command", handleCommand);
      el.removeEventListener("usage", handleUsage);
      el.removeEventListener("delta-usage", handleDeltaUsage);
      el.removeEventListener("error", handleError);
      el.closeConnection?.();
    };
  }, []);

  const creditsLabel = !sessionActive
    ? "—"
    : credits === null
      ? "pending…"
      : credits.toFixed(4);

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="rounded-lg border border-border bg-card p-3">
        <corti-dictation ref={elementRef as React.Ref<HTMLElement>} />

        {interim && (
          <p className="mt-2 text-sm text-muted-foreground italic">{interim}</p>
        )}
      </div>

      <details className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">Voice commands</summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>&ldquo;Delete the last sentence&rdquo; — removes the sentence you just dictated</li>
          <li>&ldquo;Delete that&rdquo; — same as above</li>
          <li>&ldquo;Delete everything&rdquo; — clears the entry and starts over</li>
        </ul>
      </details>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Credits used this session</span>
        <span className="font-mono">{creditsLabel}</span>
      </div>
    </div>
  );
}
