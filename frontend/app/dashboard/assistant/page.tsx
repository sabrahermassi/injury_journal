"use client";

import { Sparkles } from "lucide-react";
import { AskForm } from "@/components/assistant/ask-form";

export default function AssistantPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ask your journal
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            Ask a question about what you&apos;ve logged — which treatments
            helped, or a summary across one injury or all of them. Answers
            are grounded in your own entries and cite them.
          </p>
        </div>
      </header>

      <AskForm />
    </main>
  );
}
