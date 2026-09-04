import { ReactNode } from "react"
import { signOutAction } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background h-16 flex items-center justify-between px-6">
        <div className="font-semibold text-lg tracking-tight">RosterPoint <span className="text-muted-foreground font-normal">Student</span></div>
        <form action={signOutAction}>
          <Button type="submit" variant="destructive" size="sm">Sign Out</Button>
        </form>
      </header>
      <main className="flex-1 bg-muted/30 p-6 md:p-12">
        {children}
      </main>
    </div>
  )
}
