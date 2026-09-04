"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignedApplications } from "@/app/actions/interviewer-data";
import { Calendar, Loader2, Search } from "lucide-react";
import { useCachedAction } from "@/hooks/use-cached-action";

export function DashboardClient({ preview = false, previewData = null, activeCompanyId }: { preview?: boolean, previewData?: any, activeCompanyId?: string }) {
  // If preview mode, use a dummy hook that returns previewData without fetching
  const { data: fetchedData, isLoading } = preview 
    ? { data: previewData, isLoading: false } 
    : useCachedAction(`assigned-applications-${activeCompanyId}`, () => getAssignedApplications(activeCompanyId));
    
  const applications = (preview ? previewData?.applications : fetchedData?.applications) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const uniqueStages = useMemo(() => {
    const stages = new Set(applications.map((app: any) => app.stage).filter(Boolean));
    return Array.from(stages);
  }, [applications]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(applications.map((app: any) => app.opening?.department).filter(Boolean));
    return Array.from(depts);
  }, [applications]);

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(app => 
        (app.candidate_name || "").toLowerCase().includes(query) ||
        (app.candidate_email || "").toLowerCase().includes(query) ||
        (app.opening?.title || "").toLowerCase().includes(query)
      );
    }

    if (stageFilter !== "all") {
      result = result.filter(app => app.stage === stageFilter);
    }

    if (departmentFilter !== "all") {
      result = result.filter(app => app.opening?.department === departmentFilter);
    }

    result.sort((a, b) => {
      if (a.hasFeedback !== b.hasFeedback) {
        return a.hasFeedback ? 1 : -1;
      }
      
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortOrder === "name-asc") {
        return (a.candidate_name || "").localeCompare(b.candidate_name || "");
      } else if (sortOrder === "name-desc") {
        return (b.candidate_name || "").localeCompare(a.candidate_name || "");
      }
      return 0;
    });

    return result;
  }, [applications, searchQuery, stageFilter, departmentFilter, sortOrder]);
  
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "applied": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
      case "screening": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "interview": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "offer": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "hired": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "withdrawn": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  if (isLoading && !fetchedData && !preview) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 max-w-6xl mx-auto w-full", preview && "p-0")}>
      <div className={cn(preview ? "" : "w-full")}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Assigned Candidates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Candidates you have been assigned to interview.
          </p>
        </div>
        <div>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No active assignments</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  You currently don't have any candidates assigned to you for interviews.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates or jobs..."
                      className="pl-8 bg-background h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Stage">
                          {stageFilter === "all" ? "All Stages" : getStageLabel(stageFilter)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {uniqueStages.map(stage => (
                          <SelectItem key={stage as string} value={stage as string}>{getStageLabel(stage as string)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Department">
                          {departmentFilter === "all" ? "All Departments" : departmentFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {uniqueDepartments.map(dept => (
                          <SelectItem key={dept as string} value={dept as string}>{dept as string}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Sort by">
                          {sortOrder === "newest" ? "Newest First" : 
                           sortOrder === "oldest" ? "Oldest First" : 
                           sortOrder === "name-asc" ? "Name (A-Z)" : "Name (Z-A)"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredAndSortedApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md border-dashed">
                    <p className="text-muted-foreground font-medium">No matches found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="hidden md:table-cell">Applied</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedApplications.map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{app.candidate_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                              #{app.id.substring(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground hidden sm:block mt-0.5">
                            {app.candidate_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            {app.opening?.company?.name && (
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                                {app.opening.company.name}
                              </Badge>
                            )}
                          </div>
                          <div>{app.opening?.title || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">
                            {app.opening?.department || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStageColor(app.stage)}>
                            {getStageLabel(app.stage)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {app.hasFeedback ? (
                            <Badge variant="outline" className="bg-emerald-100/50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800">Submitted</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100/50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {preview ? (
                             <span className={cn(buttonVariants({ variant: "default", size: "sm" }), "opacity-50 pointer-events-none")}>
                               {app.hasFeedback ? "View Details" : "Review Now"}
                             </span>
                          ) : (
                            <Link href={`/interviewer/applications/${app.id}`} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                              {app.hasFeedback ? "View Details" : "Review Now"}
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
