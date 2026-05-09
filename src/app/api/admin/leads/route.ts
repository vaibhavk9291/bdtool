import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  await requireAdmin()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 25
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const assignee = searchParams.get('assignee') || ''
  const website = searchParams.get('website') || ''
  const followupState = searchParams.get('followupState') || ''
  const firstInterest = searchParams.get('firstInterest') || ''

  const where: Prisma.LeadWhereInput = {}

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { contact: { contains: q } }
    ]
  }

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (assignee && assignee !== 'ALL') {
    if (assignee === 'UNASSIGNED') {
      where.assignedToId = null
    } else {
      where.assignedToId = assignee
    }
  }

  if (website && website !== 'ALL') {
    where.hasWebsite = website === 'YES'
  }

  if (firstInterest && firstInterest !== 'ALL') {
    if (firstInterest === 'HAS') {
      where.firstInterest = { not: null, notIn: [''] }
    } else if (firstInterest === 'NONE') {
      where.OR = [
        ...(where.OR || []),
        { firstInterest: null },
        { firstInterest: '' }
      ]
    }
  }

  if (followupState && followupState !== 'ALL') {
    const now = new Date()
    if (followupState === 'SCHEDULED') {
      where.followUps = { some: { completed: false, scheduledAt: { gt: now } } }
    } else if (followupState === 'OVERDUE') {
      where.followUps = { some: { completed: false, scheduledAt: { lte: now } } }
    } else if (followupState === 'NONE') {
      where.followUps = { none: { scheduledAt: { not: null } } }
    }
  }

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { 
        assignedTo: { select: { displayName: true } },
        calls: { orderBy: { calledAt: 'desc' }, take: 1, select: { calledAt: true, notes: true } },
        followUps: { where: { completed: false, scheduledAt: { not: null } }, orderBy: { scheduledAt: 'asc' }, take: 1, select: { slot: true, scheduledAt: true } },
        _count: { select: { followUps: { where: { completed: false } } } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lead.count({ where })
  ])

  const mappedRows = rows.map(r => ({
    ...r,
    activeFollowUps: r._count.followUps
  }))

  return NextResponse.json({ rows: mappedRows, total, page, pageSize })
}
