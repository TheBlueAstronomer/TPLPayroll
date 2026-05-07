/**
 * DashboardCardSkeleton — shimmer placeholder matching DashboardCard geometry.
 * Used during data loading to prevent layout shift.
 */
export function DashboardCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'flex flex-col gap-6 p-6 md:p-8',
        'bg-white rounded-2xl border border-zinc-200/60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        className,
      ].join(' ')}
    >
      {/* Label + icon row */}
      <div className="flex items-start justify-between">
        <div className="skeleton-shimmer h-3 w-28 rounded-md" />
        <div className="skeleton-shimmer h-5 w-5 rounded-md" />
      </div>

      {/* Value */}
      <div className="skeleton-shimmer h-12 w-32 rounded-lg" />
    </div>
  )
}
