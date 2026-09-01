import { getDepartments, getInvitations, getRoutingRules } from "@/app/actions/teams"
import { createClient } from "@/lib/server"
import { TeamsClient } from "./TeamsClient"
import { Suspense } from "react"

export default async function TeamsPage() {
  const departments = await getDepartments()
  const invitations = await getInvitations()
  const rules = await getRoutingRules()

  const supabase = await createClient()
  const { data: openings } = await supabase.from('openings').select('department')
  const openingDepartments = Array.from(new Set(openings?.map(o => o.department) || []))

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsClient
          initialDepartments={departments}
          initialInvitations={invitations}
          initialRules={rules}
          openingDepartments={openingDepartments}
        />
      </Suspense>
    </div>
  )
}
