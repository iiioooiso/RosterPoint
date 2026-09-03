import { getDepartments, getInvitations, getRoutingRules } from "@/app/actions/teams"
import { getCompanyInvitations } from "@/app/actions/company-invites"
import { createClient } from "@/lib/server"
import { getActiveCompanyId } from '@/app/actions/company'
import { TeamsClient } from "./TeamsClient"
import { Suspense } from "react"

export default async function TeamsPage() {
  const supabase = await createClient()
  const activeCompanyId = await getActiveCompanyId()
  
  const [departments, invitations, companyInvitations, rules, { data: openings }, { data: rawInterviewers }] = await Promise.all([
    getDepartments(),
    getInvitations(),
    getCompanyInvitations(),
    getRoutingRules(),
    supabase.from('openings').select('department'),
    activeCompanyId 
      ? supabase
          .from('profiles')
          .select('id, name, interviewer_company_memberships!inner(company_id, department_id, department:departments(name))')
          .eq('role', 'interviewer')
          .eq('interviewer_company_memberships.company_id', activeCompanyId)
      : Promise.resolve({ data: [] })
  ])

  const openingDepartments = Array.from(new Set(openings?.map(o => o.department) || []))

  const companyInterviewers = (rawInterviewers || []).map((i: any) => {
    const mems = (i.interviewer_company_memberships || []).filter((m: any) => m.company_id === activeCompanyId);
    const isCompanyWide = mems.some((m: any) => !m.department_id);
    const depts = mems.map((m: any) => m.department?.name).filter(Boolean);
    return {
      id: i.id,
      name: i.name,
      isCompanyWide,
      departments: depts,
      scopeLabel: isCompanyWide ? 'Company-Wide' : (depts.join(', ') || 'Department')
    };
  });

  return (
    <div className="flex-1 space-y-4">
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsClient
          initialDepartments={departments}
          initialInvitations={invitations}
          initialCompanyInvitations={companyInvitations}
          initialRules={rules}
          openingDepartments={openingDepartments}
          activeCompanyId={activeCompanyId}
          companyInterviewers={companyInterviewers}
        />
      </Suspense>
    </div>
  )
}
