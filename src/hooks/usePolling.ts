import { useEffect, useRef, useState, useCallback } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  pause = false
) {
  const [data, setData] = useState<T | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  
  const savedFetcher = useRef(fetcher)
  const savedPause = useRef(pause)
  
  useEffect(() => {
    savedFetcher.current = fetcher
    savedPause.current = pause
  }, [fetcher, pause])

  const executeFetch = useCallback(async () => {
    try {
      const result = await savedFetcher.current()
      setData(result)
      setLastFetchedAt(new Date())
    } catch (e) {
      console.error('Polling error:', e)
    }
  }, [])

  useEffect(() => {
    executeFetch()

    let timeoutId: ReturnType<typeof setTimeout>

    const poll = () => {
      if (document.visibilityState === 'visible' && !savedPause.current) {
        executeFetch().finally(() => {
          timeoutId = setTimeout(poll, intervalMs)
        })
      } else {
        timeoutId = setTimeout(poll, 1000)
      }
    }

    timeoutId = setTimeout(poll, intervalMs)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeoutId)
        poll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [executeFetch, intervalMs])

  const isPolling = !pause
  return { data, isPolling, lastFetchedAt, refetch: executeFetch }
}
