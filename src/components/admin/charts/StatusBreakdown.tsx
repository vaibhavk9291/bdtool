'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type StatusData = Array<{
  status: string
  count: number
}>

export function StatusBreakdown({ data }: { data: StatusData }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-t border-b border-gray-100">
        <span className="text-gray-400">No status data</span>
      </div>
    )
  }

  // Visual hierarchy: HOT and CONVERTED are black, others are gray
  const getColor = (status: string) => {
    if (status.toUpperCase().includes('HOT') || status.toUpperCase().includes('CONVERTED')) {
      return '#000000'
    }
    return '#6b7280'
  }

  return (
    <div className="h-64 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="status" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#374151', fontSize: 11 }}
            width={120}
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#374151', fontSize: 11 }}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
