'use server'

import { cookies } from 'next/headers'

export async function getActivitySeenAt() {
  const cookieStore = await cookies()
  const val = cookieStore.get('bd_activity_seen')?.value
  if (!val) return new Date(0)
  return new Date(val)
}

export async function markActivitySeen() {
  const cookieStore = await cookies()
  cookieStore.set('bd_activity_seen', new Date().toISOString(), { path: '/' })
}
