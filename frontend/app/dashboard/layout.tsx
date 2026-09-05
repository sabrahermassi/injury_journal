import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InjuriesProvider } from "@/components/dashboard/injuries-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InjuriesProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <DashboardHeader />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </InjuriesProvider>
  );
}
