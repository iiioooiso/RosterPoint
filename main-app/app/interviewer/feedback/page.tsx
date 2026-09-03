import { getActiveCompanyId } from "@/app/actions/company";
import { FeedbackClient } from "./FeedbackClient";

export default async function InterviewerFeedback() {
  const activeCompanyId = await getActiveCompanyId();
  return <FeedbackClient activeCompanyId={activeCompanyId} />;
}
