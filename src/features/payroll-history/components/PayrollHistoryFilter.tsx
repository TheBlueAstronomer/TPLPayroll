'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PayrollHistoryFilterProps {
  weeks: { weekStart: string; weekEnd: string }[]
}

export function PayrollHistoryFilter({ weeks }: PayrollHistoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWeek = searchParams.get('week') || ''

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('week', e.target.value)
    } else {
      params.delete('week')
    }
    router.push(`/history?${params.toString()}`)
  }

  const formatWeek = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="relative w-full">
      <select
        value={currentWeek}
        onChange={handleWeekChange}
        className="w-full px-4 py-2 text-sm text-zinc-900 bg-white border border-zinc-200/60 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none transition-shadow"
      >
        <option value="">All Weeks</option>
        {weeks.map(week => {
          const value = `${week.weekStart}_${week.weekEnd}`
          return (
            <option key={value} value={value}>
              {formatWeek(week.weekStart, week.weekEnd)}
            </option>
          )
        })}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  )
}
