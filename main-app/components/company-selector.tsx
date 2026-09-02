"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setActiveCompany } from "@/app/actions/company";

interface Company {
  id: string;
  name: string;
}

export function CompanySelector({ companies, activeCompanyId }: { companies: Company[], activeCompanyId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!companies || companies.length === 0) return null;

  const currentId = activeCompanyId || companies[0]?.id;
  const currentCompany = companies.find(c => c.id === currentId);

  const handleValueChange = (val: string | null) => {
    if (!val) return;
    startTransition(async () => {
      await setActiveCompany(val);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center" style={{ opacity: isPending ? 0.7 : 1 }}>
      <Select value={currentId} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[180px] h-8 text-xs bg-transparent border-none focus:ring-0 shadow-none font-medium hover:bg-muted/50 rounded-md">
          <SelectValue placeholder="Select company">
            {currentCompany?.name || "Select company"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id} className="text-xs">
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
