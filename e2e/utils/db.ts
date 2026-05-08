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
