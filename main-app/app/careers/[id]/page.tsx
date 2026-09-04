import { getPublicOpeningById } from "@/app/actions/openings";
import { hasStudentApplied } from "@/app/actions/applications";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { JobDetailView } from "@/components/job-detail-view";
import { createClient } from "@/lib/server";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const opening = await getPublicOpeningById(id);
  if (!opening) return { title: "Opening Not Found" };
  return {
    title: `${opening.title} | RosterPoint Careers`,
    description: opening.description.substring(0, 150) + "...",
  };
}

export default async function CareerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = await getPublicOpeningById(id);

  if (!opening) {
    notFound();
  }

  // Check if current user has already applied
  const alreadyApplied = await hasStudentApplied(id);

  // Fetch the current user role to prevent recruiters/interviewers from applying
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) userRole = profile.role;
  }

  return (
    <JobDetailView opening={opening} alreadyApplied={alreadyApplied} userRole={userRole} />
  );
}
