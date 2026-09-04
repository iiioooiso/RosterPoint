'use client'

import { Users, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function PanelTabs({ activeTab, onTabChange }: PanelTabsProps) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground shadow-inner">
      <button 
        onClick={() => onTabChange('assignments')}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
          activeTab === 'assignments' 
            ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
            : "hover:text-foreground hover:bg-background/50"
        )}
      >
        <LayoutList className="w-4 h-4 mr-2" />
        Panel Assignments
      </button>
      <button 
        onClick={() => onTabChange('interviewers')}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
          activeTab === 'interviewers' 
            ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
            : "hover:text-foreground hover:bg-background/50"
        )}
      >
        <Users className="w-4 h-4 mr-2" />
        Interviewers
      </button>
    </div>
  )
}
