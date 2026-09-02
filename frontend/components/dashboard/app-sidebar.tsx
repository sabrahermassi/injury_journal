"use client";

import {
  Clock,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  MessageCircleQuestion,
  Plus,
  Settings,
  Sparkles,
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNewEntry } from "./new-entry-provider";

// Pill nav rows at the reference design's proportions: 48px tall, fully
// rounded, 11px gap. The design's own nav is a flat list of five because it
// only mocks five screens; this app has eight real routes, so the groups
// stay — dropping them would make the list harder to scan, and dropping the
// entries would strand real pages.
const NAV_ITEM_CLASS =
  "h-12 gap-[11px] rounded-full px-3.5 text-sm data-[active=true]:font-medium";

const trackingNav = [
  { title: "Today", href: "/dashboard", icon: LayoutDashboard },
  { title: "Injuries", href: "/dashboard/injuries", icon: HeartPulse },
  { title: "Timeline", href: "/dashboard/timeline", icon: Clock },
  { title: "Insights", href: "/dashboard/insights", icon: LineChart },
];

const toolsNav = [
  { title: "AI Extractor", href: "/dashboard/extractor", icon: Sparkles },
  { title: "Ask your journal", href: "/dashboard/assistant", icon: MessageCircleQuestion },
];

const secondaryNav = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { openNewEntry } = useNewEntry();

  // "/dashboard" prefixes every other route, so it only matches exactly. The
  // rest stay lit while you are inside one of their nested routes.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base leading-tight">
              Injury Journal
            </span>
            <span className="text-xs text-muted-foreground">
              Your injury record
            </span>
          </div>
        </div>

        {/* The design makes this a modal over whatever you are looking at,
            not a route. /dashboard/log still exists and still opens it, so
            older deep links keep working. */}
        <Button
          size="lg"
          onClick={() => openNewEntry()}
          className="h-12 w-full justify-center gap-[11px] rounded-full px-3.5"
        >
          <Plus className="size-4" aria-hidden="true" />
          New entry
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {trackingNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                    className={NAV_ITEM_CLASS}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                    className={NAV_ITEM_CLASS}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                    className={NAV_ITEM_CLASS}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarUser() {
  const user = useCurrentUser();

  // No fabricated identity when we don't know who's signed in — this only
  // resolves after a login in the current tab (see useCurrentUser).
  const label = user?.email ?? "Signed in";
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  // The design's footer shows a display name above the email; there is no
  // name on CurrentUser ({ id, email }), so the email carries the row alone
  // rather than inventing one.
  return (
    <div className="flex items-center gap-[11px] border-t border-border px-2 pt-3.5 pb-1">
      <Avatar className="size-9">
        <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[12.5px] font-medium text-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
