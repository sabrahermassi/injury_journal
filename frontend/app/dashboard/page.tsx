"use client";

import { useEffect, useState } from "react";
import { getInjuries } from "../../services/api";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InjuryCard } from "@/components/dashboard/injury-card";

export default function DashboardPage() {
  const [injuries, setInjuries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInjuries() {
      try {
        const data = await getInjuries();
        setInjuries(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuries();
  }, []);

  if (loading) {
    return <p>Loading injuries...</p>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <DashboardHeader />

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <h1 className="text-2xl font-semibold">Recovery Overview</h1>

          {injuries.length === 0 ? (
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
