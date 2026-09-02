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

interface CompanySelectorProps {
  companies: Company[]
  selectedCompanyId?: string
}

export function CompanySelector({ companies, selectedCompanyId }: CompanySelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const displayValue = selectedCompany ? selectedCompany.name : "all"

  const handleValueChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("company")
    } else {
      // Find company by name to get its id for the URL
      const company = companies.find(c => c.name === value)
      if (company) {
        params.set("company", company.id)
      }
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={displayValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[240px]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="All Companies" />
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
