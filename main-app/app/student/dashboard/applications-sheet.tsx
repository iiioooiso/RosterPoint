'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function ApplicationsSheet({ applications }: { applications: any[] }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="default" size="sm" />}>
        My Applications
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto h-[calc(100vh-2rem)] sm:h-[calc(100vh-2rem)] my-4 mr-4 rounded-xl border-l-0 shadow-2xl sm:p-6 p-4">
        <SheetHeader className="mb-6">
          <SheetTitle>My Applications</SheetTitle>
          <SheetDescription>Track the status of your applications.</SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4">
          {!applications || applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 border border-dashed rounded-md bg-muted/40 p-4">
              <p className="text-muted-foreground font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground">When you apply for a position, it will appear here.</p>
            </div>
          ) : (
            applications.map((app) => (
              <Card key={app.id}>
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{app.opening?.title}</CardTitle>
                    <CardDescription>{app.opening?.department}</CardDescription>
                  </div>
                  <Badge variant={app.stage === 'rejected' ? 'destructive' : 'default'} className="capitalize shrink-0 font-medium">
                    Current status : {app.stage}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Applied on {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
