"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreateInjuryDialog } from "./create-injury-dialog";
import { useInjuries } from "./injuries-provider";

// The botanical design has no page-title bar: the sidebar is the navigation
// and every screen opens with its own serif heading. So this is now only the
// two controls that have nowhere else to live — the sidebar toggle and
// "Add injury", which creates a profile rather than an entry (the sidebar's
// "New entry" button covers that).
//
// What used to sit here and is gone: a "Search records..." input wired to
// nothing, and a notifications bell with no handler and no notifications
// behind it. Neither did anything when clicked.
export function DashboardHeader() {
  const [open, setOpen] = useState(false);
  const { refresh } = useInjuries();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/85 px-4 py-3 backdrop-blur md:px-11">
      <SidebarTrigger className="-ml-1" />

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus />
          <span className="hidden sm:inline">Add injury</span>
        </Button>
      </div>

      <CreateInjuryDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={refresh}
      />
    </header>
  );
}
