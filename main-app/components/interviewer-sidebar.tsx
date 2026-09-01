"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut } from "lucide-react";
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
    title: "Applications",
    url: "/interviewer/applications",
    icon: Users,
  }
];

export function InterviewerSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="h-14 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg text-foreground">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs leading-none">R</span>
          </div>
          RosterPoint
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} prefetch={true} />}
                    isActive={pathname === item.url}
                    className="text-foreground hover:bg-muted"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-medium truncate text-foreground">{user?.email || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || 'Interviewer'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground w-full rounded-md hover:bg-muted transition-colors">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
