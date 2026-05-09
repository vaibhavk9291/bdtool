"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface PreviewRow {
  rowNumber: number
  name: string
  contact: string
  hasWebsite: boolean
  status: 'valid' | 'error'
  reason: string
}

export function UploadClient({ users }: { users: { id: string, displayName: string }[] }) {
  const [, setFile] = useState<File | null>(null)
  const [assignedToId, setAssignedToId] = useState('')
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setPreviewRows([])
    
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/admin/leads/preview', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      
      setPreviewRows(data.rows)
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
      setFile(null)
      if (e.target) e.target.value = ''
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const validRows = previewRows.filter(r => r.status === 'valid')
    if (validRows.length === 0) return

    setImporting(true)
    try {
      const res = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map(r => ({ name: r.name, contact: r.contact, hasWebsite: r.hasWebsite })),
          assignedToId: assignedToId || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      
      toast.success(`Successfully imported ${data.count} leads`)
      router.push('/admin/leads')
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    } finally {
      setImporting(false)
    }
  }

  const validCount = previewRows.filter(r => r.status === 'valid').length
  const errorCount = previewRows.filter(r => r.status === 'error').length

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">1. Select File</h3>
            <Link 
              href="/api/admin/leads/template" 
              className="text-sm text-blue-600 hover:underline"
              target="_blank"
            >
              Download template
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">File (.xlsx, .csv)</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading || importing}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Assign to user (optional)</label>
              <Select 
                value={assignedToId} 
                onChange={(e) => setAssignedToId(e.target.value)}
                disabled={loading || importing}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-gray-500">Processing file...</p>}

      {previewRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">2. Preview</h3>
              <p className="text-sm text-gray-500">
                {validCount} valid, {errorCount} errors out of {previewRows.length} total
              </p>
            </div>
            <Button 
              onClick={handleImport} 
              disabled={validCount === 0 || importing}
            >
              {importing ? 'Importing...' : `Import ${validCount} Valid Rows`}
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 w-16">Row</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Has Website</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className={row.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-gray-500">{row.rowNumber}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.contact}</td>
                    <td className="px-4 py-3">{row.hasWebsite ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      {row.status === 'valid' ? (
                        <span className="text-green-600">✓ Valid</span>
                      ) : (
                        <span className="text-red-600">✗ {row.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 50 && (
              <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-200">
                Showing first 50 rows.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
