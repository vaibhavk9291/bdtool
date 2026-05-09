import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import * as xlsx from 'xlsx'

export async function GET() {
  await requireAdmin()

  const data = [
    { Name: 'Acme Corp', Contact: 'acme@example.com', 'Has Website': 'Yes' },
    { Name: 'Globex', Contact: '555-0199', 'Has Website': 'No' },
  ]

  const ws = xlsx.utils.json_to_sheet(data)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Leads')

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads_template.xlsx"',
    },
  })
}
