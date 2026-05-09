import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import * as xlsx from 'xlsx'

export async function POST(request: Request) {
  await requireAdmin()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = xlsx.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, unknown>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

    const parsedRows = []
    const seen = new Set<string>()

    for (const [index, row] of data.entries()) {
      let rawName = ''
      let rawContact = ''
      let rawHasWebsite = ''

      // Iterate through keys to find matches case-insensitively and ignoring whitespace
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.trim().toLowerCase()
        if (normalizedKey.includes('name')) {
          rawName = String(value)
        } else if (normalizedKey.includes('contact') || normalizedKey.includes('phone') || normalizedKey.includes('mobile') || normalizedKey.includes('number')) {
          rawContact = String(value)
        } else if (normalizedKey.includes('website') || normalizedKey.includes('web')) {
          rawHasWebsite = String(value)
        }
      }

      const name = rawName.trim()
      const contact = rawContact.trim()
      const rawHasWebsiteLower = rawHasWebsite.trim().toLowerCase()

      // Skip completely empty rows silently
      if (!name && !contact && !rawHasWebsiteLower) continue

      const hasWebsite = ['yes', 'true', '1'].includes(rawHasWebsiteLower)
      
      let status = 'valid'
      let reason = ''

      if (!name) {
        status = 'error'
        reason = 'Missing name'
      } else if (!contact) {
        status = 'error'
        reason = 'Missing contact'
      } else {
        const uniqueKey = `${name.toLowerCase()}|${contact.toLowerCase()}`
        if (seen.has(uniqueKey)) {
          status = 'error'
          reason = 'Duplicate in file'
        } else {
          seen.add(uniqueKey)
        }
      }

      parsedRows.push({
        rowNumber: index + 2, // +2 assuming 1 header row
        name,
        contact,
        hasWebsite,
        status,
        reason,
      })
    }

    return NextResponse.json({ rows: parsedRows })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message || 'Error parsing file' }, { status: 500 })
    return NextResponse.json({ error: 'Error parsing file' }, { status: 500 })
  }
}
