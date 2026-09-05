import { createClient } from "@/lib/server"
import { getAdminClient } from "@/lib/supabase-admin"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CompanyFilter } from "./company-filter"
import { ApplicationsSheet } from "@/app/student/dashboard/applications-sheet"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Careers | RosterPoint",
  description: "Explore open job opportunities and apply to join our teams.",
}

export default async function CareersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const selectedCompanyId = typeof params.company === "string" ? params.company : undefined

  const supabase = await createClient()
  const db = getAdminClient() || supabase

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch student applications if authenticated
  let applications: any[] = []
  if (user) {
    const { data: userApps } = await supabase
      .from("applications")
      .select("*, opening:openings(title, department)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })

    applications = userApps || []
  }

  // 1. Fetch direct companies
  const { data: rawCompanies } = await db
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true })

  // 2. Fetch all active openings (unfiltered) to derive companies and company_ids
  const { data: allActiveOpenings } = await db
    .from("openings")
    .select("id, company_id, company:companies(id, name)")
    .eq("status", "open")
    .is("archived_at", null)

  const companiesMap = new Map<string, string>()
  const companiesList: { id: string; name: string }[] = []

  // Add from raw companies table
  ;(rawCompanies || []).forEach((c: any) => {
    if (c?.id && c?.name) {
      companiesMap.set(c.id, c.name)
      companiesList.push({ id: c.id, name: c.name })
    }
  })

  // Add from joined openings
  ;(allActiveOpenings || []).forEach((op: any) => {
    const rawComp = op.company
    const compName = Array.isArray(rawComp) ? rawComp[0]?.name : rawComp?.name
    const compId = op.company_id || (Array.isArray(rawComp) ? rawComp[0]?.id : rawComp?.id)
    if (compId && compName && !companiesMap.has(compId)) {
      companiesMap.set(compId, compName)
      companiesList.push({ id: compId, name: compName })
    }
  })

  // If openings exist with company_id but name wasn't joined, map to TCS default
  ;(allActiveOpenings || []).forEach((op: any) => {
    const compId = op.company_id
    if (compId && !companiesMap.has(compId)) {
      companiesMap.set(compId, "TCS")
      companiesList.push({ id: compId, name: "TCS" })
    }
  })

  // Final fallback to ensure dropdown is never empty if openings exist
  if (companiesList.length === 0 && (allActiveOpenings || []).length > 0) {
    const fallbackId = allActiveOpenings?.[0]?.company_id || "tcs"
    companiesMap.set(fallbackId, "TCS")
    companiesList.push({ id: fallbackId, name: "TCS" })
  }

  // Deduplicate companies by ID and by Name
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const uniqueCompanies: { id: string; name: string }[] = []

  for (const c of companiesList) {
    const normalizedName = c.name.trim().toLowerCase()
    if (!seenIds.has(c.id) && !seenNames.has(normalizedName)) {
      seenIds.add(c.id)
      seenNames.add(normalizedName)
      uniqueCompanies.push(c)
    }
  }

  uniqueCompanies.sort((a, b) => a.name.localeCompare(b.name))

  // 3. Fetch active openings for display (filtered by company if selected)
  let openingsQuery = db
    .from("openings")
    .select("id, title, department, created_at, company_id, company:companies(id, name)")
    .eq("status", "open")
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (selectedCompanyId && selectedCompanyId !== "all") {
    openingsQuery = openingsQuery.eq("company_id", selectedCompanyId)
  }

  const { data: openings } = await openingsQuery

  function getOpeningCompanyName(opening: any): string {
    const rawComp = opening.company
    const joinedName = Array.isArray(rawComp) ? rawComp[0]?.name : rawComp?.name
    if (joinedName) return joinedName

    if (opening.company_id && companiesMap.has(opening.company_id)) {
      return companiesMap.get(opening.company_id)!
    }

    return "TCS"
  }

  return (
    <div className="space-y-8 pt-2 pb-12">
      {/* Available Openings Section */}
      <section className="space-y-6">
        <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Available Positions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore open roles across teams. Sign in or create an account to submit your application.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <CompanyFilter companies={uniqueCompanies} selectedCompanyId={selectedCompanyId} />
            {user ? (
              <ApplicationsSheet applications={applications} />
            ) : (
              <Link href="/login?next=/student/dashboard">
                <Button variant="default" size="sm">
                  My Applications
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {!openings || openings.length === 0 ? (
            <Card className="col-span-full bg-muted/40 border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                <p className="text-muted-foreground font-medium">No open positions right now</p>
                <p className="text-sm text-muted-foreground">Check back later for new opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            openings.map((opening) => {
              const companyName = getOpeningCompanyName(opening)
              // For unauthenticated users: clicking redirects to login with return target
              const targetHref = user ? `/careers/${opening.id}` : `/login?next=/careers/${opening.id}`

              return (
                <Link key={opening.id} href={targetHref} className="block group">
                  <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-medium group-hover:text-primary transition-colors">
                          {opening.title}
                        </h3>
                        <CardDescription>
                          {opening.department} • {companyName}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Posted on {new Date(opening.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <div className="px-6 pb-6 mt-auto">
                      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full">
                        View Details
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
