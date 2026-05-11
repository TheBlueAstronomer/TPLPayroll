'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, Package, DownloadSimple, CircleNotch } from '@phosphor-icons/react'

interface ReportSectionProps {
  payrollRunId: string
  employeeCount: number
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function ReportSection({ payrollRunId, employeeCount }: ReportSectionProps) {
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [slipsLoading, setSlipsLoading] = useState(false)
  const [slipsProgress, setSlipsProgress] = useState(0)
  const [slipsStage, setSlipsStage] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  const summaryAnchorRef = useRef<HTMLAnchorElement>(null)
  const slipsAnchorRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function callCleanup() {
    try {
      await fetch(`/api/payroll/reports/${payrollRunId}/cleanup`, { method: 'POST' })
    } catch {
      // best-effort — don't surface cleanup failures to the user
    }
  }

  function handleSummaryDownload() {
    if (summaryLoading) return
    setSummaryLoading(true)
    summaryAnchorRef.current?.click()
    setTimeout(async () => {
      setSummaryLoading(false)
      setToast({ message: 'PDF downloaded', type: 'success' })
      await callCleanup()
    }, 1500)
  }

  function handleSlipsDownload() {
    if (slipsLoading) return
    setSlipsLoading(true)
    setSlipsProgress(0)
    setSlipsStage('Generating slips...')

    setTimeout(() => {
      setSlipsProgress(30)
      setSlipsStage('Generating slips...')
    }, 500)

    setTimeout(() => {
      setSlipsProgress(60)
      setSlipsStage('Packaging ZIP...')
    }, 1700)

    setTimeout(() => {
      setSlipsProgress(90)
      setSlipsStage('Finalizing...')
    }, 3700)

    setTimeout(async () => {
      slipsAnchorRef.current?.click()
      setSlipsProgress(100)
      setSlipsStage('')
      setTimeout(async () => {
        setSlipsLoading(false)
        setSlipsProgress(0)
        setToast({ message: 'Slips downloaded', type: 'success' })
        await callCleanup()
      }, 500)
    }, 5700)
  }

  return (
    <section className="border-t border-zinc-200/60 pt-8">
      {/* Hidden download anchors */}
      <a
        ref={summaryAnchorRef}
        href={`/api/payroll/reports/${payrollRunId}/summary`}
        download
        className="hidden"
      />
      <a
        ref={slipsAnchorRef}
        href={`/api/payroll/reports/${payrollRunId}/slips`}
        download
        className="hidden"
      />

      <p className="text-sm font-medium text-zinc-900 mb-6">Reports</p>

      {/* ── Payroll Summary Report row ─────────────────────────────────── */}
      <div className="flex items-start gap-4 py-4 border-b border-zinc-100">
        <FileText size={24} className="text-zinc-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">Payroll Summary Report</p>
          <p className="text-sm text-zinc-500">
            A tabular summary of all employees&apos; payroll for this week.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSummaryDownload}
          disabled={summaryLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
        >
          {summaryLoading ? (
            <CircleNotch size={14} className="animate-spin" />
          ) : (
            <DownloadSimple size={14} />
          )}
          Download PDF Summary
        </button>
      </div>

      {/* ── Employee Payroll Slips row ─────────────────────────────────── */}
      <div className="flex items-start gap-4 py-4">
        <Package size={24} className="text-zinc-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">Employee Payroll Slips</p>
          <p className="text-sm text-zinc-500">
            Individual payroll slips for all {employeeCount} employees.
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleSlipsDownload}
            disabled={slipsLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {slipsLoading ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <DownloadSimple size={14} />
            )}
            Generate &amp; Download ZIP
          </button>

          {slipsLoading && (
            <div className="mt-2 w-full">
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${slipsProgress}%` }}
                />
              </div>
              {slipsStage && (
                <p className="mt-1 text-xs text-zinc-400">{slipsStage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </section>
  )
}
