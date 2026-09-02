"use client";

import { useState } from "react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Bell, Clock, Briefcase, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dismissAlert } from "@/app/actions/alerts";

type Alert = {
  id: string;
  stage: string;
  stage_updated_at: string;
  candidate_name: string;
  opening: {
    id: string;
    title: string;
  };
};

export function AlertsView({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const handleDismiss = async (appId: string, stage: string) => {
    setDismissingId(appId);
    try {
      const result = await dismissAlert(appId, stage);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Alert dismissed");
        setAlerts((prev) => prev.filter((a) => a.id !== appId));
      }
    } catch (err) {
      toast.error("Failed to dismiss alert");
    } finally {
      setDismissingId(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          No stalled applications require your attention right now. Great job keeping the pipeline moving.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {alerts.map((alert) => {
        const stalledDays = differenceInDays(new Date(), new Date(alert.stage_updated_at));
        const isDismissing = dismissingId === alert.id;

        return (
          <Card key={alert.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-6 gap-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold">{alert.candidate_name}</h3>
                  <Badge variant="secondary" className="font-medium">
                    {alert.stage.charAt(0).toUpperCase() + alert.stage.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{alert.opening.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
                    <Clock className="h-4 w-4" />
                    <span>Stalled {stalledDays} days</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDismiss(alert.id, alert.stage)}
                  disabled={isDismissing}
                  className="flex-1 sm:flex-none h-9"
                >
                  {isDismissing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" />
                  )}
                  Dismiss
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  asChild
                  className="flex-1 sm:flex-none h-9"
                >
                  <Link href={`/recruiter/applicants/${alert.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View App
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
