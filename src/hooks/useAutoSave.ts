import { useState, useCallback, useRef, useEffect } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave<T>(
  saveFunction: (value: T) => Promise<void>,
  debounceMs = 500
) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const save = useCallback(
    (value: T) => {
      setStatus('saving')

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)

      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFunction(value)
          setStatus('saved')

          savedTimeoutRef.current = setTimeout(() => {
            setStatus('idle')
          }, 1500)
        } catch {
          setStatus('error')
        }
      }, debounceMs)
    },
    [saveFunction, debounceMs]
  )

  const saveImmediate = useCallback(
    async (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      
      setStatus('saving')
      try {
        await saveFunction(value)
        setStatus('saved')

        savedTimeoutRef.current = setTimeout(() => {
          setStatus('idle')
        }, 1500)
      } catch (err) {
        setStatus('error')
        throw err
      }
    },
    [saveFunction]
  )

  return { status, save, saveImmediate }
}
