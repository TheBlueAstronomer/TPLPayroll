'use client'

import { Circle } from '@phosphor-icons/react'
import type { EmployeeStatus } from '@/features/employee-management/types/employee.types'

interface StatusBadgeProps {
  status: EmployeeStatus
  size?: 'sm' | 'md'
}

const config: Record<EmployeeStatus, { dot: string; text: string; bg: string }> = {
  ACTIVE: {
    dot: 'text-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  INACTIVE: {
    dot: 'text-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-100',
  },
  RESIGNED: {
    dot: 'text-rose-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
  },
}

const label: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned',
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const c = config[status]
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${c.bg} ${textSize} font-medium ${c.text}`}
    >
      <Circle weight="fill" size={size === 'sm' ? 7 : 9} className={c.dot} />
      {label[status]}
    </span>
  )
}
