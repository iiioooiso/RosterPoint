import { getDepartments, getInvitations, getRoutingRules } from "@/app/actions/teams"
import { TeamsClient } from "./TeamsClient"
import { Suspense } from "react"

export default async function TeamsPage() {
  const departments = await getDepartments()
  const invitations = await getInvitations()
  const rules = await getRoutingRules()

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsClient
          initialDepartments={departments}
          initialInvitations={invitations}
          initialRules={rules}
        />
      </Suspense>
    </div>
  )
}
