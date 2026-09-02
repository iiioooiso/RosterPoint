"use server";

import { createClient } from "@/lib/server";
import { Application, Opening } from "@/lib/types";

export interface InterviewerApplication extends Application {
  opening: {
    id: string;
    title: string;
    department: string;
    company?: {
      name: string;
    };
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
      opening:openings(id, title, department, company:companies(name))
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

export interface InterviewRequest {
  id: string;
  application_id: string;
  status: string;
  created_at: string;
  application: {
    candidate_name: string;
    opening: {
      title: string;
      company: {
        name: string;
      }
    }
  }
}

export async function getPendingInterviewRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("interview_requests")
    .select(`
      id,
      application_id,
      status,
      created_at,
      application:applications(
        candidate_name,
        opening:openings(
          title,
          company:companies(name)
        )
      )
    `)
    .eq("interviewer_id", user.id)
    .eq("status", "pending")
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { requests: data as unknown as InterviewRequest[] };
}

import { revalidatePath } from 'next/cache'

export async function respondToInterviewRequest(requestId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch the request to make sure it belongs to this interviewer
  const { data: request, error: fetchError } = await supabase
    .from("interview_requests")
    .select("application_id, interviewer_id")
    .eq("id", requestId)
    .single();

  if (fetchError || request?.interviewer_id !== user.id) {
    return { error: "Invalid request or unauthorized" };
  }

  if (accept) {
    // 1. Assign interviewer to application
    const { error: assignError } = await supabase
      .from('application_interviewers')
      .insert({ application_id: request.application_id, interviewer_id: user.id });
      
    if (assignError && assignError.code !== '23505') { // ignore duplicate
      return { error: "Failed to assign interviewer" };
    }
  }

  // 2. Update request status
  const newStatus = accept ? 'accepted' : 'ignored';
  const { error: updateError } = await supabase
    .from("interview_requests")
    .update({ status: newStatus })
    .eq("id", requestId);

  if (updateError) {
    return { error: "Failed to update request status" };
  }

  revalidatePath('/interviewer/dashboard')
  return { success: true };
}
