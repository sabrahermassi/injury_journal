import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";

// Restyled to the "Injury Journal Botanical" reference design's hero
// treatment: eyebrow pill, large serif headline, two CTAs. The design's
// full landing page also has a feature grid, a chart preview and a
// clinician-summary CTA banner -- left out here, since none of those exist
// as real content/routes yet and this is a light pass, not a rebuild.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 px-6 py-6 md:px-14">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <HeartPulse className="size-4" aria-hidden="true" />
        </div>
        <span className="font-serif text-lg text-foreground">
          Injury Journal
        </span>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Button asChild>
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center px-6 py-16 md:px-14">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-medium text-foreground/80">
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            For anyone living with a long recovery
          </span>

          <h1 className="text-4xl leading-[1.05] font-light tracking-tight text-balance text-foreground md:text-6xl">
            Your injury,
            <br />
            finally written down.
          </h1>

          <p className="max-w-md text-base leading-7 text-muted-foreground">
            Symptoms, treatments and appointments, kept in order over months
            and years - so you can see what actually helped, and answer
            &ldquo;when did this start?&rdquo; without reconstructing it from
            memory.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Start your journal</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
