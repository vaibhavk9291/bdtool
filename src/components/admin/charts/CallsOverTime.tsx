'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

type CallsData = Array<{
  date: string
  count: number
  byUser?: Record<string, number>
}>

export function CallsOverTime({ data }: { data: CallsData }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-t border-b border-gray-100">
        <span className="text-gray-400">No calls in this date range</span>
      </div>
    )
  }

  // Find top 5 users across all days
  const totals: Record<string, number> = {}
  data.forEach(d => {
    if (d.byUser) {
      Object.entries(d.byUser).forEach(([u, c]) => {
        totals[u] = (totals[u] || 0) + c
      })
    }
  })

  const topUsers = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0])

  const chartData = data.map(d => {
    const formatted = { date: format(parseISO(d.date), 'MMM dd') } as any
    if (d.byUser) {
      let other = 0
      Object.entries(d.byUser).forEach(([u, c]) => {
        if (topUsers.includes(u)) {
          formatted[u] = c
        } else {
          other += c
        }
      })
      if (other > 0) formatted['Other'] = other
    } else {
      formatted['Calls'] = d.count
    }
    return formatted
  })

  const hasByUser = data[0]?.byUser !== undefined

  // Grayscale palette for lines
  const colors = ['#000000', '#4b5563', '#9ca3af', '#6b7280', '#374151']
  
  return (
    <div className="h-64 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af" 
            tick={{ fill: '#6b7280' }} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fill: '#6b7280' }} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
          />
          {hasByUser ? (
            <>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              {topUsers.map((u, i) => (
                <Line key={u} type="monotone" dataKey={u} stroke={colors[i]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
              <Line type="monotone" dataKey="Other" stroke="#d1d5db" strokeWidth={2} dot={{ r: 3 }} />
            </>
          ) : (
            <Line type="monotone" dataKey="Calls" stroke="#000000" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
