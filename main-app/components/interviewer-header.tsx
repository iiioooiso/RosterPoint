"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanySelector } from "@/components/company-selector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1 hidden sm:flex">
                <span>Company:</span>
                <TooltipProvider delay={100}>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-center h-4 w-4 rounded-full border border-muted-foreground/40 text-muted-foreground/70 cursor-help hover:text-foreground hover:border-foreground transition-colors">
                      <span className="text-[10px] font-bold">?</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" className="max-w-[280px]">
                      <p>Interviewers can join additional companies through invitations sent by recruiters using a company join link.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CompanySelector companies={companies} activeCompanyId={activeCompanyId} />
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
