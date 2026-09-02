"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAssignedApplications, getSubmittedFeedback } from "@/app/actions/interviewer-data";
import { FileText, CheckCircle, Loader2 } from "lucide-react";
import { useCachedAction } from "@/hooks/use-cached-action";

export function FeedbackClient() {
  const { data: appData, isLoading: appLoading } = useCachedAction("assigned-applications", getAssignedApplications);
  const { data: feedData, isLoading: feedLoading } = useCachedAction("submitted-feedback", getSubmittedFeedback);

  const applications = appData?.applications || [];
  const feedback = feedData?.feedback || [];

  const submittedFeedbackAppIds = new Set(feedback.map(f => f.application_id));
  
  const pendingFeedbackApps = applications.filter(app => !submittedFeedbackAppIds.has(app.id));
  const submittedFeedbackApps = applications.filter(app => submittedFeedbackAppIds.has(app.id));

  if ((appLoading && !appData) || (feedLoading && !feedData)) {
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
                        <div className="flex items-center gap-2 mb-1">
                          {app.opening?.company?.name && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4">
                              {app.opening.company.name}
                            </Badge>
                          )}
                        </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        {app.opening?.company?.name && (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4">
                            {app.opening.company.name}
                          </Badge>
                        )}
                      </div>
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
    </div>
  );
}
