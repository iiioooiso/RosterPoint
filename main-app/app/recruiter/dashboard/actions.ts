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

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_recruiter_dashboard_metrics");

  if (error) {
    console.error("Error fetching dashboard metrics:", error);
    return null;
  }

  return data as DashboardMetrics;
}
