"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanySelector } from "@/components/company-selector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        {companies.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1 hidden sm:flex">
                <span>Company:</span>
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-center h-4 w-4 rounded-full border border-muted-foreground/40 text-muted-foreground/70 cursor-help hover:text-foreground hover:border-foreground transition-colors">
                      <span className="text-[10px] font-bold">?</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" className="max-w-[280px]">
                      <p>Switch between the companies you manage. You can also create new companies directly from the dropdown.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CompanySelector companies={companies} activeCompanyId={activeCompanyId} allowAddCompany={true} />
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        ) : (
          <CompanySelector companies={companies} activeCompanyId={activeCompanyId} allowAddCompany={true} />
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
