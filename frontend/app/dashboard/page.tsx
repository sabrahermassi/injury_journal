"use client";

import { useEffect, useState } from "react";
import { getInjuries, type Injury } from "../../services/api";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InjuryCard } from "@/components/dashboard/injury-card";

export default function DashboardPage() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInjuries() {
      try {
        setError(null);

        const data = await getInjuries();
        setInjuries(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load injuries");
      }
    }

    fetchInjuries();
  }, []);

  async function refreshInjuries() {
    try {
      setError(null);

      const data = await getInjuries();
      setInjuries(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load injuries");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onNavigate={setActiveSection} />

      <SidebarInset>
        <DashboardHeader onInjuryCreated={refreshInjuries} />

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <h1 className="text-2xl font-semibold">
            {activeSection === "overview" && "Recovery Overview"}
            {activeSection === "injuries" && "Your Injuries"}
          </h1>

          {activeSection === "overview" && (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-muted-foreground">Recovery overview content</p>
            </div>
          )}

          {activeSection === "injuries" && (
            <>
              {error ? (
                <div className="rounded-xl border bg-card p-6">
                  <p className="text-muted-foreground">
                    Failed to load injuries.
                  </p>
                  <button onClick={refreshInjuries} className="mt-4 underline">
                    Retry
                  </button>
                </div>
              ) : injuries.length === 0 ? (
                <div className="rounded-xl border bg-card p-6">
                  <p className="text-muted-foreground">No injuries yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {injuries.map((injury) => (
                    <InjuryCard key={injury.id} injury={injury} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
