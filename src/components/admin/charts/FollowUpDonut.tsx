'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type DonutData = {
  scheduled: number
  completed: number
  overdue: number
}

export function FollowUpDonut({ data }: { data: DonutData }) {
  const total = data.scheduled + data.completed + data.overdue

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-t border-b border-gray-100">
        <span className="text-gray-400">No follow-ups</span>
      </div>
    )
  }

  const chartData = [
    { name: 'Overdue', value: data.overdue, color: '#000000' }, // Heaviest
    { name: 'Scheduled', value: data.scheduled, color: '#6b7280' },
    { name: 'Completed', value: data.completed, color: '#d1d5db' },
  ].filter(d => d.value > 0)

  return (
    <div className="h-64 w-full text-xs relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="40%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Legend 
            verticalAlign="middle" 
            align="right" 
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', right: 0 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ left: '40%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <span className="text-2xl font-semibold">{total}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  )
}
