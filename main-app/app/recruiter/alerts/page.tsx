import { Bell } from "lucide-react";
import { getAlerts } from "@/app/actions/alerts";
import { AlertsView } from "./alerts-view";

export const metadata = {
  title: "Alerts | RosterPoint",
  description: "Manage stalled applications and alerts.",
};

export default async function AlertsPage() {
  const { alerts, error } = await getAlerts();

  return (
    <div className="flex-1 space-y-6">


      {error ? (
        <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
          <h3 className="font-semibold">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <AlertsView initialAlerts={alerts || []} />
      )}
    </div>
  );
}
