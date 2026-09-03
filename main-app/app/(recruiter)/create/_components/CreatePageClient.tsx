"use client";

import { useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Opening } from "@/lib/types";
import { OpeningsList } from "./OpeningsList";
import { OpeningForm } from "./OpeningForm";
import { OpeningDetailView } from "./OpeningDetailView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

type ViewState = "list" | "create" | "edit" | "detail";

export function CreatePageClient({ initialOpenings }: { initialOpenings: Opening[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePageClientInner initialOpenings={initialOpenings} />
    </Suspense>
  );
}

function CreatePageClientInner({ initialOpenings }: { initialOpenings: Opening[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") as ViewState) || "list";
  const idParam = searchParams.get("id");
  const openings = initialOpenings;
  const selectedOpening = idParam ? openings.find(o => o.id === idParam) || null : null;

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Derived filter options
  const departments = Array.from(new Set(openings.map(o => o.department))).sort();
  const types = Array.from(new Set(openings.map(o => o.type).filter(Boolean) as string[])).sort();

  const setView = (newView: ViewState, id?: string) => {
    const params = new URLSearchParams(searchParams);
    if (newView === "list") {
      params.delete("view");
      params.delete("id");
    } else {
      params.set("view", newView);
      if (id) params.set("id", id);
      else params.delete("id");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateNew = () => {
    setView("create");
  };

  const handleEdit = (opening: Opening) => {
    setView("edit", opening.id);
  };

  const handleViewDetail = (opening: Opening) => {
    setView("detail", opening.id);
  };

  const handleBackToList = () => {
    setView("list");
  };

  if (view === "create" || view === "edit") {
    return (
      <OpeningForm
        opening={view === "edit" ? selectedOpening : null}
        onCancel={handleBackToList}
        onSuccess={() => handleBackToList()} // Just back to list; server revalidation updates data
      />
    );
  }

  if (view === "detail" && selectedOpening) {
    return (
      <OpeningDetailView
        opening={selectedOpening}
        onBack={handleBackToList}
        onEdit={() => handleEdit(selectedOpening)}
      />
    );
  }

  // Filter and sort openings
  const filteredOpenings = openings.filter(o => {
    if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (departmentFilter !== "all" && o.department !== departmentFilter) return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    return true;
  });

  filteredOpenings.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return sortBy === "newest" ? timeB - timeA : timeA - timeB;
  });

  const openOpenings = filteredOpenings.filter(o => o.status === "open" && !o.archived_at);
  const closedOpenings = filteredOpenings.filter(o => o.status === "closed" && !o.archived_at);
  const archivedOpenings = filteredOpenings.filter(o => !!o.archived_at);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="open" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="w-full sm:w-auto h-auto flex flex-wrap sm:flex-nowrap">
            <TabsTrigger value="open" className="flex-1">Open ({openOpenings.length})</TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">Closed ({closedOpenings.length})</TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">Archived ({archivedOpenings.length})</TabsTrigger>
          </TabsList>
          <Button onClick={handleCreateNew} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Create Opening
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 mt-6">
          <div className="relative flex-1 min-w-[200px] sm:max-w-[400px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search openings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={departmentFilter} onValueChange={(val: any) => setDepartmentFilter(val)}>
              <SelectTrigger className="flex-1 sm:w-[180px]">
                <SelectValue placeholder="Department">
                  {departmentFilter && departmentFilter !== 'all' ? departmentFilter : 'Department'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {types.length > 0 && (
              <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger className="flex-1 sm:w-[150px]">
                  <SelectValue placeholder="Type">
                    {typeFilter && typeFilter !== 'all' ? typeFilter : 'Type'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="flex-1 sm:w-[140px]">
                <SelectValue placeholder="Sort by">
                  {sortBy === 'newest' ? 'Newest first' : sortBy === 'oldest' ? 'Oldest first' : 'Sort by'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg bg-card mt-6">
          <div className="p-1">
            <TabsContent value="open" className="mt-0">
              <OpeningsList
                openings={openOpenings}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
              />
            </TabsContent>
            <TabsContent value="closed" className="mt-0">
              <OpeningsList
                openings={closedOpenings}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
              />
            </TabsContent>
            <TabsContent value="archived" className="mt-0">
              <OpeningsList
                openings={archivedOpenings}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                isArchivedView
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
