import { getAssignedApplications, getSubmittedFeedback } from "@/app/actions/interviewer-data";
import { DashboardClient } from "./DashboardClient";

export default async function InterviewerDashboard() {
  const [applicationsResult, feedbackResult] = await Promise.all([
    getAssignedApplications(),
    getSubmittedFeedback()
  ]);

  const applications = applicationsResult.applications || [];
  const feedback = feedbackResult.feedback || [];

  return <DashboardClient applications={applications} feedback={feedback} />;
}
