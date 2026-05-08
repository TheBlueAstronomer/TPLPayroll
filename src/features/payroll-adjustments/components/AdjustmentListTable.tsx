'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlass,
  Scales,
  Plus,
  CaretLeft,
  CaretRight,
  Circle,
  WarningCircle,
} from '@phosphor-icons/react'
import { SkeletonRows } from './SkeletonRows'
import { getAdjustmentListAction } from '@/features/payroll-adjustments/actions/adjustment.actions'
import type {
  AdjustmentListItem,
  AdjustmentType,
  AdjustmentStatus,
} from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWeek(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const s = new Date(start).toLocaleDateString('en-IN', opts)
  const e = new Date(end).toLocaleDateString('en-IN', opts)
  return `${s} – ${e}`
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AdjustmentType }) {
  if (type === 'DEDUCTION') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
        Deduction
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Addition
    </span>
  )
}

function StatusDot({ status }: { status: AdjustmentStatus }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <Circle size={8} weight="fill" className="text-emerald-500" />
        Active
      </span>
    )
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
        <Circle size={8} weight="fill" className="text-zinc-300" />
        Done
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-rose-500">
      <Circle size={8} weight="fill" className="text-rose-400" />
      Cancelled
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10

type TypeFilter = 'ALL' | AdjustmentType
type StatusFilter = 'ALL' | AdjustmentStatus

export function AdjustmentListTable() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [adjustments, setAdjustments] = useState<AdjustmentListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')

  const fetchAdjustments = useCallback(
    async (opts: { page: number; search: string; type: TypeFilter; status: StatusFilter }) => {
      setLoadState('loading')
      const result = await getAdjustmentListAction({
        page: opts.page,
        limit: PAGE_SIZE,
        search: opts.search || undefined,
        type: opts.type === 'ALL' ? undefined : opts.type,
        status: opts.status === 'ALL' ? undefined : opts.status,
      })
      if (result.ok) {
        setAdjustments(result.data.adjustments)
        setTotalCount(result.data.totalCount)
        setLoadState('loaded')
      } else {
        setLoadState('error')
      }
    },
    [],
  )

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        fetchAdjustments({ page: 1, search, type: typeFilter, status: statusFilter })
        setPage(1)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [search, typeFilter, statusFilter, fetchAdjustments])

  useEffect(() => {
    startTransition(() => {
      fetchAdjustments({ page, search, type: typeFilter, status: statusFilter })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showing =
    adjustments.length > 0
      ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount}`
      : ''

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Payroll Adjustments
        </h1>
        <button
          onClick={() => router.push('/adjustments/new')}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-700 active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          New Adjustment
        </button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/60 bg-zinc-50 py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1) }}
          className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-[160px]"
        >
          <option value="ALL">All types</option>
          <option value="DEDUCTION">Deduction</option>
          <option value="ADDITION">Addition</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
          className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-[160px]"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-zinc-100">
          <thead>
            <tr className="bg-zinc-50/50">
              {['Employee', 'Type', 'Amount', 'Recurrence', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
                >
                  {h}
                </th>
              ))}
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
                    <p className="text-sm font-medium text-zinc-600">Failed to load adjustments</p>
                    <button
                      onClick={() =>
                        fetchAdjustments({ page, search, type: typeFilter, status: statusFilter })
                      }
                      className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Scales size={48} className="text-zinc-200" />
                    <p className="text-lg font-medium text-zinc-600">No adjustments created</p>
                    <p className="text-sm text-zinc-400">Create your first payroll adjustment</p>
                    <button
                      onClick={() => router.push('/adjustments/new')}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-700"
                    >
                      <Plus size={15} weight="bold" />
                      New Adjustment
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              adjustments.map((adj, index) => (
                <tr
                  key={adj.id}
                  onClick={() => router.push(`/adjustments/${adj.id}`)}
                  className="cursor-pointer hover:bg-zinc-50/80 transition-colors duration-200"
                  style={{
                    opacity: 0,
                    animation: 'fadeSlideIn 0.3s ease forwards',
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-zinc-900">{adj.employeeName}</span>
                      <span className="font-mono text-xs text-zinc-400">{adj.employeeCode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={adj.adjustmentType} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono tabular-nums text-sm text-zinc-900">
                      ₹{formatAmount(adj.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-600">
                      {adj.recurrenceType === 'RECURRING' ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot status={adj.status} />
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
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
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
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
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
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next page"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
