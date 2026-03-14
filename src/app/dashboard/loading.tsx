import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Brackets section skeleton */}
      <section>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-40 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pools section skeleton */}
      <section>
        <Skeleton className="h-7 w-36 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-3">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-16 w-full rounded-lg mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
