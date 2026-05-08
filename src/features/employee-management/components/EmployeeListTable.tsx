'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, UsersThree, WarningCircle, Plus, CaretLeft, CaretRight, UploadSimple, DownloadSimple, CaretDown, SpinnerGap } from '@phosphor-icons/react'
import { StatusBadge } from './StatusBadge'
import { SkeletonRows } from './SkeletonRows'
import { ImportDialog } from '@/features/employee-import-export/components/ImportDialog'
import { getEmployeeListAction } from '@/features/employee-management/actions/employee.actions'
import type { EmployeeListItem, EmployeeStatus } from '@/features/employee-management/types/employee.types'

type StatusFilter = 'ALL' | EmployeeStatus

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All employees' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'RESIGNED', label: 'Resigned' },
]

const PAGE_SIZE = 10

export function EmployeeListTable() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fetchEmployees = useCallback(
    async (opts: { page: number; search: string; status: StatusFilter }) => {
      setLoadState('loading')
      const result = await getEmployeeListAction({
        page: opts.page,
        limit: PAGE_SIZE,
        search: opts.search || undefined,
        status: opts.status === 'ALL' ? undefined : opts.status,
      })
      if (result.ok) {
        setEmployees(result.data.employees)
        setTotalCount(result.data.totalCount)
        setLoadState('loaded')
      } else {
        setLoadState('error')
      }
    },
    []
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchEmployees({ page: 1, search, status })
        setPage(1)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, status, fetchEmployees])

  // Page change (immediate)
  useEffect(() => {
    startTransition(() => {
      fetchEmployees({ page, search, status })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/employees/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="(.+)"/)
      a.download = match?.[1] ?? 'employee-master.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showing = employees.length > 0
    ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount}`
    : ''

  return (
    <>
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
          Team Directory
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 disabled:opacity-60"
          >
            {isExporting ? (
              <SpinnerGap size={15} className="animate-spin" />
            ) : (
              <DownloadSimple size={15} />
            )}
            Export
          </button>

          {/* Import dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowImportMenu((v) => !v)}
              onBlur={() => setTimeout(() => setShowImportMenu(false), 150)}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors duration-200"
            >
              <UploadSimple size={15} />
              Import
              <CaretDown size={13} className="text-zinc-400" />
            </button>
            {showImportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-zinc-200/60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] py-1 z-20">
                <button
                  onClick={() => { setShowImportMenu(false); setShowImportDialog(true) }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <UploadSimple size={15} className="text-zinc-400" />
                  Import from Excel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/employees/new')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-200 active:scale-[0.98]"
          >
            <Plus size={16} weight="bold" />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            id="employee-search"
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-zinc-50 border border-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200"
          />
        </div>

        {/* Status filter */}
        <select
          id="employee-status-filter"
          value={status}
          onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1) }}
          className="w-[180px] px-3 py-2 text-sm rounded-xl border border-zinc-200/60 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 transition-colors duration-200"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Designation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Site
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {loadState === 'loading' || isPending ? (
              <SkeletonRows count={PAGE_SIZE} />
            ) : loadState === 'error' ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <WarningCircle size={40} className="text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-600">Failed to load employees</p>
                    <button
                      onClick={() => fetchEmployees({ page, search, status })}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <UsersThree size={48} className="text-zinc-200" />
                    <p className="text-lg font-medium text-zinc-600">No team members yet</p>
                    <p className="text-sm text-zinc-400">Add your first employee to get started</p>
                    <button
                      onClick={() => router.push('/employees/new')}
                      className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-200"
                    >
                      <Plus size={15} weight="bold" />
                      Add Employee
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="cursor-pointer hover:bg-zinc-50/80 transition-colors duration-200"
                  style={{
                    opacity: 0,
                    animation: `fadeSlideIn 0.3s ease forwards`,
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500">{emp.employeeId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-900">{emp.employeeName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-600">{emp.designation}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-600">{emp.site ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={emp.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {loadState === 'loaded' && totalCount > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-zinc-500">{showing}</p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <CaretLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                    p === page
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Keyframe ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>

    {/* ── Import dialog ─────────────────────────────────────────────────── */}
    {showImportDialog && (
      <ImportDialog onClose={() => setShowImportDialog(false)} />
    )}
    </>
  )
}
