"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanySelector } from "@/components/company-selector";

const routeConfig: Record<string, { title: string; description?: string }> = {
  "/interviewer/applications": { title: "Applications", description: "Candidates routed to your teams" },
  "/interviewer/dashboard": { title: "Interviewer Workspace", description: "Manage your interview assignments." },
  "/interviewer/feedback": { title: "Interview Feedback", description: "Provide and manage your interview feedback." },
  "/interviewer/history": { title: "Interview History", description: "View your past interviews and feedback." }
};

export function InterviewerHeader({ companies = [], activeCompanyId }: { companies?: any[], activeCompanyId?: string }) {
  const pathname = usePathname();
  
  const currentRoute = Object.keys(routeConfig).find(route => pathname.startsWith(route));
  const config = currentRoute ? routeConfig[currentRoute] : null;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background text-foreground px-4 justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        {config && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-semibold leading-none">{config.title}</h1>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-none">{config.description}</p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {companies.length > 0 && (
          <>
            <CompanySelector companies={companies} activeCompanyId={activeCompanyId} />
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
