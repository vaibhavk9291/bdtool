'use client'

import * as React from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Phone, Mail, Copy, Check, Info } from 'lucide-react'
import { parseContact } from '@/lib/phone'

interface CallPopupProps {
  lead: { 
    id: string
    name: string
    contact: string
    callCount: number
    lastCalledAt: string | null 
  }
  open: boolean
  onClose: () => void
  onCallLogged: (updated: { callCount: number; lastCalledAt: string; callId?: string }) => void
}

export function CallPopup({ lead, open, onClose, onCallLogged }: CallPopupProps) {
  const [note, setNote] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const parsed = React.useMemo(() => parseContact(lead.contact), [lead.contact])

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setNote('')
      setLoading(false)
      setCopied(false)
    }, 200)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const logCall = async (viaAnchorClick: boolean) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
        keepalive: viaAnchorClick // Ensure the request continues even if browser navigates
      })
      if (!res.ok) throw new Error('Failed to log call')
      const data = await res.json()
      
      onCallLogged({ callCount: data.callCount, lastCalledAt: data.lastCalledAt, callId: data.callId })
      
      if (viaAnchorClick) {
        // Let the anchor navigate the browser natively, but close the popup shortly after
        setTimeout(() => handleClose(), 300)
      } else {
        handleClose()
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const handleAnchorClick = () => {
    logCall(true)
  }

  const handleMarkAsCalled = () => {
    logCall(false)
  }

  return (
    <Dialog isOpen={open} onClose={handleClose} className="sm:max-w-[400px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{lead.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Call #{lead.callCount + 1}</p>
        </div>

        {/* Contact Block */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center relative">
          {parsed.kind === 'phone' && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Phone</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono text-gray-900 tracking-tight">{parsed.display}</span>
                <button 
                  onClick={() => handleCopy(parsed.e164)}
                  className="text-gray-400 hover:text-black transition-colors bg-white border border-gray-200 rounded p-1.5"
                  title="Copy number"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}

          {parsed.kind === 'email' && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-medium text-gray-900">{parsed.address}</span>
                <button 
                  onClick={() => handleCopy(parsed.address)}
                  className="text-gray-400 hover:text-black transition-colors bg-white border border-gray-200 rounded p-1.5"
                  title="Copy email"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 italic mt-4 flex justify-center items-center gap-1.5">
                <Info className="w-3 h-3" />
                This lead has an email, not a phone number.
              </p>
            </>
          )}

          {parsed.kind === 'unknown' && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Contact (Unverified)</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-medium text-gray-900">{parsed.raw}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-4 flex justify-center items-center gap-1.5">
                <Info className="w-3 h-3" />
                Contact format not recognized.
              </p>
            </>
          )}
        </div>

        {/* Note Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quick note (optional)</label>
          <Input 
            placeholder="e.g., asked for pricing, call back at 4 PM"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {parsed.kind === 'phone' && (
            <a 
              href={parsed.href}
              onClick={handleAnchorClick}
              className={`flex w-full items-center justify-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          )}

          {parsed.kind === 'email' && (
            <a 
              href={parsed.href}
              onClick={handleAnchorClick}
              className={`flex w-full items-center justify-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <Mail className="w-5 h-5" />
              Send Email
            </a>
          )}

          {parsed.kind === 'unknown' && (
            <Button className="w-full py-6 text-base" disabled>
              Call Now
            </Button>
          )}

          <div className="flex justify-center">
            <button 
              onClick={handleMarkAsCalled}
              disabled={loading}
              className="text-sm font-medium text-gray-500 hover:text-black hover:underline transition-colors py-1"
            >
              Mark as {parsed.kind === 'email' ? 'emailed' : 'called'} without {parsed.kind === 'email' ? 'opening' : 'dialing'}
            </button>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
