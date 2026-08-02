"use client";

export default function TimelinePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Timeline</h1>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-muted-foreground">
          No timeline events recorded yet.
        </p>
      </div>
    </main>
  );
}
