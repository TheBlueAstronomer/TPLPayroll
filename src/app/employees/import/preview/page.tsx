import { AppShell } from '@/components/layout/AppShell'
import { ImportPreviewClient } from '@/features/employee-import-export/components/ImportPreviewClient'

export const metadata = {
  title: 'Import Preview — TPL Payroll',
}

export default function ImportPreviewPage() {
  return (
    <AppShell>
      <ImportPreviewClient />
    </AppShell>
  )
}
