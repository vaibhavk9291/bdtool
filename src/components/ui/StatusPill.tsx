import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export type LeadStatus = "NEW" | "HOT" | "WARM" | "COLD" | "NOT_INTERESTED" | "CONVERTED" | "NOT_RECEIVED"

interface StatusPillProps {
  status: LeadStatus | string
  className?: string
}

const statusConfig: Record<string, { bg: string, text: string, label: string, icon?: boolean }> = {
  NEW: { bg: "bg-indigo-50 border border-indigo-100", text: "text-indigo-600", label: "New" },
  HOT: { bg: "bg-rose-50 border border-rose-100 font-semibold", text: "text-rose-600", label: "Hot" },
  WARM: { bg: "bg-orange-50 border border-orange-100", text: "text-orange-600", label: "Warm" },
  COLD: { bg: "bg-cyan-50 border border-cyan-100", text: "text-cyan-600", label: "Cold" },
  NOT_INTERESTED: { bg: "bg-slate-100", text: "text-slate-400 line-through", label: "Not Interested" },
  CONVERTED: { bg: "bg-teal-50 border border-teal-200 font-semibold", text: "text-teal-700", label: "Converted", icon: true },
  NOT_RECEIVED: { bg: "bg-zinc-100 border border-zinc-200", text: "text-zinc-500", label: "Not Received" }
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
