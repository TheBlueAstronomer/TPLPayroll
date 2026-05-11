import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function cleanupDatabase() {
  try {
    await prisma.$connect();
    
    // Use a raw query to truncate all relevant tables at once
    // This is faster and uses fewer connections/commands
    const tables = [
      '"AuditLog"',
      '"InvoiceSnapshot"',
      '"PayrollRunEmployee"',
      '"PayrollRevision"',
      '"PayrollAdjustmentApplication"',
      '"PayrollAdjustment"',
      '"PayrollRun"',
      '"AttendanceRecord"',
      '"AttendanceUpload"',
      '"EmployeeWageHistory"',
      '"EmployeeDocument"',
      '"Employee"',
      '"EmployeeImportBatch"',
    ];
    
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`);
  } catch (err) {
    console.error('Cleanup failed:', err);
    // Don't throw here, just log, so seeding can attempt to proceed if cleanup was partial
  }
}

export async function seedAdjustmentTestData() {
  try {
    await prisma.$connect();

    // Create a test employee for adjustment flows
    const employee = await prisma.employee.create({
      data: {
        employeeId: 'EMP-ADJ-001',
        employeeName: 'Adjustment Test Employee',
        designation: 'Worker',
        isActive: true,
        wageHistory: {
          create: {
            weeklySalary: 6000,
            hourlyRate: 120,
            effectiveFrom: new Date('2025-01-01'),
            changeSource: 'SEED',
          },
        },
      },
    });

    // Create 3 test adjustments (2 active, 1 completed)
    const week1Start = new Date('2025-03-06');
    const week1End = new Date('2025-03-12');
    const week2Start = new Date('2025-03-13');
    const week2End = new Date('2025-03-19');

    // Adjustment 1: ONE_TIME DEDUCTION (active, pending)
    const adj1 = await prisma.payrollAdjustment.create({
      data: {
        employeeId: employee.id,
        adjustmentType: 'DEDUCTION',
        recurrenceType: 'ONE_TIME',
        amount: 500,
        reason: 'Advance recovery seed',
        startPayrollWeekStartDate: week1Start,
        startPayrollWeekEndDate: week1End,
        status: 'ACTIVE',
        skippedCarryForwardCount: 0,
      },
    });
    await prisma.payrollAdjustmentApplication.create({
      data: {
        payrollAdjustmentId: adj1.id,
        employeeId: employee.id,
        payrollWeekStartDate: week1Start,
        payrollWeekEndDate: week1End,
        appliedAmount: 500,
        approvalStatus: 'PENDING',
      },
    });

    // Adjustment 2: RECURRING ADDITION (active)
    const adj2 = await prisma.payrollAdjustment.create({
      data: {
        employeeId: employee.id,
        adjustmentType: 'ADDITION',
        recurrenceType: 'RECURRING',
        amount: 1000,
        reason: 'Transport allowance seed',
        startPayrollWeekStartDate: week1Start,
        startPayrollWeekEndDate: week1End,
        recurrenceEndType: 'FIXED_WEEKS',
        totalRecurrenceWeeks: 4,
        status: 'ACTIVE',
        skippedCarryForwardCount: 0,
      },
    });
    await prisma.payrollAdjustmentApplication.create({
      data: {
        payrollAdjustmentId: adj2.id,
        employeeId: employee.id,
        payrollWeekStartDate: week1Start,
        payrollWeekEndDate: week1End,
        appliedAmount: 1000,
        approvalStatus: 'APPROVED',
        appliedAt: new Date('2025-03-12'),
      },
    });

    // Adjustment 3: RECURRING DEDUCTION with total balance (completed)
    const adj3 = await prisma.payrollAdjustment.create({
      data: {
        employeeId: employee.id,
        adjustmentType: 'DEDUCTION',
        recurrenceType: 'RECURRING',
        amount: 2000,
        reason: 'Loan recovery seed',
        startPayrollWeekStartDate: week2Start,
        startPayrollWeekEndDate: week2End,
        recurrenceEndType: 'TOTAL_BALANCE',
        totalBalance: 2000,
        remainingBalance: 0,
        status: 'COMPLETED',
        skippedCarryForwardCount: 0,
      },
    });
    await prisma.payrollAdjustmentApplication.create({
      data: {
        payrollAdjustmentId: adj3.id,
        employeeId: employee.id,
        payrollWeekStartDate: week2Start,
        payrollWeekEndDate: week2End,
        appliedAmount: 2000,
        approvalStatus: 'APPROVED',
        appliedAt: new Date('2025-03-19'),
      },
    });
  } catch (err) {
    console.error('Adjustment seed failed:', err);
    throw err;
  }
}

// ─── seedPayrollTestData ──────────────────────────────────────────────────────
// Seeds a minimal but complete scenario for F06 E2E tests:
//   - 3 employees with wage history
//   - 1 READY AttendanceUpload for March 6-12 with daily records
//   - 1 ERRORS AttendanceUpload for March 13-19 (blocked)
//   - 1 pending adjustment application for March 6-12

export async function seedPayrollTestData() {
  try {
    await prisma.$connect();

    const weekStart = new Date('2025-03-06T00:00:00.000Z');
    const weekEnd   = new Date('2025-03-12T00:00:00.000Z');
    const errWeekStart = new Date('2025-03-13T00:00:00.000Z');
    const errWeekEnd   = new Date('2025-03-19T00:00:00.000Z');

    // ── Employees ──────────────────────────────────────────────────────────
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          employeeId: 'EMP-PRY-001',
          employeeName: 'Kavitha Rajan',
          designation: 'Security Guard',
          designationShort: 'Guard',
          site: 'North Gate',
          gPay: '9876543210',
          bankAccount: '012345678901',
          isActive: true,
          wageHistory: {
            create: {
              weeklySalary: 2500,
              hourlyRate: 62.5,
              effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
              changeSource: 'SEED',
            },
          },
        },
      }),
      prisma.employee.create({
        data: {
          employeeId: 'EMP-PRY-002',
          employeeName: 'Ramesh Nair',
          designation: 'Supervisor',
          designationShort: 'Supv.',
          site: 'South Gate',
          gPay: '9123456780',
          bankAccount: '098765432109',
          isActive: true,
          wageHistory: {
            create: {
              weeklySalary: 3000,
              hourlyRate: 75.0,
              effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
              changeSource: 'SEED',
            },
          },
        },
      }),
      prisma.employee.create({
        data: {
          employeeId: 'EMP-PRY-003',
          employeeName: 'Sunita Pillai',
          designation: 'Security Guard',
          designationShort: 'Guard',
          site: 'East Gate',
          gPay: null,
          bankAccount: null,
          isActive: true,
          wageHistory: {
            create: {
              weeklySalary: 2500,
              hourlyRate: 62.5,
              effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
              changeSource: 'SEED',
            },
          },
        },
      }),
    ]);

    // ── READY upload for March 6-12 ────────────────────────────────────────
    const readyUpload = await prisma.attendanceUpload.create({
      data: {
        fileName: 'attendance-march-wk1.xlsx',
        fileType: 'xlsx',
        payrollWeekStartDate: weekStart,
        payrollWeekEndDate: weekEnd,
        payrollWeekSource: 'SHEET_CONTENT',
        status: 'READY',
        isActiveForPayrollWeek: true,
        sourceFilePath: '/tmp/attendance-march-wk1.xlsx',
      },
    });

    // Daily records for each employee (Thu–Wed = 7 days)
    // Employee 1: reg=[8,8,6,0,8,8,8], OT=[2,0,0,0,3,1,0] → reg=46, OT=6
    // Employee 2: reg=[8,8,8,8,8,8,8], OT=[0,0,0,0,0,0,0] → reg=56, OT=0
    // Employee 3: reg=[8,8,8,0,8,8,8], OT=[0,0,0,0,0,0,0] → reg=48, OT=0
    const attendanceDays = [
      [{ reg: 8, ot: 2 }, { reg: 8, ot: 0 }, { reg: 6, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 3 }, { reg: 8, ot: 1 }, { reg: 8, ot: 0 }],
      [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
      [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
    ];

    for (let empIdx = 0; empIdx < employees.length; empIdx++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setUTCDate(date.getUTCDate() + day);
        await prisma.attendanceRecord.create({
          data: {
            attendanceUploadId: readyUpload.id,
            employeeId: employees[empIdx].id,
            attendanceDate: date,
            regularHours: attendanceDays[empIdx][day].reg,
            overtimeHours: attendanceDays[empIdx][day].ot,
            sourceSheetName: 'Attendance',
            sourceEmployeeBlockIndex: empIdx,
          },
        });
      }
    }

    // ── Pending adjustment for Employee 1 in week 1 ───────────────────────
    const adj = await prisma.payrollAdjustment.create({
      data: {
        employeeId: employees[0].id,
        adjustmentType: 'DEDUCTION',
        recurrenceType: 'ONE_TIME',
        amount: 500,
        reason: 'Advance recovery',
        startPayrollWeekStartDate: weekStart,
        startPayrollWeekEndDate: weekEnd,
        status: 'ACTIVE',
        skippedCarryForwardCount: 0,
      },
    });
    await prisma.payrollAdjustmentApplication.create({
      data: {
        payrollAdjustmentId: adj.id,
        employeeId: employees[0].id,
        payrollWeekStartDate: weekStart,
        payrollWeekEndDate: weekEnd,
        appliedAmount: 500,
        approvalStatus: 'PENDING',
      },
    });

    // ── ERRORS upload for March 13-19 ─────────────────────────────────────
    await prisma.attendanceUpload.create({
      data: {
        fileName: 'attendance-march-wk2.xlsx',
        fileType: 'xlsx',
        payrollWeekStartDate: errWeekStart,
        payrollWeekEndDate: errWeekEnd,
        payrollWeekSource: 'SHEET_CONTENT',
        status: 'ERRORS',
        isActiveForPayrollWeek: true,
        sourceFilePath: '/tmp/attendance-march-wk2.xlsx',
      },
    });

    return { employees, readyUpload };
  } catch (err) {
    console.error('Payroll seed failed:', err);
    throw err;
  }
}

export async function seedTestData() {
  try {
    // We use a transaction for seeding to ensure atomicity
    await prisma.$transaction([
      prisma.employee.create({
        data: {
          employeeId: 'EMP001',
          employeeName: 'Matched Employee',
          designation: 'Worker',
          isActive: true,
          wageHistory: {
            create: {
              weeklySalary: 5000,
              hourlyRate: 100,
              effectiveFrom: new Date('2025-01-01'),
              changeSource: 'SEED',
            },
          },
        },
      }),
      prisma.employee.create({
        data: {
          employeeId: 'EMP002',
          employeeName: 'Inactive Employee',
          designation: 'Worker',
          isActive: false,
          wageHistory: {
            create: {
              weeklySalary: 5000,
              hourlyRate: 100,
              effectiveFrom: new Date('2025-01-01'),
              changeSource: 'SEED',
            },
          },
        },
      }),
      prisma.employee.create({
        data: {
          employeeId: 'EMP003',
          employeeName: 'Resigned Employee',
          designation: 'Worker',
          isActive: true,
          dateOfResignation: new Date('2025-03-01'),
          wageHistory: {
            create: {
              weeklySalary: 5000,
              hourlyRate: 100,
              effectiveFrom: new Date('2025-01-01'),
              changeSource: 'SEED',
            },
          },
        },
      }),
    ]);
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  }
}
