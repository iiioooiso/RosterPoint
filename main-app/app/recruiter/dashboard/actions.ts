"use server";

import { createClient } from "@/lib/server";

export type DashboardMetrics = {
  open_positions: number;
  active_applications: number;
  hires_this_month: number;
  interviews_this_week: number;
  applications_by_opening: { title: string; count: number }[];
  applications_by_stage: { stage: string; count: number }[];
  applications_received: { week: string; count: number }[];
};

import { getActiveCompanyId } from "@/app/actions/company";

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let activeCompanyId = await getActiveCompanyId();
  if (!activeCompanyId) {
    const { data: recMem } = await supabase
      .from('recruiter_company_memberships')
      .select('company_id')
      .eq('recruiter_id', user.id)
      .limit(1)
      .maybeSingle();
    activeCompanyId = recMem?.company_id || null;
  }

  if (!activeCompanyId) {
    return {
      open_positions: 0,
      active_applications: 0,
      hires_this_month: 0,
      interviews_this_week: 0,
      applications_by_opening: [],
      applications_by_stage: [],
      applications_received: []
    };
  }

  // 1. Open Positions
  const { count: openPositions } = await supabase
    .from("openings")
    .select("id", { count: "exact", head: true })
    .eq("company_id", activeCompanyId)
    .eq("status", "open")
    .is("archived_at", null);

  // 2. Active Applications
  const { count: activeApps } = await supabase
    .from("applications")
    .select("id, opening:openings!inner(company_id)", { count: "exact", head: true })
    .eq("opening.company_id", activeCompanyId)
    .in("stage", ["applied", "screening", "interview", "offer"]);

  // 3. Hires This Month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data: hiresData } = await supabase
    .from("application_history")
    .select("application_id, application:applications!inner(opening:openings!inner(company_id))")
    .eq("event_type", "stage_changed")
    .eq("application.opening.company_id", activeCompanyId)
    .gte("created_at", startOfMonth.toISOString());
    
  // Filter JSONB details in JS for simplicity
  // Or just count the exact rows if we fetched details. Let's fetch details to be accurate:
  const { data: hiresDetailsData } = await supabase
    .from("application_history")
    .select("application_id, details, application:applications!inner(opening:openings!inner(company_id))")
    .eq("event_type", "stage_changed")
    .eq("application.opening.company_id", activeCompanyId)
    .gte("created_at", startOfMonth.toISOString());

  const hiresCount = (hiresDetailsData || [])
    .filter(h => h.details && typeof h.details === 'object' && h.details.new_stage === 'hired')
    .map(h => h.application_id)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .length;

  // 4. Interviews This Week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { count: interviewsThisWeek } = await supabase
    .from("interviews")
    .select("id, application:applications!inner(opening:openings!inner(company_id))", { count: "exact", head: true })
    .eq("application.opening.company_id", activeCompanyId)
    .gte("scheduled_at", startOfWeek.toISOString());

  // 5. Applications By Opening
  const { data: appsByOpening } = await supabase
    .from("applications")
    .select("id, opening:openings!inner(title, company_id)")
    .eq("opening.company_id", activeCompanyId);
    
  const openingCounts: Record<string, number> = {};
  (appsByOpening || []).forEach((app: any) => {
    const title = Array.isArray(app.opening) ? app.opening[0]?.title : app.opening?.title;
    if (title) {
      openingCounts[title] = (openingCounts[title] || 0) + 1;
    }
  });
  
  const applications_by_opening = Object.entries(openingCounts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5

  // 6. Applications By Stage
  const stageCounts: Record<string, number> = {};
  (appsByOpening || []).forEach((app: any) => {
    // Need stage. Let's fetch stage in the query
  });
  
  const { data: appsForStage } = await supabase
    .from("applications")
    .select("stage, opening:openings!inner(company_id)")
    .eq("opening.company_id", activeCompanyId);
    
  (appsForStage || []).forEach((app: any) => {
    const stage = app.stage;
    if (stage) {
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }
  });
  
  const applications_by_stage = Object.entries(stageCounts)
    .map(([stage, count]) => ({ stage, count }));

  // 7. Applications 13 weeks
  const thirteenWeeksAgo = new Date();
  thirteenWeeksAgo.setDate(thirteenWeeksAgo.getDate() - 13 * 7);
  thirteenWeeksAgo.setHours(0, 0, 0, 0);
  
  const { data: apps13Weeks } = await supabase
    .from("applications")
    .select("created_at, opening:openings!inner(company_id)")
    .eq("opening.company_id", activeCompanyId)
    .gte("created_at", thirteenWeeksAgo.toISOString());
    
  const weekCounts: Record<string, number> = {};
  // Initialize last 13 weeks with 0
  for (let i = 0; i < 13; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay()) - (i * 7));
    const weekStr = d.toISOString().split('T')[0];
    weekCounts[weekStr] = 0;
  }
  
  (apps13Weeks || []).forEach((app: any) => {
    const d = new Date(app.created_at);
    d.setDate(d.getDate() - d.getDay());
    const weekStr = d.toISOString().split('T')[0];
    if (weekCounts[weekStr] !== undefined) {
      weekCounts[weekStr]++;
    }
  });
  
  const applications_received = Object.entries(weekCounts)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return {
    open_positions: openPositions || 0,
    active_applications: activeApps || 0,
    hires_this_month: hiresCount,
    interviews_this_week: interviewsThisWeek || 0,
    applications_by_opening,
    applications_by_stage,
    applications_received
  };
}
