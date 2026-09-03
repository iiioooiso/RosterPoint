import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { InterviewerSidebar } from "@/components/interviewer-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { InterviewerHeader } from "@/components/interviewer-header";
import { createClient } from "@/lib/server";

export default async function InterviewerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = "Unknown";
  let name = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = profile.role;
      name = profile.name || "";
    }
  }

  const userInfo = user ? {
    name: name,
    email: user.email || "",
    role: role,
    fallback: name ? name.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0, 2).toUpperCase() : "U"),
  } : null;

  return (
    <ThemeProvider>
      <SidebarProvider>
        <InterviewerSidebar user={userInfo} />
        <SidebarInset className="text-foreground">
          <InterviewerHeader />
          <main className="flex-1 p-6 bg-muted/20 text-foreground">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
