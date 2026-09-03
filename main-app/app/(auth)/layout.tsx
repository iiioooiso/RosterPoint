import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-[#E3F2FD] dark:bg-[#0B1521] p-6 md:p-10 relative overflow-hidden">
      {/* SUBTLE NOISE TEXTURE */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.06]" 
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
      ></div>
      
      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
        <div className="flex flex-col items-center justify-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-xl">RosterPoint</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
