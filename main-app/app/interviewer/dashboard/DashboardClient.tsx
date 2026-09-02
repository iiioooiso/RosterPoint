"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignedApplications } from "@/app/actions/interviewer-data";
import { Calendar, Loader2 } from "lucide-react";
import { useCachedAction } from "@/hooks/use-cached-action";

export function DashboardClient() {
  const { data, isLoading } = useCachedAction("assigned-applications", getAssignedApplications);
  const applications = data?.applications || [];
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "applied": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
      case "screening": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "interview": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "offer": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "hired": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "withdrawn": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Candidates</CardTitle>
            <CardDescription>
              Candidates you have been assigned to interview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No active assignments</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  You currently don't have any candidates assigned to you for interviews.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="hidden md:table-cell">Applied</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.candidate_name || "Unknown"}
                          <div className="text-sm text-muted-foreground hidden sm:block">
                            {app.candidate_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            {app.opening?.company?.name && (
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                                {app.opening.company.name}
                              </Badge>
                            )}
                          </div>
                          <div>{app.opening?.title || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">
                            {app.opening?.department || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStageColor(app.stage)}>
                            {getStageLabel(app.stage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/interviewer/applications/${app.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                            View Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
