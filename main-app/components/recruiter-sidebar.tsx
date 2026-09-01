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
    badge: "7",
  },
  {
    title: "History",
    url: "/recruiter/history",
    icon: History,
  },
];

export function RecruiterSidebar({ user }: { user?: { email: string, role: string, fallback: string } | null }) {
  const pathname = usePathname();

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
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground h-5 min-w-5 rounded-full px-1.5 text-[10px] font-semibold">
                        {item.badge}
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
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">{user.email}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
