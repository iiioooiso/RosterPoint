"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"

interface Company {
  id: string
  name: string
}

interface CompanyFilterProps {
  companies: Company[]
  selectedCompanyId?: string
}

export function CompanyFilter({ companies, selectedCompanyId }: CompanyFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedCompany = companies.find(
    (c) => c.id === selectedCompanyId || c.name.toLowerCase() === selectedCompanyId?.toLowerCase()
  )
  const displayValue = selectedCompany ? selectedCompany.name : "all"

  const handleValueChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("company")
    } else {
      const company = companies.find((c) => c.name === value || c.id === value)
      if (company) {
        params.set("company", company.id)
      } else {
        params.set("company", value)
      }
    }

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  return (
    <Select value={displayValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[220px] bg-background border shadow-xs">
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <SelectValue placeholder="All Companies">
            {displayValue === "all" ? "All Companies" : displayValue}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Companies</SelectItem>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.name}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
