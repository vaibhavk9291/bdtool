'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { CallButton } from '@/components/ui/CallButton'
import { FollowUpDrawer } from './FollowUpDrawer'
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'
import { Loader2, Download } from 'lucide-react'

// Basic types for the client table
interface Lead {
  id: string
  name: string
  contact: string
  hasWebsite: boolean
  status: string
  firstInterest: string | null
  callCount: number
  lastCalledAt: string | null
  activeFollowUps: number
}

// Inline input with auto-save for First Interest
function InlineInterestEditor({ leadId, initialValue }: { leadId: string, initialValue: string }) {
  const [value, setValue] = useState(initialValue)
  
  const { status, save } = useAutoSave(async (newVal: string) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstInterest: newVal })
    })
    if (!res.ok) throw new Error('Failed to save interest')
  }, 500)

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => {
          setValue(e.target.value)
          save(e.target.value)
        }}
        className="h-8 text-sm border-transparent hover:border-gray-200 focus:border-black bg-transparent w-full min-w-[150px]"
        placeholder="Add note..."
      />
      {status !== 'idle' && (
        <span className={`absolute right-2 top-2 text-[10px] ${status === 'saving' ? 'text-gray-400' : status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
          {status === 'saving' ? 'Saving...' : status === 'error' ? 'Error' : 'Saved'}
        </span>
      )}
    </div>
  )
}

// Inline status selector
function InlineStatusEditor({ leadId, initialStatus, onStatusChange }: { leadId: string, initialStatus: string, onStatusChange: () => void }) {
  const [statusVal, setStatusVal] = useState(initialStatus)
  const [isEditing, setIsEditing] = useState(false)

  const { status: saveStatus, saveImmediate } = useAutoSave(async (newStatus: string) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) throw new Error('Failed to update status')
    onStatusChange()
  })

  if (!isEditing) {
    return (
      <div 
        className="cursor-pointer inline-block" 
        onClick={() => setIsEditing(true)}
      >
        <StatusPill status={statusVal} />
        {saveStatus === 'saved' && <span className="ml-2 text-[10px] text-gray-400">Saved</span>}
        {saveStatus === 'error' && <span className="ml-2 text-[10px] text-red-500">Error</span>}
      </div>
    )
  }

  return (
    <Select
      autoFocus
      className="h-8 text-sm min-w-[140px]"
      value={statusVal}
      onChange={e => {
        setStatusVal(e.target.value)
        setIsEditing(false)
        saveImmediate(e.target.value)
      }}
      onBlur={() => setIsEditing(false)}
    >
      <option value="NEW">New</option>
      <option value="HOT">Hot</option>
      <option value="WARM">Warm</option>
      <option value="COLD">Cold</option>
      <option value="NOT_INTERESTED">Not Interested</option>
      <option value="CONVERTED">Converted</option>
      <option value="DO_NOT_CALL">Do Not Call</option>
    </Select>
  )
}

export function DashboardClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  
  // Filters
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [calledFilter, setCalledFilter] = useState('ALL') // ALL | CALLED | NOT_CALLED
  const [websiteFilter, setWebsiteFilter] = useState('ALL') // ALL | YES | NO

  // Drawer state
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        q,
        status: statusFilter,
        called: calledFilter,
        website: websiteFilter
      })
      const res = await fetch(`/api/leads/mine?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      const json = await res.json()
      setLeads(json.rows)
      setTotal(json.total)
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, q, statusFilter, calledFilter, websiteFilter])

  useEffect(() => {
    // eslint-disable-next-line
    fetchLeads()
  }, [fetchLeads])

  const hasFilters = q || statusFilter !== 'ALL' || calledFilter !== 'ALL' || websiteFilter !== 'ALL'
  const clearFilters = () => {
    setQ('')
    setStatusFilter('ALL')
    setCalledFilter('ALL')
    setWebsiteFilter('ALL')
    setPage(1)
  }

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    // eslint-disable-next-line
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const updateLeadInList = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Input 
          placeholder="Search name or contact..." 
          value={q} 
          onChange={e => { setQ(e.target.value); setPage(1); }}
        />
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="HOT">Hot</option>
          <option value="WARM">Warm</option>
          <option value="COLD">Cold</option>
          <option value="NOT_INTERESTED">Not Interested</option>
          <option value="CONVERTED">Converted</option>
          <option value="DO_NOT_CALL">Do Not Call</option>
        </Select>
        <Select value={calledFilter} onChange={e => { setCalledFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Calls</option>
          <option value="CALLED">Called</option>
          <option value="NOT_CALLED">Not Called</option>
        </Select>
        <Select value={websiteFilter} onChange={e => { setWebsiteFilter(e.target.value); setPage(1); }}>
          <option value="ALL">Website: All</option>
          <option value="YES">Website: Yes</option>
          <option value="NO">Website: No</option>
        </Select>
        <div className="flex gap-2">
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          ) : <div className="flex-1" />}
          <Button variant="outline" className="flex items-center whitespace-nowrap px-3" onClick={() => setExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Web</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-1/4">First Interest</th>
              <th className="px-4 py-3 font-medium">Follow-ups</th>
              <th className="px-4 py-3 font-medium text-right">Calls</th>
              <th className="px-4 py-3 font-medium text-right">Last Called</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading your leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  {hasFilters ? 'No leads match your filters.' : 'No leads assigned yet. Check back soon.'}
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-2 align-top">
                    <CallButton 
                      lead={lead}
                      onCallLogged={(count, lastCalled) => updateLeadInList(lead.id, { callCount: count, lastCalledAt: lastCalled })}
                    />
                  </td>
                  <td className="px-4 py-2 align-top font-medium text-black">
                    {lead.name}
                  </td>
                  <td className="px-4 py-2 align-top text-gray-600 whitespace-nowrap">
                    {lead.contact.includes('@') ? (
                      <a href={`mailto:${lead.contact}`} className="hover:underline hover:text-black">{lead.contact}</a>
                    ) : (
                      <a href={`tel:${lead.contact}`} className="hover:underline hover:text-black">{lead.contact}</a>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {lead.hasWebsite ? <span className="text-xs bg-gray-100 px-2 py-1 rounded">Yes</span> : <span className="text-xs text-gray-400">No</span>}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <InlineStatusEditor 
                      leadId={lead.id} 
                      initialStatus={lead.status} 
                      onStatusChange={fetchLeads} 
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <InlineInterestEditor 
                      leadId={lead.id}
                      initialValue={lead.firstInterest || ''}
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs relative whitespace-nowrap"
                      onClick={() => setDrawerLeadId(lead.id)}
                    >
                      Follow-ups ({lead.activeFollowUps}/4)
                    </Button>
                  </td>
                  <td className="px-4 py-2 align-top text-right text-gray-500 font-mono">
                    {lead.callCount}
                  </td>
                  <td suppressHydrationWarning className="px-4 py-2 align-top text-right text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(lead.lastCalledAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 25 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerLeadId && (
        <FollowUpDrawer 
          leadId={drawerLeadId}
          leadName={leads.find(l => l.id === drawerLeadId)?.name || 'Lead'}
          onClose={() => {
            setDrawerLeadId(null)
            fetchLeads() // refresh to update activeFollowUps count
          }} 
        />
      )}

      {/* Export Dialog */}
      <ExportLeadsDialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)} 
        scope="user" 
      />
    </div>
  )
}
