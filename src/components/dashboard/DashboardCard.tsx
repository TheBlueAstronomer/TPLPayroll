import Link from 'next/link'
import type { ReactNode } from 'react'

interface DashboardCardProps {
  label: string
  value: string
  icon: ReactNode
  href: string
  /** Position index used to stagger mount animation */
  index: number
  /** Optional: additional className for the card container */
  className?: string
}

/**
 * DashboardCard — an asymmetric metric card that links to a workflow.
 *
 * Design tokens (Geist + Geist Mono, Zinc/Emerald, VARIANCE 8, MOTION 6):
 *  - Card surface: white, 2xl radius, zinc-200/60 border, diffusion shadow
 *  - Hover: shadow-md, border-zinc-300, cubic-bezier ease
 *  - Press: scale-[0.98]
 *  - Mount: stagger via CSS --index custom property
 */
export function DashboardCard({
  label,
  value,
  href,
  icon,
  index,
  className = '',
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className={[
        'group relative flex flex-col gap-6 p-6 md:p-8',
        'bg-white rounded-2xl border border-zinc-200/60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        'hover:shadow-md hover:border-zinc-300',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'active:scale-[0.98]',
        'card-reveal',
        className,
      ].join(' ')}
      style={{ '--index': index } as React.CSSProperties}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span className="text-zinc-400 group-hover:text-zinc-600 transition-colors duration-200">
          {icon}
        </span>
      </div>

      {/* Metric value */}
      <span className="text-4xl md:text-5xl font-mono tabular-nums font-semibold text-zinc-900 leading-none">
        {value}
      </span>
    </Link>
  )
}
