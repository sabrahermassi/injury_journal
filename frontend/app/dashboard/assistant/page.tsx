"use client";

import Image from "next/image";

import { AskForm } from "@/components/assistant/ask-form";
import { AiBadge } from "@/components/ui/ai-badge";

export default function AssistantPage() {
  return (
    <main className="flex flex-1 flex-col gap-7 p-4 md:p-11">
      <header className="flex items-start gap-3.5">
        <Image
          src="/art-sparkle.png"
          alt=""
          width={38}
          height={38}
          aria-hidden="true"
          className="mt-1 size-[38px] flex-none select-none"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3.5">
            <h2 className="font-serif text-4xl leading-tight font-light tracking-tight text-foreground md:text-[42px]">
              AI Assistant
            </h2>
            <AiBadge />
          </div>

          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Ask about your own record — which treatments helped, or a summary
            across one injury or all of them. Every answer cites the entries
            behind it.
          </p>
        </div>
      </header>

      <AskForm />
    </main>
  );
}
