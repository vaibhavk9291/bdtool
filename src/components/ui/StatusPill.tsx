import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export type LeadStatus = "NEW" | "HOT" | "WARM" | "COLD" | "NOT_INTERESTED" | "CONVERTED" | "DO_NOT_CALL"

interface StatusPillProps {
  status: LeadStatus | string
  className?: string
}

const statusConfig: Record<string, { bg: string, text: string, label: string, icon?: boolean }> = {
  NEW: { bg: "bg-gray-100", text: "text-gray-700", label: "New" },
  HOT: { bg: "bg-black", text: "text-white", label: "Hot" },
  WARM: { bg: "bg-gray-200", text: "text-gray-800", label: "Warm" },
  COLD: { bg: "bg-gray-50", text: "text-gray-500", label: "Cold" },
  NOT_INTERESTED: { bg: "bg-gray-100", text: "text-gray-500 line-through", label: "Not Interested" },
  CONVERTED: { bg: "bg-black", text: "text-white", label: "Converted", icon: true },
  DO_NOT_CALL: { bg: "bg-gray-900", text: "text-gray-100", label: "Do Not Call" }
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.NEW

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap",
      config.bg,
      config.text,
      className
    )}>
      {config.icon && <Check className="mr-1 h-3 w-3" />}
      {config.label}
    </span>
  )
}
