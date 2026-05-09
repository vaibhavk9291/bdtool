'use client'

import { useEffect, useState } from 'react'
import { isInstalledPWA, isIOS } from '@/lib/pwa'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    // Hide entirely if already installed
    if (isInstalledPWA()) return

    // Check dismissal
    const dismissedAt = localStorage.getItem('pwa_install_dismissed_at')
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return // Don't show again within 7 days
    }

    if (isIOS()) {
      setShowIOSPrompt(true)
      setHidden(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setHidden(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed_at', Date.now().toString())
    setHidden(true)
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setHidden(true)
    } else {
      dismiss()
    }
    setDeferredPrompt(null)
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-4">
      {showIOSPrompt ? (
        <div className="flex-1 text-sm text-gray-800 flex items-center gap-2">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>Tap Share <strong className="text-xl leading-none">⍐</strong> then <strong>Add to Home Screen</strong> to install.</span>
        </div>
      ) : (
        <div className="flex-1 text-sm text-gray-800">
          <p className="font-semibold">Install BD Assigner</p>
          <p className="text-xs text-gray-500">For quick access and full-screen experience</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={dismiss} className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2">
          Dismiss
        </button>
        {!showIOSPrompt && (
          <Button onClick={install} size="sm" className="whitespace-nowrap h-8">
            Install
          </Button>
        )}
      </div>
    </div>
  )
}
