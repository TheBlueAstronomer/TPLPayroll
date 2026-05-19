import { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AuditLogViewer } from '@/features/audit-logging/components/AuditLogViewer'

export const dynamic = 'force-dynamic'


export const metadata: Metadata = {
  title: 'Audit Log — TPL Payroll',
  description: 'View audit trail of employee data changes',
}

export default function AuditLogPage() {
  return (
    <AppShell>
      <AuditLogViewer />
    </AppShell>
  )
}
