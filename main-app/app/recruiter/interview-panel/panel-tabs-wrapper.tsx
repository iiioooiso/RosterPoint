'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { PanelTabs } from '@/components/interview-panel/panel-tabs'
import { AssignmentsView } from './assignments-view'
import { InterviewersView } from './interviewers-view'

export function PanelTabsWrapper({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const router = useRouter()
  const pathname = usePathname()
  
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'assignments'
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Update the URL without triggering a Next.js server roundtrip
    // We use window.history.replaceState for a purely client-side URL update
    const params = new URLSearchParams(window.location.search)
    params.set('tab', value)
    
    // We do router.replace so Next.js is aware of the new URL, but with scroll: false
    // Since we are not awaiting searchParams in page.tsx anymore, this will be fast.
    // If it still triggers a server fetch we could use window.history.pushState directly,
    // but router.replace with scroll: false is generally better for Next.js app router.
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Sync state if URL changes externally (e.g. back button)
  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col h-full gap-6 w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between pb-4 border-b">
          <PanelTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="pt-6 flex-1 relative">
          <TabsContent value="assignments" className="m-0 border-none outline-none data-[state=inactive]:hidden focus-visible:ring-0">
            {/* 
              We use searchParams directly here. Since it's a client component, 
              we pass down the initial searchParams or we could rely on window.location.search.
              For simplicity, passing the server-provided searchParams is fine, 
              but it might be stale if client-side navigation happens without re-rendering this wrapper.
              We'll pass it down, but the component itself could also useSearchParams hook if needed. 
            */}
            <AssignmentsView searchParams={searchParams} />
          </TabsContent>
          <TabsContent value="interviewers" className="m-0 border-none outline-none data-[state=inactive]:hidden focus-visible:ring-0">
            <InterviewersView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
