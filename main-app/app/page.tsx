import Link from "next/link";
import { createClient } from "@/lib/server";
import { signOutAction } from "@/app/auth/actions";

import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  if (searchParams?.code) {
    redirect(`/auth/callback?code=${searchParams.code}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold tracking-tight">RosterPoint</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">About</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <form action={signOutAction}>
                <button type="submit" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60 cursor-pointer">
                  Log out
                </button>
              </form>
            ) : (
              <Link href="/login" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
                Log in
              </Link>
            )}
            <Link
              href={user ? "/recruiter/dashboard" : "/signup"}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              {user ? "Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-[800px] flex flex-col items-center gap-8 py-20 md:py-32">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Streamline your hiring pipeline.
            </h1>
            <p className="max-w-[600px] text-lg sm:text-xl text-muted-foreground">
              A collaborative applicant tracking system designed for recruiters and interviewers to manage candidates, stages, and feedback all in one place.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full sm:w-auto"
            >
              Start Building Now
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 w-full sm:w-auto"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
