import { getGlobalHistory } from '@/app/actions/history'
import { HistoryFeed } from './history-feed'

export const metadata = {
  title: 'History | cx-hire',
  description: 'Recent hiring activity across the pipeline',
}

export default async function HistoryPage() {
  const { data: initialEvents, count } = await getGlobalHistory(1, 50)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">


      <div className="mx-auto max-w-3xl">
        <HistoryFeed initialData={initialEvents} initialCount={count} />
      </div>
    </div>
  )
}
