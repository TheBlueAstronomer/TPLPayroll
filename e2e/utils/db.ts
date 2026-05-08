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
