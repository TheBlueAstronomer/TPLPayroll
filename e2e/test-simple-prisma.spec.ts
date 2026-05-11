import { test, expect } from '@playwright/test';
import prisma from './utils/db';

test('simple prisma create', async () => {
  console.log('STARTING SIMPLE TEST');
  const emp = await (prisma as any).employee.create({
    data: {
      employeeId: 'TEST-001',
      employeeName: 'Test User',
      isActive: true,
    }
  });
  console.log('CREATED EMP:', emp.id);
  expect(emp.id).toBeDefined();
});
