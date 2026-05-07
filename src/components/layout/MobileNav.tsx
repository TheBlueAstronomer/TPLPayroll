'use client'

import { useState } from 'react'
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
  List,
  X,
} from '@phosphor-icons/react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: <House size={20} weight="regular" /> },
  { label: 'Employees', href: '/employees', icon: <Users size={20} weight="regular" /> },
  { label: 'Attendance', href: '/attendance', icon: <CalendarCheck size={20} weight="regular" /> },
  { label: 'Payroll', href: '/payroll', icon: <CurrencyInr size={20} weight="regular" /> },
  { label: 'Adjustments', href: '/adjustments', icon: <Scales size={20} weight="regular" /> },
  { label: 'History', href: '/history', icon: <ClockCounterClockwise size={20} weight="regular" /> },
  { label: 'Settings', href: '/settings', icon: <GearSix size={20} weight="regular" /> },
  { label: 'Audit Log', href: '/audit-log', icon: <ListChecks size={20} weight="regular" /> },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-zinc-200/60 bg-white sticky top-0 z-40">
        <span className="text-sm font-semibold tracking-tight text-zinc-900">TPL Payroll</span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          aria-label="Open navigation menu"
        >
          <List size={20} weight="regular" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet drawer */}
      <div
        className={[
          'lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white z-50',
          'flex flex-col px-3 py-6 gap-6',
          'border-r border-zinc-200/60',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">TPL Payroll</span>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} weight="regular" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
      </div>
    </>
  )
}
