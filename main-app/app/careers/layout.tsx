import Link from "next/link";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/server";

export default async function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardUrl = "/student/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role || "student";
    dashboardUrl = `/${role}/dashboard`;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8 max-w-5xl">
          <Link href="/careers" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RosterPoint Careers</span>
          </Link>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  href="/login?next=/careers"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup?next=/careers"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3.5"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <Link
                href={dashboardUrl}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3.5"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
