"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Users,
  Video,
  Bell,
  History,
  Command,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useCachedAction } from "@/hooks/use-cached-action";
import { getAlertsCount } from "@/app/actions/alerts";

const navItems = [
  {
    title: "Dashboard",
    url: "/recruiter/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create",
    url: "/recruiter/create",
    icon: Plus,
  },
  {
    title: "Applicants",
    url: "/recruiter/applicants",
    icon: Users,
  },
  {
    title: "Teams & Routing",
    url: "/recruiter/teams",
    icon: Command,
  },
  {
    title: "Interview Panel",
    url: "/recruiter/interview-panel",
    icon: Video,
  },
  {
    title: "Alerts",
    url: "/recruiter/alerts",
    icon: Bell,
    badge: "alerts", // We'll use this as a key to replace dynamically
  },
  {
    title: "History",
    url: "/recruiter/history",
    icon: History,
  },
];

export function RecruiterSidebar({ user }: { user?: { name: string, email: string, role: string, fallback: string } | null }) {
  const pathname = usePathname();
  const { data: alertsData } = useCachedAction("alerts-count", getAlertsCount);

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center justify-center border-b px-4">
        <Link
          href="/recruiter/dashboard"
          className="flex w-full items-center gap-2 font-semibold"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Command className="size-4" />
          </div>
          <span className="tracking-tight text-base font-bold">RosterPoint</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} prefetch={true} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge === "alerts" && alertsData && alertsData.count > 0 && (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground h-5 min-w-5 rounded-full px-1.5 text-[10px] font-semibold">
                        {alertsData.count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {user.fallback}
            </div>
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">{user.name || user.email.split('@')[0]}</span>
              <span className="truncate text-[10px] text-muted-foreground">{user.email.toLowerCase()}</span>
              <span className="truncate text-xs text-muted-foreground capitalize mt-0.5">{user.role}</span>
            </div>
          </div>
        </div>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
