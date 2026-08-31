"use client";

import { Bell, Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreateInjuryDialog } from "./create-injury-dialog";
import { useInjuries } from "./injuries-provider";

const TITLES: Record<string, string> = {
  "/dashboard": "Today",
  "/dashboard/injuries": "Your Injuries",
  "/dashboard/timeline": "Timeline",
  "/dashboard/insights": "Insights",
  "/dashboard/log": "New Entry",
  "/dashboard/settings": "Settings",
  "/dashboard/extractor": "AI Extractor",
};

export function DashboardHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { injuries, refresh } = useInjuries();

  // The header sits above every dashboard page now, so the title comes from the
  // route. On an injury detail page we can name the injury, because the shell
  // already holds the list.
  function title() {
    if (TITLES[pathname]) return TITLES[pathname];

    const match = pathname.match(/^\/dashboard\/injuries\/(\d+)$/);
    if (match) {
      const injury = injuries.find((i) => i.id === Number(match[1]));
      return injury?.name ?? "Injury";
    }

    return "Injury Journal";
  }

  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex flex-1 flex-col">
          <h1 className="text-base font-semibold leading-tight md:text-lg">
            {title()}
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="relative hidden w-64 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search records..."
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          <span className="hidden sm:inline">Add Injury</span>
        </Button>

        <CreateInjuryDialog
          open={open}
          onOpenChange={setOpen}
          onCreated={refresh}
        />
      </div>
    </header>
  );
}
