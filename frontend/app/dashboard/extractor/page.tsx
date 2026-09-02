"use client";

import Image from "next/image";

import { InjuryExtractor } from "@/components/extractor/injury-extractor";
import { InjuryHistory } from "@/components/extractor/injury-history";
import { AiBadge } from "@/components/ui/ai-badge";

// Two-column treatment from the "Injury Journal Botanical" reference design:
// heading + paste box on the left, extracted summary panel on the right,
// top-aligned with the heading. The header is passed into InjuryExtractor
// rather than sitting above it because the design puts it inside the left
// column, beside the summary panel.
//
// The design's voice-note recorder is deliberately not built: nothing in the
// Lambda, the backend or the data model records or transcribes audio, so it
// would be a control that does nothing.
export default function ExtractorPage() {
  return (
    <main className="flex w-full flex-1 flex-col gap-10 p-6 md:p-11">
      <InjuryExtractor>
        <header className="flex items-start gap-4">
          <Image
            src="/art-sparkle.png"
            alt=""
            width={38}
            height={38}
            className="mt-1 size-[38px] flex-none"
          />

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-4xl leading-none font-light tracking-tight text-foreground">
                AI Injury Extractor
              </h1>
              <AiBadge />
            </div>

            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground text-pretty">
              Paste a clinical note, or describe the injury in your own words.
              We structure it, you check it.
            </p>
          </div>
        </header>
      </InjuryExtractor>

      <InjuryHistory />
    </main>
  );
}
