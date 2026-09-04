"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { setActiveCompany, createNewCompanyAction } from "@/app/actions/company";

interface Company {
  id: string;
  name: string;
}

export function CompanySelector({ companies, activeCompanyId, allowAddCompany }: { companies: (Company | null | undefined)[], activeCompanyId?: string, allowAddCompany?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const validCompanies = (companies || []).filter((c): c is Company => Boolean(c && typeof c === 'object' && c.id));
  const uniqueCompanies = Array.from(new Map(validCompanies.map(c => [c.id, c])).values());
  
  if (uniqueCompanies.length === 0 && !allowAddCompany) return null;

  const currentId = activeCompanyId || uniqueCompanies[0]?.id;
  const currentCompany = uniqueCompanies.find(c => c.id === currentId) || uniqueCompanies[0];

  const handleValueChange = (val: string | null) => {
    if (!val) return;
    if (val === "add_new_company") {
      setIsModalOpen(true);
      return;
    }
    startTransition(async () => {
      await setActiveCompany(val);
      router.refresh();
    });
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsCreating(true);
    try {
      const res = await createNewCompanyAction(newCompanyName);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Company created successfully");
        setIsModalOpen(false);
        setNewCompanyName("");
        router.refresh();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center" style={{ opacity: isPending ? 0.7 : 1 }}>
        <Select value={currentCompany?.id || ""} onValueChange={handleValueChange} disabled={isPending}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-transparent border-none focus:ring-0 shadow-none font-medium hover:bg-muted/50 rounded-md">
            <SelectValue placeholder="Select company">
              {currentCompany?.name || "Select company"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {uniqueCompanies.map((company) => (
              <SelectItem key={company.id} value={company.id} className="text-xs">
                {company.name}
              </SelectItem>
            ))}
            {allowAddCompany && (
              <SelectItem value="add_new_company" className="text-xs font-medium text-primary mt-1 border-t rounded-none focus:bg-primary/10">
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add company
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Create a new company workspace. You will be assigned as its first recruiter.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompany} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input 
                id="company_name" 
                placeholder="Acme Corp" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                autoFocus
                disabled={isCreating}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newCompanyName.trim()}>
                {isCreating ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
