import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RecruiterSidebar } from "@/components/recruiter-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { RecruiterHeader } from "@/components/recruiter-header";
import { createClient } from "@/lib/server";

export default async function RecruiterLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "Unknown";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = profile.role;
    }
  }

  const userInfo = user ? {
    email: user.email || "",
    role: role,
    fallback: user.email ? user.email.substring(0, 2).toUpperCase() : "U",
  } : null;

  return (
    <ThemeProvider>
      <SidebarProvider>
        <RecruiterSidebar user={userInfo} />
        <SidebarInset className="text-foreground">
          <RecruiterHeader />
          <main className="flex-1 p-6 bg-muted/20 text-foreground">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
