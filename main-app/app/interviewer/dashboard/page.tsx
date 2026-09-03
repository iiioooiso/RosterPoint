import { getActiveCompanyId } from "@/app/actions/company";
import { DashboardClient } from "./DashboardClient";

export default async function InterviewerDashboard() {
  const activeCompanyId = await getActiveCompanyId();
  return <DashboardClient activeCompanyId={activeCompanyId || undefined} />;
}
