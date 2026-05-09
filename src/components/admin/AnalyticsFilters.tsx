'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type UserOption = { id: string, displayName: string }

export function AnalyticsFilters({ users }: { users: UserOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultPreset = searchParams.get('preset') || (searchParams.get('from') ? 'custom' : 'last_7d')
  
  const [preset, setPreset] = useState(defaultPreset)
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')
  const [userId, setUserId] = useState(searchParams.get('userId') || 'ALL')

  const applyFilters = (newPreset: string, newFrom: string, newTo: string, newUserId: string) => {
    const params = new URLSearchParams()
    
    if (newPreset !== 'custom') {
      if (newPreset !== 'last_7d') params.set('preset', newPreset)
    } else {
      if (newFrom && newTo) {
        params.set('from', newFrom)
        params.set('to', newTo)
      } else {
        // Fallback if custom chosen but no dates
        return
      }
    }

    if (newUserId !== 'ALL') {
      params.set('userId', newUserId)
    }

    router.push(`/admin/dashboard?${params.toString()}`)
  }

  // Effect to apply filters when preset changes to non-custom, or user changes
  useEffect(() => {
    if (preset !== 'custom') {
      applyFilters(preset, '', '', userId)
    }
    // eslint-disable-next-line
  }, [preset, userId])

  const hasFilters = searchParams.toString() !== ''

  return (
    <div className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-lg shadow-sm text-sm">
      <Select value={preset} onChange={e => setPreset(e.target.value)} className="w-40">
        <option value="today">Today</option>
        <option value="last_7d">Last 7 Days</option>
        <option value="last_30d">Last 30 Days</option>
        <option value="this_month">This Month</option>
        <option value="all">All Time</option>
        <option value="custom">Custom Range...</option>
      </Select>

      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={from} 
            onChange={e => setFrom(e.target.value)} 
            className="w-36 h-9"
          />
          <span className="text-gray-400">to</span>
          <Input 
            type="date" 
            value={to} 
            onChange={e => {
              setTo(e.target.value)
              if (from && e.target.value) {
                applyFilters('custom', from, e.target.value, userId)
              }
            }} 
            className="w-36 h-9"
          />
        </div>
      )}

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <Select value={userId} onChange={e => setUserId(e.target.value)} className="w-48">
        <option value="ALL">All Users</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.displayName}</option>
        ))}
      </Select>

      {hasFilters && (
        <Link 
          href="/admin/dashboard"
          className="ml-2 text-gray-500 hover:text-gray-900 underline decoration-gray-300 underline-offset-4"
        >
          Clear
        </Link>
      )}
    </div>
  )
}
