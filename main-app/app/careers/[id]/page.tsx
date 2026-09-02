import { getPublicOpeningById } from "@/app/actions/openings";
import { hasStudentApplied } from "@/app/actions/applications";
import { createClient } from "@/lib/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ApplicationForm } from "./application-form";
import type { Metadata, ResolvingMetadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const opening = await getPublicOpeningById(id);
  if (!opening) return { title: "Opening Not Found" };
  return {
    title: `${opening.title} | RosterPoint Careers`,
    description: opening.description.substring(0, 150) + "...",
  };
}

export default async function CareerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = await getPublicOpeningById(id);

  if (!opening) {
    notFound();
  }

  // Check if current user has already applied
  const alreadyApplied = await hasStudentApplied(id);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="space-y-5 pb-8 border-b">
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{opening.title}</h1>
          <div className="flex flex-wrap gap-2.5">
            {opening.company_name && (
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/15 transition-colors">{opening.company_name}</Badge>
            )}
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 bg-muted/60 text-muted-foreground hover:bg-muted/80 transition-colors">{opening.department}</Badge>
            {opening.type && (
              <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 text-muted-foreground">{opening.type}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground tracking-tight">About the Role</h2>
          <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {opening.description}
          </div>
        </div>

        {opening.details && opening.details.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y">
            {opening.details.map((detail: { id: string; label: string; value: string }) => (
               <div key={detail.id} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{detail.label}</p>
                <p className="text-base text-foreground">{detail.value}</p>
              </div>
            ))}
          </div>
        )}

        {opening.requirements && opening.requirements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground tracking-tight">Requirements</h2>
            <ul className="space-y-3">
              {opening.requirements.map((req: { id: string; text: string; required: boolean }) => (
                <li key={req.id} className="flex gap-3 text-muted-foreground text-base leading-relaxed">
                  <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span>
                    {req.text} 
                    {req.required && <span className="text-foreground/70 ml-1.5 font-medium text-sm border border-border px-1.5 py-0.5 rounded-md uppercase text-[10px]">Required</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {opening.skills && opening.skills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground tracking-tight">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {opening.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-xs font-medium px-2.5 py-0.5 bg-muted/60 text-muted-foreground hover:bg-muted/80 transition-colors">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-6 border-t" id="apply">
          {alreadyApplied ? (
            <Card className="bg-muted/30 border border-border/80">
              <CardContent className="py-8 text-center space-y-4">
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground text-base">You have already applied for this position.</p>
                  <p className="text-sm text-muted-foreground">Check your dashboard for status updates and submitted applications.</p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/student/dashboard"
                    className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2 inline-flex")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back to Dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ApplicationForm opening={opening} />
          )}
        </div>
      </div>
    </div>
  );
}
