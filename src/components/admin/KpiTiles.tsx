import { Card } from '@/components/ui/Card'
import { ArrowUp, ArrowDown } from 'lucide-react'

type KpiData = {
  totalCalls: number
  activeUsers: number
  conversionRate: number
  hotLeads: number
  deltas: {
    totalCalls: number | null
    activeUsers: number | null
    conversionRate: number | null
  }
}

export function KpiTiles({ data }: { data: KpiData }) {
  const formatDelta = (val: number | null, suffix = '%') => {
    if (val === null) return null
    const isUp = val >= 0
    const Icon = isUp ? ArrowUp : ArrowDown
    const colorClass = isUp ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {Math.abs(val)}{suffix} vs prev period
      </span>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 space-y-2 flex flex-col justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Calls</h3>
        <p className="text-3xl font-semibold">{data.totalCalls.toLocaleString()}</p>
        <div className="text-xs min-h-[16px]">
          {formatDelta(data.deltas.totalCalls)}
        </div>
      </Card>
      
      <Card className="p-4 space-y-2 flex flex-col justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Users</h3>
        <p className="text-3xl font-semibold">{data.activeUsers.toLocaleString()}</p>
        <div className="text-xs min-h-[16px]">
          {formatDelta(data.deltas.activeUsers)}
        </div>
      </Card>
      
      <Card className="p-4 space-y-2 flex flex-col justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversion Rate</h3>
        <p className="text-3xl font-semibold">{data.conversionRate.toFixed(1)}%</p>
        <div className="text-xs min-h-[16px]">
          {formatDelta(data.deltas.conversionRate, '% pts')}
        </div>
      </Card>

      <Card className="p-4 space-y-2 flex flex-col justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hot Leads</h3>
        <p className="text-3xl font-semibold">{data.hotLeads.toLocaleString()}</p>
        <div className="text-xs text-gray-400 min-h-[16px]">
          Point in time
        </div>
      </Card>
    </div>
  )
}
