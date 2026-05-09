import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env'

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(env.SESSION_COOKIE_NAME)?.value

  if (!sessionId) return null

  const user = await prisma.user.findUnique({
    where: { username: sessionId },
    select: { id: true, username: true, displayName: true, role: true, active: true }
  })

  if (!user || !user.active) return null

  return user
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return session
}

export async function requireUser() {
  const session = await requireAuth()
  if (session.role === 'ADMIN') {
    redirect('/admin')
  }
  return session
}

export async function assertOwnsLead(leadId: string, userId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })
  if (!lead) throw new Error('Lead not found')

  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    select: { role: true } 
  })

  if (user?.role !== 'ADMIN' && lead.assignedToId !== userId) {
    throw new Error('Forbidden')
  }

  return lead
}
