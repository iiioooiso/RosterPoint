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
    <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground">Pipeline by Stage</h3>
      </div>
      <div className="flex-1">
        {applications_by_stage.length === 0 ? (
          <div className="text-sm text-muted-foreground h-[250px] flex items-center justify-center text-center">No applications yet.</div>
        ) : (
          <div className="h-[250px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applications_by_stage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} fontSize={11} width={100} style={{ textTransform: "capitalize" }} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export function StalledApplicationsCard({ alerts, preview = false }: { alerts: any[], preview?: boolean }) {
  const getDaysStalled = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-foreground">Stalled Applications</h3>
        {preview ? (
          <span className="text-sm text-muted-foreground opacity-50 flex items-center pointer-events-none">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        ) : (
          <Link href="/recruiter/alerts" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="flex-1">
        {alerts.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground text-center">
            Your active applications are moving on schedule.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{alert.candidate_name}</span>
                  <span className="text-muted-foreground text-xs">{alert.opening?.title}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="capitalize text-muted-foreground text-xs mb-1">{alert.stage}</span>
                  <span className="text-destructive font-medium text-xs bg-destructive/10 px-2 py-0.5 rounded-full">{getDaysStalled(alert.stage_updated_at)} days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-foreground">Pipeline Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">A high-level view of your hiring metrics and recent activity.</p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col p-5 border rounded-xl bg-card shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-3">
            <span className="text-sm font-medium text-muted-foreground">Open Positions</span>
            <Briefcase className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">{open_positions}</div>
        </div>
        
        <div className="flex flex-col p-5 border rounded-xl bg-card shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-3">
            <span className="text-sm font-medium text-muted-foreground">Active Applications</span>
            <Users className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">{active_applications}</div>
        </div>

        <div className="flex flex-col p-5 border rounded-xl bg-card shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-3">
            <span className="text-sm font-medium text-muted-foreground">Interviews This Week</span>
            <Calendar className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">{interviews_this_week}</div>
        </div>

        <div className="flex flex-col p-5 border rounded-xl bg-card shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-3">
            <span className="text-sm font-medium text-muted-foreground">Hires This Month</span>
            <UserCheck className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">{hires_this_month}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6 overflow-hidden">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground">Applications Received</h3>
          <p className="text-xs text-muted-foreground mt-1">Trend over the last 13 weeks</p>
        </div>
        <div className="h-[280px] w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground">Applications by Opening</h3>
          </div>
          <div className="flex-1">
            {applications_by_opening.length === 0 ? (
              <div className="text-sm text-muted-foreground h-[250px] flex items-center justify-center text-center">No applications yet.</div>
            ) : (
              <div className="h-[250px] -ml-4">
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
          </div>
        </div>

        <PipelineByStageCard applications_by_stage={applications_by_stage} />
      </div>

      {/* Workflows */}
      <div className="grid gap-6 md:grid-cols-2">
        <StalledApplicationsCard alerts={alerts} />

        {/* Upcoming Interviews */}
        <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-foreground">Upcoming Interviews</h3>
            <Link href="/recruiter/interview-panel" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1">
            {upcomingInterviews.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground text-center">
                Scheduled interviews will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-start justify-between p-3 border rounded-lg bg-muted/20 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider mb-1">{getInterviewDayLabel(interview.scheduled_at)}</span>
                      <span className="font-medium text-foreground">{interview.candidate_name}</span>
                      <span className="text-muted-foreground text-xs mt-0.5">{interview.opening_title}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="font-medium text-foreground">{format(new Date(interview.scheduled_at), "h:mm a")}</span>
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
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="flex flex-col border rounded-xl bg-card shadow-sm p-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-foreground">Recent Hiring Activity</h3>
          <Link href="/recruiter/history" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="flex-1">
          {recentHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No recent activity.</div>
          ) : (
            <div className="space-y-5">
              {recentHistory.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary/60 flex-shrink-0" />
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium text-foreground leading-none">
                      {formatHistoryEvent(event)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.application?.opening?.title} &middot; {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
