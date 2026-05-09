export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-4 max-w-3xl">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-32 bg-gray-100 rounded-lg border border-gray-200"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
      <div className="h-64 bg-gray-100 rounded-lg border border-gray-200 mt-8"></div>
    </div>
  )
}
