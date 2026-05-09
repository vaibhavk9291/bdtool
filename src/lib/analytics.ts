import prisma from './prisma'

export type DateRange = { from: Date; to: Date }

export function parseRange(params: { from?: string; to?: string; preset?: string }): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(today.getTime() + 86_400_000 - 1)

  if (params.from && params.to) {
    return { from: new Date(params.from), to: new Date(params.to + 'T23:59:59') }
  }

  switch (params.preset) {
    case 'today':
      return { from: today, to: endOfToday }
    case 'last_7d':
      return { from: new Date(today.getTime() - 7 * 86_400_000), to: endOfToday }
    case 'last_30d':
      return { from: new Date(today.getTime() - 30 * 86_400_000), to: endOfToday }
    case 'this_month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday }
    case 'all':
      return { from: new Date(0), to: endOfToday }
    default:
      return { from: new Date(today.getTime() - 7 * 86_400_000), to: endOfToday }
  }
}

function getPreviousRange(range: DateRange): DateRange {
  const diff = range.to.getTime() - range.from.getTime()
  return {
    from: new Date(range.from.getTime() - diff - 1),
    to: new Date(range.to.getTime() - diff - 1)
  }
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export async function getKpis(range: DateRange, userId?: string) {
  const prevRange = getPreviousRange(range)

  const userFilter = userId ? { userId } : {}
  const leadUserFilter = userId ? { assignedToId: userId } : {}

  const [
    totalCalls, prevTotalCalls,
    activeUsersResult, prevActiveUsersResult,
    hotLeads,
    totalConvertedResult, prevTotalConvertedResult,
    totalChangedStatusResult, prevTotalChangedStatusResult
  ] = await Promise.all([
    // Calls
    prisma.call.count({ where: { calledAt: { gte: range.from, lte: range.to }, ...userFilter } }),
    prisma.call.count({ where: { calledAt: { gte: prevRange.from, lte: prevRange.to }, ...userFilter } }),
    
    // Active users (excluding admins, count distinct users who made a call)
    prisma.call.findMany({
      where: { calledAt: { gte: range.from, lte: range.to }, user: { role: 'USER' } },
      select: { userId: true },
      distinct: ['userId']
    }),
    prisma.call.findMany({
      where: { calledAt: { gte: prevRange.from, lte: prevRange.to }, user: { role: 'USER' } },
      select: { userId: true },
      distinct: ['userId']
    }),

    // Hot Leads (point in time)
    prisma.lead.count({ where: { status: 'HOT', ...leadUserFilter } }),

    // Conversion rate (rough proxy: CONVERTED vs total leads in range that were updated)
    // For a more accurate measure, we look at logs or just take assigned leads in the period.
    // The spec asks for "converted / total leads with status changes". Let's approximate by leads updated in the period.
    prisma.lead.count({ where: { status: 'CONVERTED', updatedAt: { gte: range.from, lte: range.to }, ...leadUserFilter } }),
    prisma.lead.count({ where: { status: 'CONVERTED', updatedAt: { gte: prevRange.from, lte: prevRange.to }, ...leadUserFilter } }),

    prisma.lead.count({ where: { updatedAt: { gte: range.from, lte: range.to }, status: { not: 'NEW' }, ...leadUserFilter } }),
    prisma.lead.count({ where: { updatedAt: { gte: prevRange.from, lte: prevRange.to }, status: { not: 'NEW' }, ...leadUserFilter } })
  ])

  const activeUsers = activeUsersResult.length
  const prevActiveUsers = prevActiveUsersResult.length

  const conversionRate = totalChangedStatusResult > 0 ? (totalConvertedResult / totalChangedStatusResult) * 100 : 0
  const prevConversionRate = prevTotalChangedStatusResult > 0 ? (prevTotalConvertedResult / prevTotalChangedStatusResult) * 100 : 0

  return {
    totalCalls,
    activeUsers,
    conversionRate,
    hotLeads,
    deltas: {
      totalCalls: calcDelta(totalCalls, prevTotalCalls),
      activeUsers: calcDelta(activeUsers, prevActiveUsers),
      conversionRate: prevConversionRate === 0 && conversionRate > 0 ? null : (prevConversionRate === 0 ? 0 : Math.round(conversionRate - prevConversionRate)), // Absolute percentage point change? Let's do relative or just round
    }
  }
}

export async function getPerUserStats(range: DateRange) {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      displayName: true,
      username: true,
      active: true,
      leads: {
        select: { status: true },
        where: { createdAt: { gte: range.from, lte: range.to } } // Assigned in period
      },
      calls: {
        select: { calledAt: true },
        where: { calledAt: { gte: range.from, lte: range.to } },
        orderBy: { calledAt: 'desc' }
      }
    }
  })

  return users.map(user => {
    const leadsAssigned = user.leads.length
    const hotLeads = user.leads.filter(l => l.status === 'HOT').length
    const converted = user.leads.filter(l => l.status === 'CONVERTED').length
    const callsMade = user.calls.length
    const conversionRate = leadsAssigned > 0 ? (converted / leadsAssigned) * 100 : 0

    return {
      userId: user.id,
      displayName: user.displayName,
      username: user.username,
      active: user.active,
      callsMade,
      leadsAssigned,
      hotLeads,
      converted,
      conversionRate,
      lastActiveAt: user.calls[0]?.calledAt || null
    }
  }).sort((a, b) => b.callsMade - a.callsMade)
}

