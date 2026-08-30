import { Stethoscope } from "lucide-react";
import { InjuryExtractor } from "@/components/injury-extractor";
import { InjuryHistory } from "@/components/injury-history";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Stethoscope className="size-6" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            AI Injury Extractor
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            Describe an injury in your own words and get a clean, structured
            breakdown of the condition, symptoms, and likely causes.
          </p>
        </div>
      </header>

      <InjuryExtractor />

      <InjuryHistory />
    </main>
  );
}
