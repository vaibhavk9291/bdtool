import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatActivity, EnrichedActivityLog } from '@/lib/activity'
import { ActivityTracker } from './ActivityTracker'
import { Prisma } from '@prisma/client'

export default async function AdminActivityPage(props: { searchParams: Promise<{ leadId?: string }> }) {
  await requireAdmin()
  const searchParams = await props.searchParams
  const leadId = searchParams.leadId

  const where: Prisma.ActivityLogWhereInput = {}
  if (leadId) {
    where.entity = 'LEAD'
    where.entityId = leadId
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { displayName: true } } }
  })

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
    <div className="space-y-6 max-w-4xl">
      <ActivityTracker />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-gray-500">All activity across the platform.</p>
        </div>
        {leadId && (
          <a href="/admin/activity" className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-200 flex items-center gap-2 transition-colors">
            Filtered to lead <span className="text-gray-400">·</span> clear
          </a>
        )}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="divide-y divide-gray-100">
          {enriched.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No activity yet.</div>
          ) : (
            enriched.map(log => {
              const { text, icon: Icon } = formatActivity(log as unknown as EnrichedActivityLog)
              return (
                <div key={log.id} className="p-4 flex items-start gap-4">
                  <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{text}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
