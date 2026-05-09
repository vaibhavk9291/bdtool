'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface FollowUpSlot {
  slot: number
  scheduledAt: string | null
  note: string | null
  completed: boolean
}

interface FollowUpDrawerProps {
  leadId: string
  leadName: string
  onClose: () => void
}

function FollowUpCard({ leadId, initialData, slotNumber }: { leadId: string, initialData: FollowUpSlot | null, slotNumber: number }) {
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduledAt ? initialData.scheduledAt.split('T')[0] : '')
  const [note, setNote] = useState(initialData?.note || '')
  const [completed, setCompleted] = useState(initialData?.completed || false)

  const { status, saveImmediate } = useAutoSave(async (data: Partial<FollowUpSlot>) => {
    const res = await fetch(`/api/leads/${leadId}/followups/${slotNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`Failed to save Follow-up ${slotNumber}`)
  }, 500)

  // Handle local state and immediately trigger auto-save
  const handleDateChange = (val: string) => {
    setScheduledAt(val)
    saveImmediate({ scheduledAt: val ? new Date(val).toISOString() : null, note, completed })
  }

  const handleNoteBlur = () => {
    if (note !== (initialData?.note || '')) {
      saveImmediate({ scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, note, completed })
    }
  }

  const handleCompletedChange = (checked: boolean) => {
    setCompleted(checked)
    saveImmediate({ scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, note, completed: checked })
  }

  return (
    <div className={`p-4 border rounded-md mb-4 ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`text-sm font-semibold ${completed ? 'text-gray-400 line-through' : 'text-black'}`}>Follow-up {slotNumber}</h4>
        <span className={`text-[10px] ${status === 'saving' ? 'text-gray-400' : status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
          {status === 'saving' ? 'Saving...' : status === 'error' ? 'Error' : status === 'saved' ? 'Saved' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Date</label>
          <Input 
            type="date"
            value={scheduledAt}
            onChange={e => handleDateChange(e.target.value)}
            disabled={completed}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Note</label>
          <textarea 
            className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What needs to be done?"
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            disabled={completed}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox 
            id={`complete-${slotNumber}`}
            checked={completed}
            onChange={e => handleCompletedChange(e.target.checked)}
          />
          <label htmlFor={`complete-${slotNumber}`} className="text-sm cursor-pointer select-none">
            Mark as completed
          </label>
        </div>
      </div>
    </div>
  )
}

export function FollowUpDrawer({ leadId, leadName, onClose }: FollowUpDrawerProps) {
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
          <p className="text-sm text-gray-500 mb-6">Schedule and track up to 4 follow-ups for this lead.</p>
          {[1, 2, 3, 4].map(slotNumber => {
            const slotData = slots.find(s => s.slot === slotNumber) || null
            return (
              <FollowUpCard 
                key={slotNumber}
                leadId={leadId}
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
