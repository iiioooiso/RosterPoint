import { Suspense } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { AssignmentsView } from './assignments-view'
import { InterviewersView } from './interviewers-view'
import { PanelTabs } from '@/components/interview-panel/panel-tabs'

export const metadata = {
  title: 'Interview Panel | CX Hire'
}

export default async function InterviewPanelPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const currentTab = typeof params.tab === 'string' ? params.tab : 'assignments'

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b">
        <PanelTabs />
      </div>

      <div className="pt-6 flex-1">
        {currentTab === 'assignments' ? (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading assignments...</div>}>
            <AssignmentsView searchParams={params} />
          </Suspense>
        ) : (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading interviewers...</div>}>
            <InterviewersView />
          </Suspense>
        )}
      </div>
    </div>
  )
}
