import Link from 'next/link'
import { StatusPill } from '@/components/ui/StatusPill'

type UserStats = {
  userId: string
  displayName: string
  username: string
  active: boolean
  callsMade: number
  leadsAssigned: number
  hotLeads: number
  converted: number
  conversionRate: number
  lastActiveAt: Date | null
}

export function PerUserTable({ stats }: { stats: UserStats[] }) {
  const formatRelTime = (d: Date | null) => {
    if (!d) return 'Never'
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs sticky top-0">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium text-right">Calls Made</th>
            <th className="px-4 py-3 font-medium text-right">Assigned</th>
            <th className="px-4 py-3 font-medium text-right">Hot</th>
            <th className="px-4 py-3 font-medium text-right">Converted</th>
            <th className="px-4 py-3 font-medium text-right">Conv. Rate</th>
            <th className="px-4 py-3 font-medium text-right">Last Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stats.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                No users yet. Add users from the Users page.
              </td>
            </tr>
          ) : (
            stats.map(s => (
              <tr key={s.userId} className="hover:bg-gray-50 group">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${s.userId}`} className="block">
                    <div className="font-medium text-gray-900 group-hover:underline">
                      {s.displayName}
                    </div>
                    <div className="text-xs text-gray-500">@{s.username}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-medium">{s.callsMade.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-600">{s.leadsAssigned.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-600">{s.hotLeads.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-600">{s.converted.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {s.conversionRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {formatRelTime(s.lastActiveAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
