import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await adminSupabase
      .from('documents')
      .update({ storage_path: 'dc37f43d-4252-4993-8176-267ab1f80851/e6edc7ba-ff3b-457a-9b09-183172ae9a0a.pdf' })
      .like('storage_path', 'resumes/%');

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Documents updated!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
