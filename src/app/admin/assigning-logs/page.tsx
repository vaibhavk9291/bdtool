import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FileSpreadsheet, Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminAssigningLogsPage() {
  await requireAdmin()

  // Query logs including User details
  const logs = await prisma.csvAssignment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      assignedTo: {
        select: {
          displayName: true,
          username: true
        }
      }
    }
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Assigning Logs</h1>
          <p className="text-gray-500">Maintain the record of the CSV files assigned to users.</p>
        </div>
        <Link
          href="/admin/upload"
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 bg-black text-white hover:bg-gray-800 h-9 px-4 py-2 self-start sm:self-auto shadow-sm"
        >
          Upload &amp; Assign Leads
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">No assignments yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
              Once you upload spreadsheets of leads and assign them to an executive, the records will appear here.
            </p>
            <Link
              href="/admin/upload"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 h-9 px-4 py-2"
            >
              Start Uploading
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">When Assigned</th>
                    <th className="px-6 py-4 font-semibold">CSV File Name</th>
                    <th className="px-6 py-4 font-semibold">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black font-medium">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                          {log.csvName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-black">{log.assignedTo.displayName}</span>
                          <span className="text-gray-400 text-xs">@{log.assignedTo.username}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">CSV File Name</span>
                    <div className="text-black font-medium flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="break-all">{log.csvName}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Assigned To</span>
                    <div className="text-gray-800 flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>
                        <strong className="font-semibold text-black">{log.assignedTo.displayName}</strong>
                        <span className="text-gray-500 text-xs ml-1">@{log.assignedTo.username}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
