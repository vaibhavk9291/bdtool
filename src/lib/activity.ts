import { Phone, RefreshCw, Upload, UserPlus, CalendarPlus, Trash, type LucideIcon } from 'lucide-react'

export interface EnrichedActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  metadata: string | null
  createdAt: string | Date
  user: { displayName: string }
  leadName?: string | null
}

export function formatActivity(log: EnrichedActivityLog): { text: string, icon: LucideIcon } {
  const userName = log.user.displayName
  let metadata: Record<string, unknown> = {}
  try {
    if (log.metadata) metadata = JSON.parse(log.metadata)
  } catch {}

  let text = `${userName} performed an action`
  let icon: LucideIcon = RefreshCw

  switch (log.action) {
    case 'CALL':
      text = `${userName} called ${log.leadName || 'a lead'}`
      icon = Phone
      break
    case 'STATUS_CHANGE':
      text = `${userName} changed status of ${log.leadName || 'a lead'} to ${String(metadata.to || 'something')}`
      icon = RefreshCw
      break
    case 'FOLLOWUP_SET':
      text = `${userName} ${metadata.completed ? 'completed' : 'set'} Follow-up ${String(metadata.slot)} for ${log.leadName || 'a lead'}`
      icon = CalendarPlus
      break
    case 'LEAD_UPLOADED':
      text = `${userName} uploaded new leads`
      icon = Upload
      break
    case 'LEAD_ASSIGNED':
      text = `${userName} assigned leads`
      icon = UserPlus
      break
    case 'LEADS_EXPORTED':
      text = metadata.scope === 'admin' 
        ? `${userName} exported ${String(metadata.count)} leads (filters: ${String(metadata.filters || 'none')})`
        : `${userName} exported ${String(metadata.count)} interested leads`
      icon = Upload
      break
    case 'LEAD_DELETED':
      text = `${userName} deleted leads`
      icon = Trash
      break
  }

  return { text, icon }
}
