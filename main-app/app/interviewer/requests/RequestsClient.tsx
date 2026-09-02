"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPendingInterviewRequests, respondToInterviewRequest } from "@/app/actions/interviewer-data";
import { Mail, Check, X as XIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCachedAction } from "@/hooks/use-cached-action";

export function RequestsClient() {
  const { data, isLoading } = useCachedAction("pending-requests", getPendingInterviewRequests);
  const requests = data?.requests || [];

  const [isPending, startTransition] = useTransition();

  const handleRequestResponse = (requestId: string, accept: boolean) => {
    startTransition(async () => {
      const res = await respondToInterviewRequest(requestId, accept);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(accept ? "Interview request accepted" : "Interview request ignored");
      }
    });
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
          <CardTitle>Interview Requests</CardTitle>
          <CardDescription>
            Companies are requesting you to interview these candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                You don't have any pending interview requests right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const app = req.application as any;
                return (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {app?.opening?.company?.name || "Company"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Requested {format(new Date(req.created_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="font-medium text-lg">{app?.candidate_name}</div>
                      <div className="text-sm text-muted-foreground">{app?.opening?.title}</div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleRequestResponse(req.id, true)}
                        disabled={isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleRequestResponse(req.id, false)}
                        disabled={isPending}
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Ignore
                      </Button>
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
