"use client";

export default function SymptomsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Symptoms</h1>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-muted-foreground">No symptoms recorded yet.</p>
      </div>
    </main>
  );
}
