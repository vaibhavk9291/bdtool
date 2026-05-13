"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  user: {
    displayName: string
    role: string
  }
  mainClassName?: string
  sidebar?: React.ReactNode
}

export function AppShell({ children, user, mainClassName, sidebar }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-full flex flex-col w-full h-screen">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sidebar && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors"
                title="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="font-semibold text-lg tracking-tight">BD Assigner</div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium hidden sm:inline-block">{user.displayName}</span>
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-900 transition-colors p-2"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {sidebar && (
          <aside className="hidden md:block w-56 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className={mainClassName ?? "flex-1 overflow-auto max-w-7xl mx-auto p-4 md:px-6 md:py-8 w-full"}>
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebar && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 h-0 overflow-y-auto pb-4">
              <div className="flex-shrink-0 flex items-center px-4 h-16 border-b border-gray-200">
                <span className="font-semibold text-lg tracking-tight">Menu</span>
              </div>
              {sidebar}
            </div>
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      )}
    </div>
  )
}
