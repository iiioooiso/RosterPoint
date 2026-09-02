"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanySelector } from "@/components/company-selector";

const routeConfig: Record<string, { title: string; description?: string }> = {
  "/recruiter/dashboard": { title: "Dashboard", description: "Overview of your hiring pipeline" },
  "/recruiter/create": { title: "Openings", description: "Create and manage your hiring openings" },
  "/recruiter/applicants": { title: "Applicants", description: "Manage all applicants" },
  "/recruiter/interview-panel": { title: "Interview Panel", description: "Upcoming interviews" },
  "/recruiter/alerts": { title: "Alerts", description: "Action items and notifications" },
  "/recruiter/history": { title: "History", description: "Recent hiring activity" },
  "/recruiter/teams": { title: "Teams & Routing", description: "Manage interviewer teams and routing rules" },
};

interface Company {
  id: string;
  name: string;
}

export function RecruiterHeader({ companies = [], activeCompanyId }: { companies?: Company[], activeCompanyId?: string }) {
  const pathname = usePathname();
  
  // Find the matching route config, defaulting to nothing if not matched
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
          <CompanySelector companies={companies} activeCompanyId={activeCompanyId} />
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
