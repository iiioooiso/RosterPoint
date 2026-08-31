"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const routeConfig: Record<string, { title: string; description?: string }> = {
  "/dashboard": { title: "Dashboard", description: "Overview of your hiring pipeline" },
  "/create": { title: "Openings", description: "Create and manage your hiring openings" },
  "/applicants": { title: "Applicants", description: "Manage all applicants" },
  "/interview-panel": { title: "Interview Panel", description: "Upcoming interviews" },
  "/alerts": { title: "Alerts", description: "Action items and notifications" },
  "/history": { title: "History", description: "Recent hiring activity" },
};

export function RecruiterHeader() {
  const pathname = usePathname();
  
  // Find the matching route config, defaulting to nothing if not matched
  const currentRoute = Object.keys(routeConfig).find(route => pathname.startsWith(route));
  const config = currentRoute ? routeConfig[currentRoute] : null;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
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
    </header>
  );
}
