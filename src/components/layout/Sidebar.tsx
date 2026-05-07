'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  Users,
  CalendarCheck,
  CurrencyInr,
  Scales,
  ClockCounterClockwise,
  GearSix,
  ListChecks,
} from '@phosphor-icons/react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <House size={20} weight="regular" /> },
  { label: 'Employees', href: '/employees', icon: <Users size={20} weight="regular" /> },
  { label: 'Attendance', href: '/attendance', icon: <CalendarCheck size={20} weight="regular" /> },
  { label: 'Payroll', href: '/payroll', icon: <CurrencyInr size={20} weight="regular" /> },
  { label: 'Adjustments', href: '/adjustments', icon: <Scales size={20} weight="regular" /> },
  { label: 'History', href: '/history', icon: <ClockCounterClockwise size={20} weight="regular" /> },
  { label: 'Settings', href: '/settings', icon: <GearSix size={20} weight="regular" /> },
  { label: 'Audit Log', href: '/audit-log', icon: <ListChecks size={20} weight="regular" /> },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 border-r border-zinc-200/60 bg-white px-3 py-6 gap-6">
      {/* Brand */}
      <div className="px-3">
        <span className="text-sm font-semibold tracking-tight text-zinc-900">
          TPL Payroll
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'text-emerald-600 bg-emerald-50/50'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50',
              ].join(' ')}
            >
              <span className={isActive ? 'text-emerald-500' : 'text-zinc-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
