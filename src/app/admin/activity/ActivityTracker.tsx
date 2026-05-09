'use client'

import { useEffect } from 'react'
import { markActivitySeen } from '@/lib/activitySeen'

export function ActivityTracker() {
  useEffect(() => {
    markActivitySeen().catch(console.error)
  }, [])
  
  return null
}
