import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

interface AppShellProps {
  children: ReactNode
}

/**
 * AppShell — the outer application frame.
 *
 * Desktop: fixed 240px sidebar + scrollable main content area.
 * Mobile: sticky top bar with hamburger, full-width content.
 *
 * This is a Server Component — Sidebar and MobileNav are Client Components
 * only at their own boundaries.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <MobileNav />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-10 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
