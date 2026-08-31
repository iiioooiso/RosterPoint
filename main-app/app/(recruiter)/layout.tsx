import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RecruiterSidebar } from "@/components/recruiter-sidebar";
import { RecruiterHeader } from "@/components/recruiter-header";

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <RecruiterSidebar />
      <SidebarInset>
        <RecruiterHeader />
        <main className="flex-1 p-6 bg-muted/20">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
