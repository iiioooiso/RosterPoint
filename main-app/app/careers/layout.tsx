import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RosterPoint Listings</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-12 lg:px-24 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
