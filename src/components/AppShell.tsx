"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  user: {
    displayName: string
    role: string
  }
  mainClassName?: string
}

export function AppShell({ children, user, mainClassName }: AppShellProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-full flex flex-col w-full">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold text-lg tracking-tight">BD Assigner</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{user.displayName}</span>
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-900 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className={mainClassName ?? "flex-1 max-w-7xl mx-auto px-6 py-8 w-full"}>
        {children}
      </main>
    </div>
  )
}
