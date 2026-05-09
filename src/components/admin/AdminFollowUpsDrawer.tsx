'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface FollowUpSlot {
  slot: number
  scheduledAt: string | null
  note: string | null
  completed: boolean
}

interface AdminFollowUpsDrawerProps {
  leadId: string
  leadName: string
  onClose: () => void
}

function AdminFollowUpCard({ initialData, slotNumber }: { initialData: FollowUpSlot | null, slotNumber: number }) {
  const scheduledAt = initialData?.scheduledAt ? new Date(initialData.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Not scheduled'
  const note = initialData?.note || ''
  const completed = initialData?.completed || false

  return (
    <div className={`p-4 border rounded-md mb-4 ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`text-sm font-semibold ${completed ? 'text-gray-400 line-through' : 'text-black'}`}>Follow-up {slotNumber}</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Date</label>
          <div className="text-sm font-medium text-gray-900">{scheduledAt}</div>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Note</label>
          {note ? (
            <div className="text-sm text-gray-900 whitespace-pre-wrap">{note}</div>
          ) : (
            <div className="text-sm text-gray-400 italic">No notes</div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {completed ? (
            <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">✓ Completed</span>
          ) : (
            <span className="text-xs font-medium text-gray-400">Pending</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminFollowUpsDrawer({ leadId, leadName, onClose }: AdminFollowUpsDrawerProps) {
  const [slots, setSlots] = useState<FollowUpSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFollowUps() {
      try {
        const res = await fetch(`/api/leads/${leadId}/followups`)
        if (!res.ok) throw new Error('Failed to load follow-ups')
        const data = await res.json()
        setSlots(data.slots)
      } catch (err: unknown) {
        if (err instanceof Error) toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFollowUps()
  }, [leadId])

  return (
    <Drawer open={true} onClose={onClose} title={`Follow-ups: ${leadName}`}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-6">Read-only view of follow-ups scheduled by the BD.</p>
          {[1, 2, 3, 4].map(slotNumber => {
            const slotData = slots.find(s => s.slot === slotNumber) || null
            return (
              <AdminFollowUpCard 
                key={slotNumber}
                slotNumber={slotNumber}
                initialData={slotData}
              />
            )
          })}
        </div>
      )}
    </Drawer>
  )
}
