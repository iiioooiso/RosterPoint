import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInterviewHistory } from "@/app/actions/interviewer-data"
import { getActiveCompanyId } from "@/app/actions/company"
import { Building2, MessageSquare, Star } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function HistoryPage() {
  const activeCompanyId = await getActiveCompanyId()
  const { history, error } = await getInterviewHistory(activeCompanyId || undefined)

  if (error) {
    return <div className="text-red-500">Error loading history: {error}</div>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Interview History</h2>
          <p className="text-sm text-muted-foreground mt-1">View your past interviews and submitted feedback.</p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.application.candidate_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{item.application.opening.title}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.application.opening.company.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.details.rating ? (
                      <Badge variant="secondary" className="flex w-fit items-center gap-1">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        {item.details.rating}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 max-w-[300px]">
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm truncate" title={item.details.feedback}>
                        {item.details.feedback}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/interviewer/applications/${item.application_id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!history || history.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No interview history found for this company.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
