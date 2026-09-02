import { getDashboardMetrics } from "./actions";
import { getAlerts } from "@/app/actions/alerts";
import { getUpcomingInterviews } from "@/app/actions/interview-panel-data";
import { getGlobalHistory } from "@/app/actions/history";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const [metrics, alertsData, interviewsData, historyData] = await Promise.all([
    getDashboardMetrics(),
    getAlerts(),
    getUpcomingInterviews(5),
    getGlobalHistory(1, 6)
  ]);

  return (
    <DashboardClient 
      metrics={metrics} 
      alerts={alertsData.alerts.slice(0, 5)} 
      upcomingInterviews={interviewsData.data} 
      recentHistory={historyData.data} 
    />
  );
}
