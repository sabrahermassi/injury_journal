"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

// The botanical design has no page-title bar: the sidebar is the navigation
// and every screen opens with its own serif heading. All that is left here is
// the sidebar toggle, which has nowhere else to live.
//
// What used to sit here and is gone: a "Search records..." input wired to
// nothing, a notifications bell with no notifications behind it, and "Add
// injury" -- a new injury is created from inside the New entry modal now,
// which is where you are when you discover you need one.
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/85 px-4 py-3 backdrop-blur md:px-11">
      <SidebarTrigger className="-ml-1" />
    </header>
  );
}
