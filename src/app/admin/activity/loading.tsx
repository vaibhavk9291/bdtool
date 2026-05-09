export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200"></div>
        <div className="h-20 bg-gray-100 rounded-lg border border-gray-200"></div>
      </div>
    </div>
  )
}
