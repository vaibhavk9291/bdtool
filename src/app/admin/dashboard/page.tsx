import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LiveUpdatesFeed } from '@/components/admin/LiveUpdatesFeed'
import { EnrichedActivityLog } from '@/lib/activity'
import { Card } from '@/components/ui/Card'
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters'
import { KpiTiles } from '@/components/admin/KpiTiles'
import { PerUserTable } from '@/components/admin/PerUserTable'
import { CallsOverTime } from '@/components/admin/charts/CallsOverTime'
import { StatusBreakdown } from '@/components/admin/charts/StatusBreakdown'
import { ConversionFunnel } from '@/components/admin/charts/ConversionFunnel'
import { FollowUpDonut } from '@/components/admin/charts/FollowUpDonut'
import {
  parseRange,
  getKpis,
  getPerUserStats,
  getCallsTimeSeries,
  getLeadStatusBreakdown,
  getFunnelCounts,
  getFollowUpBreakdown
} from '@/lib/analytics'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; userId?: string; preset?: string }>
}) {
  await requireAdmin()

  const params = await searchParams
  const range = parseRange(params)
  const userId = params.userId && params.userId !== 'ALL' ? params.userId : undefined

  // Fetch initial logs for live feed
  const logsPromise = prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { user: { select: { displayName: true } } }
  })

  const [
    kpis, 
    perUserStats, 
    callsTimeSeries, 
    statusBreakdown, 
    funnel, 
    followUpBreakdown, 
    users,
    logs
  ] = await Promise.all([
    getKpis(range, userId),
    getPerUserStats(range),
    getCallsTimeSeries(range, userId),
    getLeadStatusBreakdown(userId),
    getFunnelCounts(userId),
    getFollowUpBreakdown(userId),
    prisma.user.findMany({ where: { active: true, role: 'USER' }, select: { id: true, displayName: true } }),
    logsPromise
  ])

  // Enrich logs for live feed
  const leadIds = logs.filter(l => l.entity === 'LEAD' && l.entityId).map(l => l.entityId as string)
  const uniqueLeadIds = [...new Set(leadIds)]
  
  let leadsMap: Record<string, string> = {}
  if (uniqueLeadIds.length > 0) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: uniqueLeadIds } },
      select: { id: true, name: true }
    })
    leadsMap = leads.reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {})
  }

  const enriched = logs.map(log => ({
    ...log,
    leadName: log.entity === 'LEAD' && log.entityId ? leadsMap[log.entityId] : null
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <AnalyticsFilters users={users} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <KpiTiles data={kpis} />

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-4 text-gray-800">Calls Over Time</h2>
            <CallsOverTime data={callsTimeSeries} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-4 text-gray-800">Lead Status</h2>
              <StatusBreakdown data={statusBreakdown} />
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-4 text-gray-800">Follow-ups</h2>
              <FollowUpDonut data={followUpBreakdown} />
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-4 text-gray-800">Conversion Funnel</h2>
            <ConversionFunnel data={funnel} />
          </Card>

          <Card className="p-0 overflow-hidden border-none shadow-none">
            <h2 className="text-sm font-semibold mb-4 px-1 text-gray-800">Team Performance</h2>
            <PerUserTable stats={perUserStats} />
          </Card>
        </div>

        {/* Live Updates feed — UNCHANGED, already exists in current layout */}
        <div className="col-span-12 xl:col-span-4">
          <LiveUpdatesFeed initialLogs={enriched as unknown as EnrichedActivityLog[]} />
        </div>
      </div>
    </div>
  )
}
