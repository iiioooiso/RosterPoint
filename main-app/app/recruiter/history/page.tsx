import { getApplicantsWithHistory } from '@/app/actions/history'
import { ApplicantsHistoryTable } from '@/components/history/applicants-history-table'

export const metadata = {
  title: 'History | cx-hire',
  description: 'Candidate activity history and pipeline audit trails',
}

export default async function HistoryPage() {
  const { data: applicants } = await getApplicantsWithHistory()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
      <div className="border-b pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review candidate-by-candidate hiring timeline, stage progressions, and interviewer evaluations.
        </p>
      </div>

      <ApplicantsHistoryTable applicants={applicants || []} />
    </div>
  )
}
