import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role) {
    redirect(`/${profile.role}/dashboard`);
  }

  return <OnboardingClient />;
}
