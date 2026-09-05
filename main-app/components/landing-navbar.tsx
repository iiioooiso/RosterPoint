"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LandingNavbar({ user, dashboardUrl }: { user: any, dashboardUrl: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full h-0">
      <div
        className={cn(
          "w-full transition-all duration-300 flex justify-center",
          scrolled ? "pt-4 px-4" : "pt-2 px-2 md:pt-3.5 md:px-3.5 lg:pt-4 lg:px-4"
        )}
      >
        <div 
          className={cn(
            "flex items-center justify-between transition-all duration-300",
            scrolled
              ? "h-14 px-8 rounded-full border border-border/40 bg-background/80 backdrop-blur-md shadow-md gap-8 w-auto max-w-fit"
              : "h-20 px-6 container mx-auto max-w-6xl w-full bg-transparent"
          )}
        >
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 shadow-sm transition-transform group-hover:scale-105">
              <span className="text-[12px] font-bold text-white leading-none">RP</span>
            </div>
            <span className="font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
              RosterPoint
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="transition-colors hover:text-foreground text-muted-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground text-muted-foreground">How it Works</a>
            <Link href="/careers" className="transition-colors hover:text-foreground text-muted-foreground">Careers</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hidden sm:block">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Get Started
              </Link>
            </>
          ) : (
            <Link
              href={dashboardUrl}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
