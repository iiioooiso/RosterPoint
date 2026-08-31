import Link from "next/link";
import { ReactNode } from "next";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
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
