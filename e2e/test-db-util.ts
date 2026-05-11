import { seedApprovedPayrollData, cleanupDatabase } from './utils/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    console.log('Cleaning up...');
    await cleanupDatabase();
    console.log('Seeding...');
    const result = await seedApprovedPayrollData();
    console.log('Seed successful, payrollRunId:', result.payrollRunId);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

main();
