'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

type FunnelData = {
  totalAssigned: number
  calledAtLeastOnce: number
  hotOrWarm: number
  converted: number
}

export function ConversionFunnel({ data }: { data: FunnelData }) {
  if (data.totalAssigned === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-t border-b border-gray-100">
        <span className="text-gray-400">No leads assigned</span>
      </div>
    )
  }

  const chartData = [
    { name: 'Total Assigned', count: data.totalAssigned, fill: '#e5e7eb' },
    { name: 'Called ≥1', count: data.calledAtLeastOnce, fill: '#9ca3af' },
    { name: 'Hot/Warm', count: data.hotOrWarm, fill: '#4b5563' },
    { name: 'Converted', count: data.converted, fill: '#000000' },
  ]

  const formatLabel = (val: number | string) => {
    return `${val} (${((Number(val) / data.totalAssigned) * 100).toFixed(0)}%)`
  }

  return (
    <div className="h-64 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
          barCategoryGap="20%"
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
            width={120}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Bar dataKey="count" radius={4}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList dataKey="count" position="right" formatter={formatLabel} fill="#6b7280" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
