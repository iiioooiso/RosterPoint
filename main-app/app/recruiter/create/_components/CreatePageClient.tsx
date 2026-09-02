"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Opening } from "@/lib/types";
import { getOpeningById } from "@/app/actions/openings";
import { OpeningsList } from "./OpeningsList";
import { OpeningForm } from "./OpeningForm";
import { OpeningDetailView } from "./OpeningDetailView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ViewState = "list" | "create" | "edit" | "detail";

export function CreatePageClient({ initialOpenings }: { initialOpenings: Opening[] }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading openings...</div>}>
      <CreatePageClientInner initialOpenings={initialOpenings} />
    </Suspense>
  );
}

function CreatePageClientInner({ initialOpenings }: { initialOpenings: Opening[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewState, setViewState] = useState<ViewState>((searchParams.get("view") as ViewState) || "list");
  const [idState, setIdState] = useState<string | null>(searchParams.get("id"));
  const [openings, setOpenings] = useState<Opening[]>(initialOpenings);
  const [directOpening, setDirectOpening] = useState<Opening | null>(null);
  const [loadingOpening, setLoadingOpening] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    const currentView = (searchParams.get("view") as ViewState) || "list";
    const currentId = searchParams.get("id");
    setViewState(currentView);
    setIdState(currentId);

    if (currentId) {
      const match = initialOpenings.find(o => o.id === currentId);
      if (match) {
        setDirectOpening(match);
      } else {
        setLoadingOpening(true);
        getOpeningById(currentId)
          .then((data) => {
            if (data) {
              setDirectOpening(data);
            }
            setLoadingOpening(false);
          })
          .catch(() => {
            setLoadingOpening(false);
          });
      }
    } else {
      setDirectOpening(null);
    }
  }, [searchParams, initialOpenings]);

  const selectedOpening = directOpening || (idState ? openings.find(o => o.id === idState) || null : null);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Derived filter options
  const departments = Array.from(new Set(openings.map(o => o.department))).sort();
  const types = Array.from(new Set(openings.map(o => o.type).filter(Boolean) as string[])).sort();

  const setView = (newView: ViewState, id?: string) => {
    setViewState(newView);
    setIdState(id || null);
    const params = new URLSearchParams(searchParams.toString());
    if (newView === "list") {
      params.delete("view");
      params.delete("id");
    } else {
      params.set("view", newView);
      if (id) params.set("id", id);
      else params.delete("id");
    }
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
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

  if (viewState === "create" || viewState === "edit") {
    return (
      <OpeningForm
        opening={viewState === "edit" ? selectedOpening : null}
        onCancel={handleBackToList}
        onSuccess={() => handleBackToList()}
      />
    );
  }

  if (viewState === "detail") {
    if (loadingOpening) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Openings
          </Button>
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading opening details...</p>
          </Card>
        </div>
      );
    }

    if (selectedOpening) {
      return (
        <OpeningDetailView
          opening={selectedOpening}
          onBack={handleBackToList}
          onEdit={() => handleEdit(selectedOpening)}
        />
      );
    }

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </Button>
        <Card className="p-12 text-center bg-muted/20 border-dashed">
          <p className="font-semibold text-foreground mb-1">Opening Not Found</p>
          <p className="text-sm text-muted-foreground mb-4">
            The opening you requested could not be located or may have been deleted.
          </p>
          <Button onClick={handleBackToList} variant="outline" size="sm">
            Return to Openings List
          </Button>
        </Card>
      </div>
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
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {types.length > 0 && (
              <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger className="flex-1 sm:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="flex-1 sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
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