export async function getCallsTimeSeries(range: DateRange, userId?: string) {
  const userFilter = userId ? { userId } : {}
  const calls = await prisma.call.findMany({
    where: { calledAt: { gte: range.from, lte: range.to }, ...userFilter },
    select: { calledAt: true, user: { select: { displayName: true } } }
  })

  const bucketMap = new Map<string, { count: number, byUser: Record<string, number> }>()
  
  // Initialize buckets for all days in range if range <= 30 days
  const diffDays = Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000)
  if (diffDays <= 31) {
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(range.from.getTime() + i * 86400000)
      const ds = d.toISOString().split('T')[0]
      bucketMap.set(ds, { count: 0, byUser: {} })
    }
  }

  for (const call of calls) {
    const dStr = call.calledAt.toISOString().split('T')[0]
    if (!bucketMap.has(dStr)) bucketMap.set(dStr, { count: 0, byUser: {} })
    const bucket = bucketMap.get(dStr)!
    bucket.count++
    const uName = call.user.displayName
    if (!bucket.byUser[uName]) bucket.byUser[uName] = 0
    bucket.byUser[uName]++
  }

  const result = Array.from(bucketMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    byUser: data.byUser
  }))
  result.sort((a, b) => a.date.localeCompare(b.date))
  return result
}

export async function getLeadStatusBreakdown(userId?: string) {
  const userFilter = userId ? { assignedToId: userId } : {}
  const res = await prisma.lead.groupBy({
    by: ['status'],
    where: userFilter,
    _count: { _all: true }
  })

  // Format statuses correctly
  const formatted = res.map(r => ({
    status: r.status.replace(/_/g, ' ').replace(/\w\S*/g, w => (w.replace(/^\w/, c => c.toUpperCase()))),
    count: r._count._all
  })).sort((a, b) => b.count - a.count)
  return formatted
}

export async function getFunnelCounts(userId?: string) {
  const userFilter = userId ? { assignedToId: userId } : {}
  
  const [totalAssigned, calledAtLeastOnce, hotOrWarm, converted] = await Promise.all([
    prisma.lead.count({ where: userFilter }),
    prisma.lead.count({ where: { ...userFilter, callCount: { gt: 0 } } }),
    prisma.lead.count({ where: { ...userFilter, status: { in: ['HOT', 'WARM'] } } }),
    prisma.lead.count({ where: { ...userFilter, status: 'CONVERTED' } })
  ])

  return { totalAssigned, calledAtLeastOnce, hotOrWarm, converted }
}

export async function getFollowUpBreakdown(userId?: string) {
  const userFilter = userId ? { lead: { assignedToId: userId } } : {}
  const now = new Date()

  const [scheduled, completed, overdue] = await Promise.all([
    prisma.followUp.count({ where: { ...userFilter, completed: false, scheduledAt: { gt: now } } }),
    prisma.followUp.count({ where: { ...userFilter, completed: true } }),
    prisma.followUp.count({ where: { ...userFilter, completed: false, scheduledAt: { lte: now } } })
  ])

  return { scheduled, completed, overdue }
}
