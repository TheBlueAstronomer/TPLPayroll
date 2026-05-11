'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { MatchedAttendanceRecord, VerificationDecision } from '@/features/attendance-upload/types/attendance.types'

interface EmployeeVerificationDialogProps {
  isOpen: boolean
  employees: MatchedAttendanceRecord[]
  onConfirm: (decisions: Record<string, VerificationDecision>) => void
  onCancel: () => void
}

export function EmployeeVerificationDialog({
  isOpen,
  employees,
  onConfirm,
  onCancel,
}: EmployeeVerificationDialogProps) {
  const [decisions, setDecisions] = useState<Record<string, VerificationDecision>>({})

  const handleDecision = (employeeDbId: string, decision: VerificationDecision) => {
    setDecisions((prev) => ({
      ...prev,
      [employeeDbId]: decision,
    }))
  }

  const allDecided = employees.every((e) => e.employeeDbId && decisions[e.employeeDbId])

  const handleConfirm = () => {
    if (allDecided) {
      onConfirm(decisions)
    }
  }

  const getReasonText = (record: MatchedAttendanceRecord): string => {
    if (record.matchStatus === 'INACTIVE') {
      return 'Inactive employee'
    }
    if (record.matchStatus === 'RESIGNED_BEFORE_WEEK') {
      return `Resigned before payroll week`
    }
    return 'Requires verification'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manual Verification Required</DialogTitle>
          <DialogDescription>
            These employees cannot be processed automatically. Review each one and choose whether to include them in payroll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {employees.map((record) => (
            <div
              key={record.employeeDbId}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{record.employeeName}</p>
                <p className="text-xs text-muted-foreground">{getReasonText(record)}</p>
                <p className="text-xs text-muted-foreground">
                  Reg: {record.totalRegularHours}h | OT: {record.totalOvertimeHours}h
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={decisions[record.employeeDbId!] === 'APPROVED' ? 'default' : 'outline'}
                  onClick={() => handleDecision(record.employeeDbId!, 'APPROVED')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant={decisions[record.employeeDbId!] === 'REJECTED' ? 'destructive' : 'outline'}
                  onClick={() => handleDecision(record.employeeDbId!, 'REJECTED')}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allDecided}>
            Confirm Selections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
