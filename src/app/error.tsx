'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-12 text-center max-w-md mx-auto space-y-4 min-h-screen flex flex-col justify-center">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <p className="text-sm text-gray-500">
        {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred.'}
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/"><Button variant="outline">Go home</Button></Link>
      </div>
    </div>
  )
}
