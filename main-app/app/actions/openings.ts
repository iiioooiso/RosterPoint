"use server";

import { createClient } from "@/lib/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import {
  OpeningDetail,
  OpeningRequirement,
  OpeningStatus,
  Opening,
  ApplicationMaterials,
} from "@/lib/types";
import { cookies } from "next/headers";

async function getActiveCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get('cx_active_company')?.value;
}

export type CreateOpeningInput = {
  title: string;
  department: string;
  description: string;
  type?: string | null;
  details?: OpeningDetail[];
  requirements?: OpeningRequirement[];
  skills?: string[];
  application_materials?: ApplicationMaterials;
};

export type UpdateOpeningInput = CreateOpeningInput & {
  status?: OpeningStatus;
};

export async function createOpening(input: CreateOpeningInput) {
  const supabase = await createClient();

  // Ensure recruiter role
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "recruiter") {
    throw new Error("Only recruiters can create openings");
  }

  const activeCompanyId = await getActiveCompanyId();
  if (!activeCompanyId) {
    throw new Error("No active company selected");
  }

  const { data, error } = await supabase
    .from("openings")
    .insert([
      {
        recruiter_id: userData.user.id,
        company_id: activeCompanyId,
        title: input.title,
        department: input.department,
        description: input.description,
        type: input.type || null,
        details: input.details || [],
        requirements: input.requirements || [],
        skills: input.skills || [],
        application_materials: input.application_materials || {
          resume: { enabled: true, required: true },
          portfolio: { enabled: true, required: false },
          cover_letter: { enabled: true, required: false },
        },
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating opening:", error);
    throw new Error("Failed to create opening");
  }

  revalidatePath("/create");
  return data as Opening;
}

export async function updateOpening(id: string, input: UpdateOpeningInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("openings")
    .update({
      title: input.title,
      department: input.department,
      description: input.description,
      type: input.type || null,
      status: input.status,
      details: input.details,
      requirements: input.requirements,
      skills: input.skills,
      application_materials: input.application_materials,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating opening:", error);
    throw new Error("Failed to update opening");
  }

  revalidatePath("/create");
  return data as Opening;
}

export async function archiveOpening(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("openings")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("Failed to archive opening");
  revalidatePath("/create");
}

export async function restoreOpening(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("openings")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) throw new Error("Failed to restore opening");
  revalidatePath("/create");
}

export async function getOpenings() {
  const supabase = await createClient();
  
  // Notice we use the middleware client, it should apply RLS correctly.
  // The RLS policy for recruiter allows them to see all.
  const activeCompanyId = await getActiveCompanyId();
  
  let query = supabase
    .from("openings")
    .select("*, company:companies(name)")
    .order("created_at", { ascending: false });

  if (activeCompanyId) {
    query = query.eq('company_id', activeCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching openings:", error.message || error);
    return [];
  }

  return (data || []).map((opening: any) => {
    const rawCompany = opening.company;
    const companyName = Array.isArray(rawCompany) ? rawCompany[0]?.name : rawCompany?.name;
    return {
      ...opening,
      company_name: companyName || null
    };
  }) as Opening[];
}

export async function getOpeningById(id: string): Promise<Opening | null> {
  if (!id || id === "undefined" || id === "null") {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("openings")
    .select("*, company:companies(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching opening by id:", error?.message || error);
    return null;
  }

  const rawCompany = (data as any).company;
  const companyName = Array.isArray(rawCompany) ? rawCompany[0]?.name : rawCompany?.name;
  return { ...data, company_name: companyName || null } as Opening;
}

export async function getPublicOpeningById(id: string) {
  if (!id || id === "undefined" || id === "null") {
    return null;
  }
  
  const supabase = getAdminClient() || (await createClient());
  
  const { data, error } = await supabase
    .from("openings")
    .select("*, company:companies(id, name)")
    .eq("id", id)
    // The RLS policy ensures only active, unarchived openings can be retrieved
    .single();

  if (error || !data) {
    console.error("Error fetching public opening:", error?.message || error);
    return null;
  }

  // Flatten company name
  const rawCompany = (data as any).company;
  let companyName = Array.isArray(rawCompany) ? rawCompany[0]?.name : rawCompany?.name;

  if (!companyName && (data as any).company_id) {
    const { data: comp } = await supabase
      .from("companies")
      .select("name")
      .eq("id", (data as any).company_id)
      .maybeSingle();
    if (comp?.name) {
      companyName = comp.name;
    }
  }

  return { ...data, company_name: companyName || null } as Opening & { company_name: string | null };
}
