"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { StatusPill } from '@/components/ui/StatusPill'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Loader2, Download } from 'lucide-react'
import { LeadDetailDrawer } from '@/components/admin/LeadDetailDrawer'
import { AdminFollowUpsDrawer } from '@/components/admin/AdminFollowUpsDrawer'
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog'

import { usePolling } from '@/hooks/usePolling'

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Lead {
  id: string
  name: string
  contact: string
  hasWebsite: boolean
  status: string
  assignedToId: string | null
  assignedTo: { displayName: string } | null
  callCount: number
  lastCalledAt: string | null
  createdAt: string
  updatedAt: string
  firstInterest: string | null
  activeFollowUps: number
  calls: Array<{ calledAt: string, notes: string | null }>
  followUps: Array<{ slot: number, scheduledAt: string }>
}

export function LeadsClientInner({ 
  users, 
  initialAssigneeFilter = 'ALL' 
}: { 
  users: { id: string, displayName: string }[]
  initialAssigneeFilter?: string
}) {
  const [data, setData] = useState<{ rows: Lead[], total: number, page: number, pageSize: number }>({
    rows: [], total: 0, page: 1, pageSize: 25
  })
  const [loading, setLoading] = useState(true)
  const [changedRowIds, setChangedRowIds] = useState<Set<string>>(new Set())

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || 'ALL'
  const assigneeFilter = searchParams.get('assignee') ?? initialAssigneeFilter ?? 'ALL'
  const websiteFilter = searchParams.get('website') || 'ALL'
  const followupStateFilter = searchParams.get('followupState') || 'ALL'
  const firstInterestFilter = searchParams.get('firstInterest') || 'ALL'
  const pageStr = searchParams.get('page')
  const page = pageStr ? parseInt(pageStr) : 1

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else if (value === 'ALL' && key !== 'assignee') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    if (key !== 'page') params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLeadIdForDrawer, setSelectedLeadIdForDrawer] = useState<string | null>(null)
  const [selectedFollowUpsLeadId, setSelectedFollowUpsLeadId] = useState<string | null>(null)
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const isPaused = bulkAssignOpen || deleteConfirmOpen || selectedIds.size > 0 || !!selectedLeadIdForDrawer || !!selectedFollowUpsLeadId || exportDialogOpen

  const fetcher = useCallback(async () => {
    const params = new URLSearchParams(searchParams.toString())
    if (!params.has('page')) params.set('page', '1')
    if (!params.has('assignee') && initialAssigneeFilter) {
      params.set('assignee', initialAssigneeFilter)
    }
    const res = await fetch(`/api/admin/leads?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch leads')
    return await res.json()
  }, [searchParams, initialAssigneeFilter])

  const { data: polledData, refetch: fetchLeads } = usePolling(fetcher, 30000, isPaused)

  useEffect(() => {
    // eslint-disable-next-line
    setLoading(true)
    fetchLeads()
  }, [searchParams, fetchLeads])

  useEffect(() => {
    if (polledData) {
      // eslint-disable-next-line
      setData(prev => {
        if (prev.rows.length > 0 && polledData.rows.length > 0) {
          const oldRowsMap = new Map(prev.rows.map(r => [r.id, r]))
          const changedIds = new Set<string>()
          
          polledData.rows.forEach((newRow: Lead) => {
            const oldRow = oldRowsMap.get(newRow.id)
            if (oldRow) {
              if (
                oldRow.status !== newRow.status || 
                oldRow.callCount !== newRow.callCount || 
                oldRow.lastCalledAt !== newRow.lastCalledAt
              ) {
                changedIds.add(newRow.id)
              }
            }
          })
          
          if (changedIds.size > 0) {
            setChangedRowIds(changedIds)
            setTimeout(() => setChangedRowIds(new Set()), 1500)
          }
        }
        return polledData
      })
      setLoading(false)
    }
  }, [polledData])

  const toggleSelectAll = () => {
    if (selectedIds.size === data.rows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.rows.map(r => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleBulkReassign = async () => {
    try {
      const res = await fetch('/api/admin/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), assignedToId: bulkAssignTo || null })
      })
      if (!res.ok) throw new Error('Failed to reassign')
      toast.success('Leads reassigned')
      setBulkAssignOpen(false)
      setSelectedIds(new Set())
      fetchLeads()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    try {
      const isBulk = targetDeleteId === null
      const url = isBulk ? '/api/admin/leads/bulk' : `/api/admin/leads/${targetDeleteId}`
      const method = 'DELETE'
      const body = isBulk ? JSON.stringify({ ids: Array.from(selectedIds) }) : undefined

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(isBulk ? 'Leads deleted' : 'Lead deleted')
      setDeleteConfirmOpen(false)
      if (isBulk) setSelectedIds(new Set())
      fetchLeads()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleSingleReassign = async (id: string, newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: newAssigneeId || null })
      })
      if (!res.ok) throw new Error('Failed to reassign lead')
      toast.success('Lead reassigned')
      fetchLeads()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Input 
          placeholder="Search name or contact..." 
          defaultValue={q} 
          onBlur={e => setParam('q', e.target.value.trim())}
          onKeyDown={e => { if (e.key === 'Enter') setParam('q', e.currentTarget.value.trim()) }}
        />
        <Select value={statusFilter} onChange={e => setParam('status', e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="HOT">Hot</option>
          <option value="WARM">Warm</option>
          <option value="COLD">Cold</option>
          <option value="NOT_INTERESTED">Not Interested</option>
          <option value="CONVERTED">Converted</option>
          <option value="DO_NOT_CALL">Do Not Call</option>
        </Select>
        <Select value={assigneeFilter} onChange={e => setParam('assignee', e.target.value)}>
          <option value="ALL">All Assignees</option>
          <option value="UNASSIGNED">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
        </Select>
        <Select value={websiteFilter} onChange={e => setParam('website', e.target.value)}>
          <option value="ALL">Website: All</option>
          <option value="YES">Website: Yes</option>
          <option value="NO">Website: No</option>
        </Select>
        <Select value={firstInterestFilter} onChange={e => setParam('firstInterest', e.target.value)}>
          <option value="ALL">Interest: All</option>
          <option value="HAS">Has Interest</option>
          <option value="NONE">No Interest</option>
        </Select>
        <Select value={followupStateFilter} onChange={e => setParam('followupState', e.target.value)}>
          <option value="ALL">Follow-ups: All</option>
          <option value="SCHEDULED">Has Scheduled</option>
          <option value="OVERDUE">Overdue</option>
          <option value="NONE">None Set</option>
        </Select>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(pathname)}
          >
            Clear
          </Button>
          <Button variant="outline" className="flex items-center whitespace-nowrap px-3" onClick={() => setExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-md flex items-center justify-between">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkAssignOpen(true)}>Assign</Button>
            <Button variant="outline" size="sm" onClick={() => { setTargetDeleteId(null); setDeleteConfirmOpen(true); }} className="text-red-600 hover:bg-red-50 hover:text-red-700">Delete</Button>
          </div>
        </div>
      )}

      {/* Visual layout mirrors src/components/dashboard/DashboardClient.tsx. */}
      {/* Keep these in sync if shared visual changes are needed in future phases. */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium w-[32px]">
                <Checkbox 
                  checked={data.rows.length > 0 && selectedIds.size === data.rows.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Web</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-1/4">First Interest</th>
              <th className="px-4 py-3 font-medium">Follow-ups</th>
              <th className="px-4 py-3 font-medium text-right">Calls</th>
              <th className="px-4 py-3 font-medium text-right">Last Called</th>
              <th className="px-4 py-3 font-medium">Assigned To</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : data.rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            ) : (
              data.rows.map(row => {
                const isChanged = changedRowIds.has(row.id)
                return (
                  <tr key={row.id} className={`transition-colors duration-1000 ${isChanged ? 'bg-green-50' : 'hover:bg-gray-50'} group`}>
                    <td className="px-4 py-2 align-top">
                      <div className="mt-1">
                        <Checkbox 
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top font-medium text-black">
                      <button onClick={() => setSelectedLeadIdForDrawer(row.id)} className="hover:underline text-left text-black">
                        {row.name}
                      </button>
                    </td>
                    <td className="px-4 py-2 align-top text-gray-600 whitespace-nowrap">
                      {row.contact.includes('@') ? (
                        <a href={`mailto:${row.contact}`} className="hover:underline hover:text-black">{row.contact}</a>
                      ) : (
                        <a href={`tel:${row.contact}`} className="hover:underline hover:text-black">{row.contact}</a>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {row.hasWebsite ? <span className="text-xs bg-gray-100 px-2 py-1 rounded">Yes</span> : <span className="text-xs text-gray-400">No</span>}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2 align-top text-gray-900 max-w-[150px] truncate text-sm">
                      {row.firstInterest ? (
                        <span title={row.firstInterest}>
                          {row.firstInterest}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs relative whitespace-nowrap"
                        onClick={() => setSelectedFollowUpsLeadId(row.id)}
                      >
                        Follow-ups ({row.activeFollowUps || 0}/4)
                      </Button>
                    </td>
                    <td className="px-4 py-2 align-top text-right text-gray-500 font-mono">
                      {row.callCount}
                    </td>
                    <td suppressHydrationWarning className="px-4 py-2 align-top text-right text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(row.lastCalledAt)}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <Select 
                        className="h-8 py-1 px-2 w-full max-w-[140px] text-xs"
                        value={row.assignedToId || ''}
                        onChange={(e) => handleSingleReassign(row.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="relative group/menu">
                        <button className="p-1 text-gray-400 hover:text-black rounded">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-gray-200 shadow-lg rounded-md z-10 min-w-[120px] py-1">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setSelectedIds(new Set([row.id]))
                              setBulkAssignOpen(true)
                            }}
                          >
                            Reassign
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => { 
                              setTargetDeleteId(row.id)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {(page - 1) * data.pageSize + 1} to {Math.min(page * data.pageSize, data.total)} of {data.total}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setParam('page', (page - 1).toString())}>Prev</Button>
            <Button variant="secondary" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setParam('page', (page + 1).toString())}>Next</Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <Dialog isOpen={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} title="Bulk Reassign Leads">
        <div className="space-y-4">
          <label className="text-sm font-medium">Assign {selectedIds.size} leads to:</label>
          <Select value={bulkAssignTo} onChange={e => setBulkAssignTo(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </Select>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkReassign}>Confirm Assignment</Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete {targetDeleteId === null ? `${selectedIds.size} leads` : 'this lead'}? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>

      <LeadDetailDrawer 
        leadId={selectedLeadIdForDrawer} 
        onClose={() => setSelectedLeadIdForDrawer(null)}
        onReassign={() => { 
          setBulkAssignOpen(true)
          setSelectedIds(new Set([selectedLeadIdForDrawer!]))
        }}
        onDelete={() => {
          setTargetDeleteId(selectedLeadIdForDrawer)
          setSelectedLeadIdForDrawer(null)
          setDeleteConfirmOpen(true)
        }}
      />

      {selectedFollowUpsLeadId && (
        <AdminFollowUpsDrawer
          leadId={selectedFollowUpsLeadId}
          leadName={data.rows.find(r => r.id === selectedFollowUpsLeadId)?.name || 'Lead'}
          onClose={() => setSelectedFollowUpsLeadId(null)}
        />
      )}

      {/* Export Dialog */}
      <ExportLeadsDialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)} 
        scope="admin"
        currentFilters={Object.fromEntries(searchParams.entries())}
      />
    </div>
  )
}

export function LeadsClient(props: Parameters<typeof LeadsClientInner>[0]) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading leads...</div>}>
      <LeadsClientInner {...props} />
    </Suspense>
  )
}
