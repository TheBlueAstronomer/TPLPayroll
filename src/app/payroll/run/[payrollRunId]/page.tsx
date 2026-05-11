import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr'
import prisma from '@/lib/prisma'
import { ReportSection } from '@/features/payroll-reports/components/ReportSection'

interface Props {
  params: Promise<{ payrollRunId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { payrollRunId } = await params
  return { title: `Payroll Run — ${payrollRunId} — TPL Payroll` }
}

function formatWeekRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function PayrollRunPage({ params }: Props) {
  const { payrollRunId } = await params

  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      runEmployees: {
        include: {
          employee: {
            select: {
              employeeId: true,
              employeeName: true,
              designation: true,
              site: true,
              gPay: true,
              bankAccount: true,
            },
          },
        },
        orderBy: { employee: { employeeId: 'asc' } },
      },
    },
  })

  if (!run || run.status !== 'APPROVED') notFound()

  const weekLabel = formatWeekRange(run.payrollWeekStartDate, run.payrollWeekEndDate)
  const employeeCount = run.runEmployees.length

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-2">
        <CheckCircle size={28} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Payroll — {weekLabel}
          </h1>
          <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Approved
          </span>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="mt-6 flex gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Employees</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-900">
            {employeeCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Net Payable</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-900">
            ₹{formatCurrency(Number(run.totalNetPayable))}
          </p>
        </div>
      </div>

      {/* ── Reports section ─────────────────────────────────────────── */}
      <div className="mt-8">
        <ReportSection payrollRunId={payrollRunId} employeeCount={employeeCount} />
      </div>

      {/* ── Payroll Summary table ────────────────────────────────────── */}
      <section className="border-t border-zinc-200/60 pt-8 mt-8">
        <p className="text-sm font-medium text-zinc-900 mb-4">Payroll Summary</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-zinc-200">
                {['ID', 'Employee', 'Desig.', 'Site', 'Reg Hrs', 'OT Hrs', 'Reg Pay', 'OT Pay', 'Add.', 'Ded.', 'Net Pay'].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 last:text-right"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {run.runEmployees.map((re) => (
                <tr key={re.id} className="hover:bg-zinc-50/50">
                  <td className="py-2 pr-4 text-zinc-700">{re.employee.employeeId}</td>
                  <td className="py-2 pr-4 font-sans text-zinc-900">{re.employee.employeeName}</td>
                  <td className="py-2 pr-4 font-sans text-zinc-600">{re.employee.designation}</td>
                  <td className="py-2 pr-4 font-sans text-zinc-500">{re.employee.site ?? '—'}</td>
                  <td className="py-2 pr-4 text-right text-zinc-700">{Number(re.regularHours).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-zinc-700">{Number(re.overtimeHours).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-zinc-700">₹{formatCurrency(Number(re.regularPay))}</td>
                  <td className="py-2 pr-4 text-right text-zinc-700">₹{formatCurrency(Number(re.overtimePay))}</td>
                  <td className="py-2 pr-4 text-right text-emerald-700">+₹{formatCurrency(Number(re.additions))}</td>
                  <td className="py-2 pr-4 text-right text-rose-700">-₹{formatCurrency(Number(re.deductions))}</td>
                  <td className="py-2 text-right font-semibold text-zinc-900">₹{formatCurrency(Number(re.netPayable))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200">
                <td colSpan={4} className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Totals
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-zinc-900">
                  {run.runEmployees.reduce((s, r) => s + Number(r.regularHours), 0).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-zinc-900">
                  {run.runEmployees.reduce((s, r) => s + Number(r.overtimeHours), 0).toFixed(2)}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-zinc-900">
                  ₹{formatCurrency(Number(run.totalRegularPay))}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-zinc-900">
                  ₹{formatCurrency(Number(run.totalOvertimePay))}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-emerald-700">
                  +₹{formatCurrency(Number(run.totalAdditions))}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-rose-700">
                  -₹{formatCurrency(Number(run.totalDeductions))}
                </td>
                <td className="py-2 text-right font-bold text-zinc-900">
                  ₹{formatCurrency(Number(run.totalNetPayable))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ── Back link ────────────────────────────────────────────────── */}
      <div className="mt-8">
        <Link
          href="/payroll"
          className="text-sm text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline"
        >
          ← Back to Payroll
        </Link>
      </div>
    </main>
  )
}
