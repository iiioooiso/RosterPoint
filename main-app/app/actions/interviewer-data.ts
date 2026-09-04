"use server";

import { createClient } from "@/lib/server";
import { Application, Opening } from "@/lib/types";

export interface InterviewerApplication extends Application {
  hasFeedback?: boolean;
  opening: {
    id: string;
    title: string;
    department: string;
    company?: {
      name: string;
    };
  };
}

export async function getAssignedApplications(companyId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", applications: [] };
  }

  // 1. Resolve active company
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const { getActiveCompanyId } = await import("@/app/actions/company");
    targetCompanyId = (await getActiveCompanyId()) || undefined;
  }

  if (!targetCompanyId) {
    return { applications: [] };
  }

  // 2. Fetch the interviewer's active memberships in this company
  const { data: memberships } = await supabase
    .from("interviewer_company_memberships")
    .select("department_id, department:departments(name)")
    .eq("interviewer_id", user.id)
    .eq("company_id", targetCompanyId)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    // Not a member of this company -> sees 0 candidates
    return { applications: [] };
  }

  const isCompanyWide = memberships.some((m: any) => !m.department_id);
  const allowedDepts = new Set(
    memberships.map((m: any) => (m.department?.name || "").toLowerCase().trim()).filter(Boolean)
  );

  // 3. Query applications explicitly assigned in application_interviewers
  const { data: assignments, error: assignError } = await supabase
    .from("application_interviewers")
    .select(`
      application:applications!inner(
        *,
        opening:openings!inner(id, title, department, company_id, company:companies(name))
      )
    `)
    .eq("interviewer_id", user.id);

  if (assignError) {
    console.error("Error fetching assigned applications:", assignError);
    return { error: assignError.message, applications: [] };
  }

  // 4. Filter by active company and department eligibility
  const applications = (assignments || [])
    .map((a: any) => a.application)
    .filter((app: any) => {
      if (!app || !app.opening) return false;
      if (app.opening.company_id !== targetCompanyId) return false;
      if (isCompanyWide) return true;
      const appDept = (app.opening.department || "").toLowerCase().trim();
      return allowedDepts.has(appDept);
    });

  // 5. Fetch feedback status for these applications
  const applicationIds = applications.map((app: any) => app.id);
  
  if (applicationIds.length > 0) {
    const { data: feedbackData } = await supabase
      .from("application_history")
      .select("application_id")
      .eq("event_type", "feedback_submitted")
      .eq("actor_id", user.id)
      .in("application_id", applicationIds);

    const feedbackSet = new Set((feedbackData || []).map((f: any) => f.application_id));
    
    applications.forEach((app: any) => {
      app.hasFeedback = feedbackSet.has(app.id);
    });
  }

  return { applications: applications as unknown as InterviewerApplication[] };
}

export interface ApplicationFeedback {
  id: string;
  application_id: string;
  actor_id: string;
  event_type: string;
  details: {
    feedback: string;
    rating: string | null;
  };
  created_at: string;
}

export interface InterviewHistoryItem extends ApplicationFeedback {
  application: {
    candidate_name: string;
    opening: {
      title: string;
      department: string;
      company_id: string;
      company: {
        name: string;
      }
    }
  }
}

export async function getInterviewHistory(companyId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", history: [] };
  }

  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const { getActiveCompanyId } = await import("@/app/actions/company");
    targetCompanyId = (await getActiveCompanyId()) || undefined;
  }

  if (!targetCompanyId) {
    return { history: [] };
  }

  // Fetch interviewer active memberships in this company
  const { data: memberships } = await supabase
    .from("interviewer_company_memberships")
    .select("department_id, department:departments(name)")
    .eq("interviewer_id", user.id)
    .eq("company_id", targetCompanyId)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return { history: [] };
  }

  const isCompanyWide = memberships.some((m: any) => !m.department_id);
  const allowedDepts = new Set(
    memberships.map((m: any) => (m.department?.name || "").toLowerCase().trim()).filter(Boolean)
  );

  const { data, error } = await supabase
    .from("application_history")
    .select(`
      *,
      application:applications!inner(
        candidate_name,
        opening:openings!inner(
          title, 
          department, 
          company_id, 
          company:companies(name)
        )
      )
    `)
    .eq("event_type", "feedback_submitted")
    .eq("actor_id", user.id)
    .eq("application.opening.company_id", targetCompanyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching interview history:", error);
    return { error: error.message, history: [] };
  }

  const filteredHistory = (data || []).filter((item: any) => {
    if (!item?.application?.opening) return false;
    if (isCompanyWide) return true;
    const dept = (item.application.opening.department || "").toLowerCase().trim();
    return allowedDepts.has(dept);
  });

  return { history: filteredHistory as unknown as InterviewHistoryItem[] };
}

export async function getSubmittedFeedback(companyId?: string) {
  const res = await getInterviewHistory(companyId);
  return { feedback: res.history || [] };
}

export async function submitApplicationFeedback(applicationId: string, feedback: string, rating?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.rpc("submit_interview_feedback", {
    p_application_id: applicationId,
    p_feedback: feedback,
    p_rating: rating || null
  });

  if (error) {
    console.error("Error submitting feedback:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getInterviewerCompanies() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", companies: [] };

  const { data, error } = await supabase
    .from("interviewer_company_memberships")
    .select(`
      company_id,
      company:companies(id, name, slug)
    `)
    .eq("interviewer_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching interviewer companies:", error);
    return { error: error.message, companies: [] };
  }

  // Flatten and ensure only valid, non-null companies are returned
  const companies = (data || [])
    .map((m: any) => m.company)
    .filter((c: any): c is { id: string; name: string; slug?: string } => Boolean(c && typeof c === 'object' && c.id));

  return { companies };
}
