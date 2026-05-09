import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-gray-500">We couldn't find the page you're looking for.</p>
        <div className="pt-4">
          <Link href="/"><Button variant="outline">Go home</Button></Link>
        </div>
      </div>
    </div>
  )
}
