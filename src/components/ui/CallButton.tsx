'use client'

import * as React from 'react'
import { Phone, Check, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { CallPopup } from '@/components/dashboard/CallPopup'

interface CallButtonProps {
  lead: {
    id: string
    name: string
    contact: string
    callCount: number
    lastCalledAt: string | null
  }
  onCallLogged?: (count: number, lastCalledAt: string) => void
}

export function CallButton({ lead, onCallLogged }: CallButtonProps) {
  const [status, setStatus] = React.useState<'default' | 'calling' | 'called'>('default')
  const [lastCalledAt, setLastCalledAt] = React.useState(lead.lastCalledAt)
  const [popupOpen, setPopupOpen] = React.useState(false)

  const isRecentlyCalled = React.useMemo(() => {
    if (!lastCalledAt) return false
    // eslint-disable-next-line
    const diff = Date.now() - new Date(lastCalledAt).getTime()
    return diff < 1000 * 60 * 60 // 1 hour
  }, [lastCalledAt])

  const handleCall = () => {
    setPopupOpen(true)
  }

  const handleCallLogged = (updated: { callCount: number; lastCalledAt: string; callId?: string }) => {
    setLastCalledAt(updated.lastCalledAt)
    setStatus('called')
    
    if (onCallLogged) onCallLogged(updated.callCount, updated.lastCalledAt)

    setTimeout(() => {
      setStatus('default')
    }, 5000)
  }

  return (
    <>
      <Button 
        size="sm" 
        variant={status === 'called' ? 'default' : (isRecentlyCalled ? 'outline' : 'default')}
        disabled={status === 'calling'}
        onClick={handleCall}
        className={status === 'called' ? 'bg-black text-white hover:bg-black' : ''}
      >
        {status === 'calling' && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
        {status === 'called' && <Check className="w-3 h-3 mr-2" />}
        {status === 'default' && <Phone className="w-3 h-3 mr-2" />}
        
        {status === 'calling' && 'Calling...'}
        {status === 'called' && 'Called ✓'}
        {status === 'default' && (isRecentlyCalled ? 'Call again' : 'Call')}
      </Button>

      <CallPopup 
        lead={{
          id: lead.id,
          name: lead.name,
          contact: lead.contact,
          callCount: lead.callCount,
          lastCalledAt: lastCalledAt
        }}
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onCallLogged={handleCallLogged}
      />
    </>
  )
}
