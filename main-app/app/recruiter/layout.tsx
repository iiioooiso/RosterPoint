import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RecruiterSidebar } from "@/components/recruiter-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { RecruiterHeader } from "@/components/recruiter-header";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

export default async function RecruiterLayout({ children }: { children: ReactNode }) {
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

  let companies: any[] = [];
  let activeCompanyId: string | undefined = undefined;

  if (user && role === "recruiter") {
    const { data: memberships } = await supabase
      .from("recruiter_company_memberships")
      .select("company_id, companies(id, name)")
      .eq("recruiter_id", user.id);
      
    if (memberships && memberships.length > 0) {
      companies = memberships.map(m => m.companies).filter(Boolean);
      const cookieStore = await cookies();
      activeCompanyId = cookieStore.get('cx_active_company')?.value || companies[0]?.id;
    }
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <RecruiterSidebar user={userInfo} />
        <SidebarInset className="text-foreground">
          <RecruiterHeader companies={companies} activeCompanyId={activeCompanyId} />
          <main className="flex-1 p-6 bg-muted/20 text-foreground">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
