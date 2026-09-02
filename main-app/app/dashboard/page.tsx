import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export default async function DashboardRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/onboarding")
  }

  const role = profile.role || "student"
  redirect(`/${role}/dashboard`)
}
