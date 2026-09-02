import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InjuriesProvider } from "@/components/dashboard/injuries-provider";
import { NewEntryProvider } from "@/components/dashboard/new-entry-provider";
import { NewEntryDialog } from "@/components/dashboard/new-entry-dialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InjuriesProvider>
      <NewEntryProvider>
        <SidebarProvider>
          <AppSidebar />

          <SidebarInset>
            <DashboardHeader />

            {children}
          </SidebarInset>
        </SidebarProvider>

        {/* Outside the sidebar shell so the overlay covers the sidebar too,
            which is what the design shows. */}
        <NewEntryDialog />
      </NewEntryProvider>
    </InjuriesProvider>
  );
}
