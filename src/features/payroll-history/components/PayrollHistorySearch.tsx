'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'

export function PayrollHistorySearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [query, setQuery] = useState(initialSearch)

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set('search', query)
      } else {
        params.delete('search')
      }
      
      const newUrl = `/history?${params.toString()}`
      if (newUrl !== `/history?${searchParams.toString()}`) {
        router.push(newUrl)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, router, searchParams])

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MagnifyingGlass size={16} className="text-zinc-400" />
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 text-sm text-zinc-900 bg-zinc-50 border border-zinc-200/60 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
        placeholder="Search by employee name or ID..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}
