"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

const routeConfig: Record<string, { title: string; description?: string }> = {
  "/interviewer/applications": { title: "Applications", description: "Candidates routed to your teams" },
  "/interviewer/dashboard": { title: "Interviewer Workspace", description: "Manage your interview assignments." },
  "/interviewer/feedback": { title: "Interview Feedback", description: "Provide and manage your interview feedback." },
  "/interviewer/requests": { title: "Interview Requests", description: "Manage interview requests from companies." }
};

export function InterviewerHeader() {
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
        <ThemeToggle />
      </div>
    </header>
  );
}
