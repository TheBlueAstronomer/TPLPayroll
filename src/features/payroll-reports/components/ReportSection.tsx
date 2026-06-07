'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, Package, DownloadSimple, CircleNotch, CaretDown } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [showDropdown, setShowDropdown] = useState(false)

  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const slipsAnchorRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function callCleanup() {
    try {
      await fetch(`/api/payroll/reports/${payrollRunId}/cleanup`, { method: 'POST' })
    } catch {
      // best-effort — don't surface cleanup failures to the user
    }
  }

  async function triggerSummaryDownload(format: 'pdf' | 'xlsx') {
    if (summaryLoading) return
    setSummaryLoading(true)

    const a = document.createElement('a')
    a.href = `/api/payroll/reports/${payrollRunId}/summary?format=${format}`
    a.download = ''
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(async () => {
      setSummaryLoading(false)
      setToast({
        message: format === 'pdf' ? 'PDF summary downloaded' : 'Excel summary downloaded',
        type: 'success'
      })
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
      {/* Hidden download anchor for slips */}
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
        
        {/* Split Button with Dropdown */}
        <div ref={dropdownContainerRef} className="relative inline-flex items-center shrink-0">
          <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden transition-colors duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
            <button
              type="button"
              onClick={() => triggerSummaryDownload('xlsx')}
              disabled={summaryLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-colors border-r border-zinc-100 cursor-pointer"
            >
              {summaryLoading ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <DownloadSimple size={14} />
              )}
              Download Summary
            </button>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              disabled={summaryLoading}
              className="inline-flex items-center px-2 py-2 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
              aria-label="Select summary report format"
            >
              <CaretDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white border border-zinc-200/60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] py-1.5 z-20 origin-top-right"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false)
                    triggerSummaryDownload('xlsx')
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <FileText size={16} className="text-zinc-400 shrink-0" />
                  <span>Download as Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false)
                    triggerSummaryDownload('pdf')
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <FileText size={16} className="text-zinc-400 shrink-0" />
                  <span>Download as PDF (.pdf)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
