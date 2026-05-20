'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { Loader2, Video, MapPin } from 'lucide-react'

interface MeetingDrawerProps {
  leadId: string
  leadName: string
  onClose: () => void
}

interface Meeting {
  id: string
  type: string
  scheduledAt: string | null
  note: string | null
  createdAt: string
}

export function MeetingDrawer({ leadId, leadName, onClose }: MeetingDrawerProps) {
  const [activeTab, setActiveTab] = useState<'ONLINE' | 'OFFLINE'>('ONLINE')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  
  // Offline form state
  const [offlineDate, setOfflineDate] = useState('')
  const [offlineTime, setOfflineTime] = useState('')
  const [offlineNote, setOfflineNote] = useState('')
  const [savingOffline, setSavingOffline] = useState(false)

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/meetings`)
      if (!res.ok) throw new Error('Failed to load meetings')
      const data = await res.json()
      setMeetings(data.meetings)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [leadId])

  const handleOnlineSchedule = () => {
    const eventName = encodeURIComponent(`Meeting with ${leadName}`)
    // vcon=meet auto-adds Google Meet to the calendar event
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${eventName}&vcon=meet`
    
    // Open in a smaller popup window
    window.open(url, 'GoogleCalendar', 'width=800,height=600,scrollbars=yes')
  }

  const handleSaveOffline = async () => {
    if (!offlineDate || !offlineTime) {
      toast.error('Please select both date and time')
      return
    }

    setSavingOffline(true)
    try {
      // Combine date and time
      const dateTimeString = `${offlineDate}T${offlineTime}:00`
      const scheduledAt = new Date(dateTimeString).toISOString()

      const res = await fetch(`/api/leads/${leadId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OFFLINE',
          scheduledAt,
          note: offlineNote
        })
      })

      if (!res.ok) throw new Error('Failed to save meeting')
      toast.success('Offline meeting scheduled')
      
      // Reset form and refetch
      setOfflineDate('')
      setOfflineTime('')
      setOfflineNote('')
      fetchMeetings()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingOffline(false)
    }
  }

  return (
    <Drawer open={true} onClose={onClose} title={`Schedule Meeting: ${leadName}`}>
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${activeTab === 'ONLINE' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('ONLINE')}
        >
          <Video className="w-4 h-4 mr-2" />
          Online
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${activeTab === 'OFFLINE' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('OFFLINE')}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Offline
        </button>
      </div>

      {activeTab === 'ONLINE' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Click below to open Google Calendar in a new window. Google Meet will automatically be added to the event. 
            Once you save the event, you can copy the Meet link and send it via WhatsApp.
          </p>
          <Button onClick={handleOnlineSchedule} className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Schedule via Google Calendar
          </Button>
        </div>
      )}

      {activeTab === 'OFFLINE' && (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Date</label>
              <Input 
                type="date" 
                value={offlineDate}
                onChange={e => setOfflineDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Time</label>
              <Input 
                type="time"
                value={offlineTime}
                onChange={e => setOfflineTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Note (Location, Agenda, etc.)</label>
            <textarea 
              className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              placeholder="Where are you meeting?"
              value={offlineNote}
              onChange={e => setOfflineNote(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveOffline} disabled={savingOffline} className="w-full">
            {savingOffline ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
            Save Offline Meeting
          </Button>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-medium mb-3">Previous Meetings</h3>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No offline meetings recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {meetings.map(m => (
              <div key={m.id} className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {m.type}
                  </span>
                  {m.scheduledAt && (
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(m.scheduledAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {m.note && <p className="text-sm text-gray-700 mt-1">{m.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
