import { PanelTabsWrapper } from './panel-tabs-wrapper'

export const metadata = {
  title: 'Interview Panel | CX Hire'
}

export default async function InterviewPanelPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full">
      <PanelTabsWrapper searchParams={params} />
    </div>
  )
}
