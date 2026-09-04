"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut, MessageSquare, History, Command } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";

const navItems = [
  {
    title: "Dashboard",
    url: "/interviewer/dashboard",
    icon: Users,
  },
  {
    title: "Feedback",
    url: "/interviewer/feedback",
    icon: MessageSquare,
  },
  {
    title: "History",
    url: "/interviewer/history",
    icon: History,
  }
];

export function InterviewerSidebar({ user }: { user?: { name: string, email: string, role: string, fallback: string } | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="flex h-14 items-center justify-center border-b px-4">
        <Link
          href="/interviewer/dashboard"
          className="flex w-full items-center gap-2 font-semibold text-foreground group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 shadow-sm transition-transform group-hover:scale-105">
            <span className="text-[12px] font-bold text-white leading-none">RP</span>
          </div>
          <span className="tracking-tight text-base font-bold">RosterPoint</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} prefetch={true} />}
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                    className="h-10 transition-colors text-foreground hover:bg-muted"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium text-foreground">{user?.fallback || 'U'}</span>
          </div>
          <div className="flex flex-col overflow-hidden leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
            <span className="truncate text-[10px] text-muted-foreground">{user?.email?.toLowerCase() || ''}</span>
            <span className="truncate text-xs text-muted-foreground capitalize mt-0.5">{user?.role || 'Interviewer'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 w-full rounded-md transition-colors mt-2">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
