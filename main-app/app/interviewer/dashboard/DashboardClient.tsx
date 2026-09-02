"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InterviewerApplication, ApplicationFeedback } from "@/app/actions/interviewer-data";
import { FileText, Calendar, CheckCircle } from "lucide-react";

interface DashboardClientProps {
  applications: InterviewerApplication[];
  feedback: ApplicationFeedback[];
}

export function DashboardClient({ applications, feedback }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("interviews");

  // Filter feedback
  const submittedFeedbackAppIds = new Set(feedback.map(f => f.application_id));
  
  const pendingFeedbackApps = applications.filter(app => !submittedFeedbackAppIds.has(app.id));
  const submittedFeedbackApps = applications.filter(app => submittedFeedbackAppIds.has(app.id));

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

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Interviewer Workspace</h1>
        <p className="text-muted-foreground">Manage your interview assignments and provide feedback.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="interviews">My Interviews</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interviews" className="mt-6">
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
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Feedback</CardTitle>
              <CardDescription>
                Candidates waiting for your interview feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFeedbackApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-50 text-emerald-500" />
                  <p>You're all caught up! No pending feedback.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pendingFeedbackApps.map(app => (
                    <Card key={app.id} className="border-dashed shadow-none bg-muted/30">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{app.candidate_name}</CardTitle>
                            <CardDescription className="text-xs mt-1">{app.opening?.title}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Link href={`/interviewer/applications/${app.id}?tab=feedback`} className={cn(buttonVariants({ size: "sm" }), "w-full")}>
                          <FileText className="h-4 w-4 mr-2" />
                          Write Feedback
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Feedback</CardTitle>
              <CardDescription>
                Feedback you have already provided.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submittedFeedbackApps.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No feedback submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedFeedbackApps.map(app => {
                    const appFeedback = feedback.find(f => f.application_id === app.id);
                    return (
                      <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <div className="font-medium">{app.candidate_name}</div>
                          <div className="text-sm text-muted-foreground">{app.opening?.title}</div>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center gap-3">
                          <div className="text-xs text-muted-foreground text-right hidden sm:block">
                            Submitted on <br />
                            {appFeedback && format(new Date(appFeedback.created_at), "MMM d, yyyy")}
                          </div>
                          <Link href={`/interviewer/applications/${app.id}?tab=feedback`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
