'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Users, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PanelTabs() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'assignments'

  return (
    <div className="flex items-center gap-2">
      <Link 
        href="?tab=assignments" 
        scroll={false} 
        className={cn(
          "inline-flex items-center gap-2 justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          tab === 'assignments' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutList className="w-4 h-4" />
        Panel Assignments
      </Link>
      <Link 
        href="?tab=interviewers" 
        scroll={false} 
        className={cn(
          "inline-flex items-center gap-2 justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          tab === 'interviewers' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Users className="w-4 h-4" />
        Interviewers
      </Link>
    </div>
  )
}
