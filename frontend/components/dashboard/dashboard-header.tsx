"use client";

import { Bell, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreateInjuryDialog } from "./create-injury-dialog";

export function DashboardHeader({
  onInjuryCreated,
}: {
  onInjuryCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex flex-1 flex-col">
          <h1 className="text-base font-semibold leading-tight md:text-lg">
            Recovery Overview
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
          onCreated={onInjuryCreated}
        />
      </div>
    </header>
  );
}
