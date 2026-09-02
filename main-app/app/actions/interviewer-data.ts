"use server";

import { createClient } from "@/lib/server";
import { Application, Opening } from "@/lib/types";

export interface InterviewerApplication extends Application {
  opening: {
    id: string;
    title: string;
    department: string;
  };
}

export async function getAssignedApplications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch applications where the user is an interviewer
  // Thanks to RLS, 'applications' should only return rows they are assigned to, 
  // but we specifically join with job_openings for context.
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      opening:openings(id, title, department)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching assigned applications:", error);
    return { error: error.message };
  }

  return { applications: data as unknown as InterviewerApplication[] };
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

export async function getSubmittedFeedback() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("application_history")
    .select("*")
    .eq("event_type", "feedback_submitted")
    .eq("actor_id", user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching submitted feedback:", error);
    return { error: error.message };
  }

  return { feedback: data as ApplicationFeedback[] };
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
