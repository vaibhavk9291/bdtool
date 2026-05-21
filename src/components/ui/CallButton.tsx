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
  const [popupOpen, setPopupOpen] = React.useState(false)
  const [hasBeenCalled, setHasBeenCalled] = React.useState(lead.callCount > 0)

  // Sync state if lead.callCount changes externally (e.g. from props)
  React.useEffect(() => {
    setHasBeenCalled(lead.callCount > 0)
  }, [lead.callCount])

  const handleCall = () => {
    setPopupOpen(true)
  }

  const handleCallLogged = (updated: { callCount: number; lastCalledAt: string; callId?: string }) => {
    setHasBeenCalled(true)
    if (onCallLogged) onCallLogged(updated.callCount, updated.lastCalledAt)
  }

  return (
    <>
      <Button 
        size="sm" 
        variant="default"
        onClick={handleCall}
        className={hasBeenCalled ? 'bg-black text-white hover:bg-gray-800' : ''}
      >
        {hasBeenCalled ? <Check className="w-3 h-3 mr-2" /> : <Phone className="w-3 h-3 mr-2" />}
        {hasBeenCalled ? 'Called ✓' : 'Call'}
      </Button>

      <CallPopup 
        lead={{
          id: lead.id,
          name: lead.name,
          contact: lead.contact,
          callCount: lead.callCount,
          lastCalledAt: lead.lastCalledAt
        }}
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onCallLogged={handleCallLogged}
      />
    </>
  )
}
