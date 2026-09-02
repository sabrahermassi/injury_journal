"use client";

import { InjuryExtractor } from "@/components/extractor/injury-extractor";
import { InjuryHistory } from "@/components/extractor/injury-history";
import { AiBadge } from "@/components/ui/ai-badge";
import { ToolIcon } from "@/components/ui/tool-icon";

// Two-column treatment from the "Injury Journal Botanical" reference design:
// the paste box on the left, the extracted summary panel on the right.
//
// The heading sits above both columns rather than inside the left one, which
// is where the design puts it. Inside, it pushed the note box down by its own
// height while the summary panel stayed at the top of the row, so the two
// halves of a side-by-side comparison started at different heights.
//
// The design's voice-note recorder is deliberately not built: nothing in the
// Lambda, the backend or the data model records or transcribes audio, so it
// would be a control that does nothing.
export default function ExtractorPage() {
  return (
    <main className="flex w-full flex-1 flex-col gap-8 p-4 md:p-11">
      <header className="flex items-start gap-4">
        <ToolIcon tool="extractor" size={44} className="mt-0.5" />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl leading-none font-light tracking-tight text-foreground">
              AI Injury Extractor
            </h1>
            <AiBadge />
          </div>

          <p className="mt-2.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            Paste a clinical note, or describe the injury in your own words. We
            structure it, you check it.
          </p>
        </div>
      </header>

      <InjuryExtractor />

      <InjuryHistory />
    </main>
  );
}
