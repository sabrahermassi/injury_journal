import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-xl flex-col gap-10">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold">Injury Journal</span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Keep the record of your injury in one place.
          </h1>

          <p className="max-w-md leading-7 text-muted-foreground">
            Symptoms, treatments and appointments, kept in order over months and
            years — so you can see what actually helped, and answer &ldquo;when
            did this start?&rdquo; without reconstructing it from memory.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
