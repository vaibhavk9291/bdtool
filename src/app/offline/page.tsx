'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-semibold mb-3">You're offline</h1>
        <p className="text-gray-600 mb-6">
          BD Assigner needs an internet connection to load lead data. Reconnect and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
