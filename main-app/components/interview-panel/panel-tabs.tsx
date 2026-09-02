'use client'

import { Users, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function PanelTabs({ activeTab, onTabChange }: PanelTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => onTabChange('assignments')}
        className={cn(
          "inline-flex items-center gap-2 justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
          activeTab === 'assignments' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <LayoutList className="w-4 h-4" />
        Panel Assignments
      </button>
      <button 
        onClick={() => onTabChange('interviewers')}
        className={cn(
          "inline-flex items-center gap-2 justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
          activeTab === 'interviewers' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Users className="w-4 h-4" />
        Interviewers
      </button>
    </div>
  )
}
