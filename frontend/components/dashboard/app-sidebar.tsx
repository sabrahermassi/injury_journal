"use client";

import {
  Activity,
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  Pill,
  Settings,
  Stethoscope,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const mainNav = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    title: "Injuries",
    url: "/dashboard/injuries",
    icon: HeartPulse,
    badge: "3",
  },
  {
    title: "Symptoms",
    url: "/dashboard/symptoms",
    icon: Activity,
    badge: "5",
  },
  {
    title: "Treatments",
    url: "/dashboard/treatments",
    icon: Pill,
  },
  {
    title: "Medical Visits",
    url: "/dashboard/visits",
    icon: CalendarDays,
    badge: "3",
  },
];

const secondaryNav = [
  { title: "Providers", icon: Stethoscope },
  { title: "Settings", icon: Settings },
  { title: "Help & Support", icon: LifeBuoy },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              Injury Journal
            </span>
            <span className="text-xs text-muted-foreground">
              Recovery tracker
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Care</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="size-9">
            <AvatarImage src="/patient-avatar.png" alt="Jordan Avery" />
            <AvatarFallback>JA</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">Jordan Avery</span>
            <span className="truncate text-xs text-muted-foreground">
              Patient ID · 48213
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
