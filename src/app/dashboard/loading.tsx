export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex gap-4">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-12 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-12 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-12 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-12 bg-gray-100 rounded-lg border border-gray-200"></div>
      </div>
    </div>
  )
}
