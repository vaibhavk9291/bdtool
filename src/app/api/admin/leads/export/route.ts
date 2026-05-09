import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { toCsv } from '@/lib/csv'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const adminUser = await requireAdmin()
  const { searchParams } = new URL(request.url)
  
  const isCount = searchParams.get('count') === 'true'
  const statusesParam = searchParams.get('statuses')
  const statuses = statusesParam ? statusesParam.split(',') : ['HOT', 'WARM', 'CONVERTED']

  const q = searchParams.get('q') || ''
  // Ignore page filter status if statuses dialog parameter is provided
  const status = statusesParam ? null : (searchParams.get('status') || '')
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

  // statusesParam from export dialog overrides status filter from table
  if (statuses.length > 0) {
    where.status = { in: statuses }
  } else if (status && status !== 'ALL') {
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

  if (isCount) {
    const count = await prisma.lead.count({ where })
    return NextResponse.json({ count })
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      assignedTo: { select: { displayName: true } },
      calls: { orderBy: { calledAt: 'desc' }, take: 1, select: { notes: true, calledAt: true } },
      followUps: {
        where: { completed: false, scheduledAt: { not: null } },
        orderBy: { scheduledAt: 'asc' },
        take: 1,
        select: { scheduledAt: true, note: true },
      },
    },
  })

  // Cap at 50,000 to defend against accidental massive exports
  if (leads.length > 50000) {
    return NextResponse.json({ error: 'Too many rows; please add filters' }, { status: 413 })
  }

  const headers = [
    'Name', 'Contact', 'Has Website', 'Status', 'First Interest',
    'Calls Made', 'Last Called', 'Last Call Note',
    'Latest Follow-up Date', 'Latest Follow-up Notes', 'Assigned To',
    'Next Follow-up Date', 'Next Follow-up Notes', 'Outcome', 'Action Items'
  ]

  const rows = leads.map(lead => {
    const lastCall = lead.calls[0]
    const nextFollowUp = lead.followUps[0]
    
    return [
      lead.name,
      lead.contact,
      lead.hasWebsite ? 'Yes' : 'No',
      lead.status,
      lead.firstInterest || '',
      lead.callCount,
      lead.lastCalledAt ? new Date(lead.lastCalledAt).toISOString().split('T')[0] : '',
      lastCall?.notes || '',
      nextFollowUp?.scheduledAt ? new Date(nextFollowUp.scheduledAt).toISOString().split('T')[0] : '',
      nextFollowUp?.note || '',
      lead.assignedTo?.displayName || 'Unassigned',
      '', // Next Follow-up Date
      '', // Next Follow-up Notes
      '', // Outcome
      ''  // Action Items
    ]
  })

  const csv = toCsv(headers, rows)
  const dateStr = new Date().toISOString().split('T')[0]
  const context = assignee && assignee !== 'ALL' && assignee !== 'UNASSIGNED' ? `_assignee-${assignee}` : ''
  const filename = `interested-leads_admin_${dateStr}${context}.csv`

  // Build filters object for metadata
  const filters: Record<string, string> = {}
  searchParams.forEach((v, k) => {
    if (k !== 'count' && k !== 'statuses') filters[k] = v
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      action: 'LEADS_EXPORTED',
      entity: 'LEAD',
      metadata: JSON.stringify({ 
        count: leads.length, 
        statuses, 
        scope: 'admin',
        filters: Object.keys(filters).length ? JSON.stringify(filters) : null
      })
    }
  })

  logger.info('lead.exported', { count: leads.length, scope: 'admin', userId: adminUser.id })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
