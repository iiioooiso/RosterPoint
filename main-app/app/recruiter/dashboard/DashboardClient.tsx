"use client";

import { DashboardMetrics } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, UserCheck, ArrowRight, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { format, parseISO, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import Link from "next/link";
import { ApplicationHistoryEvent } from "@/app/actions/history";

export function PipelineByStageCard({ applications_by_stage }: { applications_by_stage: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        {applications_by_stage.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No applications yet.</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applications_by_stage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} style={{ textTransform: "capitalize" }} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StalledApplicationsCard({ alerts, preview = false }: { alerts: any[], preview?: boolean }) {
  const getDaysStalled = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stalled Applications</CardTitle>
        {preview ? (
          <span className="text-sm text-muted-foreground opacity-50 flex items-center pointer-events-none">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        ) : (
          <Link href="/recruiter/alerts" className="text-sm text-muted-foreground hover:text-primary flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {alerts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-8 text-center">
            Your active applications are moving on schedule.
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{alert.candidate_name}</span>
                  <span className="text-muted-foreground text-xs">{alert.opening?.title}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="capitalize text-muted-foreground">{alert.stage}</span>
                  <span className="text-destructive font-medium">{getDaysStalled(alert.stage_updated_at)} days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ 
  metrics, 
  alerts, 
  upcomingInterviews, 
  recentHistory,
  preview = false
}: { 
  metrics: DashboardMetrics | null;
  alerts: any[];
  upcomingInterviews: any[];
  recentHistory: ApplicationHistoryEvent[];
  preview?: boolean;
}) {
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mt-2">Could not fetch dashboard metrics.</p>
      </div>
    );
  }

  const {
    open_positions,
    active_applications,
    interviews_this_week,
    hires_this_month,
    applications_received,
    applications_by_opening,
    applications_by_stage,
  } = metrics;

  // Format weeks for display (e.g., "Aug 12")
  const chartData = applications_received.map((item) => ({
    week: format(parseISO(item.week), "MMM d"),
    count: item.count,
  }));

  const getInterviewDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const formatHistoryEvent = (event: ApplicationHistoryEvent) => {
    const actorName = event.actor?.name || "Someone";
    const candidateName = event.application?.candidate_name || "a candidate";
    const openingTitle = event.application?.opening?.title || "an opening";
    
    switch (event.event_type) {
      case 'application_created':
        return `${candidateName} applied`;
      case 'stage_changed':
        return `${candidateName} moved to ${event.details?.new_stage}`;
      case 'application_rejected':
        return `${candidateName} was rejected`;
      case 'application_reinstated':
        return `${candidateName} was reinstated`;
      case 'interviewer_assigned':
        return `An interviewer was assigned to ${candidateName}`;
      case 'interviewer_removed':
        return `An interviewer was removed from ${candidateName}`;
      default:
        return `Activity on ${candidateName}'s application`;
    }
  };

  if (preview) {
    // In preview mode, disable interactive links but still render the exact full UI.
    // The links in the UI below will check the preview flag if needed, or we just rely on PreviewWrapper's pointer-events-none.
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview of your hiring pipeline</h2>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{open_positions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active_applications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews_this_week}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hires This Month</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hires_this_month}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Applications Received (Last 13 Weeks)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applications by Opening</CardTitle>
          </CardHeader>
          <CardContent>
            {applications_by_opening.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No applications yet.</div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applications_by_opening} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} fontSize={12} width={120} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <PipelineByStageCard applications_by_stage={applications_by_stage} />
      </div>

      {/* Workflows */}
      <div className="grid gap-4 md:grid-cols-2">
        <StalledApplicationsCard alerts={alerts} />

        {/* Upcoming Interviews */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Interviews</CardTitle>
            <Link href="/recruiter/interview-panel" className="text-sm text-muted-foreground hover:text-primary flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {upcomingInterviews.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-8 text-center">
                Scheduled interviews will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-start justify-between p-3 border rounded-lg bg-card text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-primary mb-1">{getInterviewDayLabel(interview.scheduled_at)}</span>
                      <span className="font-medium">{interview.candidate_name}</span>
                      <span className="text-muted-foreground text-xs">{interview.opening_title}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="font-medium">{format(new Date(interview.scheduled_at), "h:mm a")}</span>
                      {interview.interviewers?.length > 0 && (
                        <span className="text-muted-foreground text-xs mt-1 max-w-[120px] truncate">
                          {interview.interviewers.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Hiring Activity</CardTitle>
          <Link href="/recruiter/history" className="text-sm text-muted-foreground hover:text-primary flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No recent activity.</div>
          ) : (
            <div className="space-y-4">
              {recentHistory.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {formatHistoryEvent(event)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.application?.opening?.title} &middot; {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
