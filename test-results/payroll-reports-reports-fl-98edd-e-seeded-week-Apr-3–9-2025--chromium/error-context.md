# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-reports\reports-flow.spec.ts >> E2E-04: ZIP filename pattern >> filename matches the seeded week (Apr 3–9 2025)
- Location: e2e\payroll-reports\reports-flow.spec.ts:82:7

# Error details

```
Error: Connection terminated unexpectedly
```

# Test source

```ts
  239 |     const readyUpload = await prisma.attendanceUpload.create({
  240 |       data: {
  241 |         fileName: 'attendance-march-wk1.xlsx',
  242 |         fileType: 'xlsx',
  243 |         payrollWeekStartDate: weekStart,
  244 |         payrollWeekEndDate: weekEnd,
  245 |         payrollWeekSource: 'SHEET_CONTENT',
  246 |         status: 'READY',
  247 |         isActiveForPayrollWeek: true,
  248 |         sourceFilePath: '/tmp/attendance-march-wk1.xlsx',
  249 |       },
  250 |     });
  251 | 
  252 |     // Daily records for each employee (Thu–Wed = 7 days)
  253 |     // Employee 1: reg=[8,8,6,0,8,8,8], OT=[2,0,0,0,3,1,0] → reg=46, OT=6
  254 |     // Employee 2: reg=[8,8,8,8,8,8,8], OT=[0,0,0,0,0,0,0] → reg=56, OT=0
  255 |     // Employee 3: reg=[8,8,8,0,8,8,8], OT=[0,0,0,0,0,0,0] → reg=48, OT=0
  256 |     const attendanceDays = [
  257 |       [{ reg: 8, ot: 2 }, { reg: 8, ot: 0 }, { reg: 6, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 3 }, { reg: 8, ot: 1 }, { reg: 8, ot: 0 }],
  258 |       [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
  259 |       [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
  260 |     ];
  261 | 
  262 |     for (let empIdx = 0; empIdx < employees.length; empIdx++) {
  263 |       for (let day = 0; day < 7; day++) {
  264 |         const date = new Date(weekStart);
  265 |         date.setUTCDate(date.getUTCDate() + day);
  266 |         await prisma.attendanceRecord.create({
  267 |           data: {
  268 |             attendanceUploadId: readyUpload.id,
  269 |             employeeId: employees[empIdx].id,
  270 |             attendanceDate: date,
  271 |             regularHours: attendanceDays[empIdx][day].reg,
  272 |             overtimeHours: attendanceDays[empIdx][day].ot,
  273 |             sourceSheetName: 'Attendance',
  274 |             sourceEmployeeBlockIndex: empIdx,
  275 |           },
  276 |         });
  277 |       }
  278 |     }
  279 | 
  280 |     // ── Pending adjustment for Employee 1 in week 1 ───────────────────────
  281 |     const adj = await prisma.payrollAdjustment.create({
  282 |       data: {
  283 |         employeeId: employees[0].id,
  284 |         adjustmentType: 'DEDUCTION',
  285 |         recurrenceType: 'ONE_TIME',
  286 |         amount: 500,
  287 |         reason: 'Advance recovery',
  288 |         startPayrollWeekStartDate: weekStart,
  289 |         startPayrollWeekEndDate: weekEnd,
  290 |         status: 'ACTIVE',
  291 |         skippedCarryForwardCount: 0,
  292 |       },
  293 |     });
  294 |     await prisma.payrollAdjustmentApplication.create({
  295 |       data: {
  296 |         payrollAdjustmentId: adj.id,
  297 |         employeeId: employees[0].id,
  298 |         payrollWeekStartDate: weekStart,
  299 |         payrollWeekEndDate: weekEnd,
  300 |         appliedAmount: 500,
  301 |         approvalStatus: 'PENDING',
  302 |       },
  303 |     });
  304 | 
  305 |     // ── ERRORS upload for March 13-19 ─────────────────────────────────────
  306 |     await prisma.attendanceUpload.create({
  307 |       data: {
  308 |         fileName: 'attendance-march-wk2.xlsx',
  309 |         fileType: 'xlsx',
  310 |         payrollWeekStartDate: errWeekStart,
  311 |         payrollWeekEndDate: errWeekEnd,
  312 |         payrollWeekSource: 'SHEET_CONTENT',
  313 |         status: 'ERRORS',
  314 |         isActiveForPayrollWeek: true,
  315 |         sourceFilePath: '/tmp/attendance-march-wk2.xlsx',
  316 |       },
  317 |     });
  318 | 
  319 |     return { employees, readyUpload };
  320 |   } catch (err) {
  321 |     console.error('Payroll seed failed:', err);
  322 |     throw err;
  323 |   }
  324 | }
  325 | 
  326 | // ─── seedApprovedPayrollData ──────────────────────────────────────────────────
  327 | // Seeds a complete approved payroll scenario for F07 E2E tests:
  328 | //   - 2 employees with wage history and attendance records
  329 | //   - 1 APPROVED PayrollRun + PayrollRevision + PayrollRunEmployee records
  330 | //   - Attendance records for 7 days (for daily slip breakdown)
  331 | 
  332 | export async function seedApprovedPayrollData(): Promise<{ payrollRunId: string }> {
  333 |   await prisma.$connect();
  334 | 
  335 |   const weekStart = new Date('2025-04-03T00:00:00.000Z');
  336 |   const weekEnd   = new Date('2025-04-09T00:00:00.000Z');
  337 |   const approvedAt = new Date('2025-04-10T08:00:00.000Z');
  338 | 
> 339 |   const emp1 = await prisma.employee.create({
      |                ^ Error: Connection terminated unexpectedly
  340 |     data: {
  341 |       employeeId: 'EMP-RPT-001',
  342 |       employeeName: 'Meera Krishnan',
  343 |       designation: 'Security Guard',
  344 |       designationShort: 'Guard',
  345 |       site: 'Main Gate',
  346 |       gPay: '9988776655',
  347 |       bankAccount: '123456789012',
  348 |       isActive: true,
  349 |       wageHistory: {
  350 |         create: {
  351 |           weeklySalary: 2500,
  352 |           hourlyRate: 62.5,
  353 |           effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
  354 |           changeSource: 'SEED',
  355 |         },
  356 |       },
  357 |     },
  358 |   });
  359 | 
  360 |   const emp2 = await prisma.employee.create({
  361 |     data: {
  362 |       employeeId: 'EMP-RPT-002',
  363 |       employeeName: 'Vijay Kumar',
  364 |       designation: 'Supervisor',
  365 |       designationShort: 'Supv.',
  366 |       site: 'Back Gate',
  367 |       gPay: '9876543212',
  368 |       bankAccount: '987654321098',
  369 |       isActive: true,
  370 |       wageHistory: {
  371 |         create: {
  372 |           weeklySalary: 3000,
  373 |           hourlyRate: 75.0,
  374 |           effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
  375 |           changeSource: 'SEED',
  376 |         },
  377 |       },
  378 |     },
  379 |   });
  380 | 
  381 |   // Attendance upload (READY) so the slip builder can find daily breakdowns
  382 |   const upload = await prisma.attendanceUpload.create({
  383 |     data: {
  384 |       fileName: 'attendance-apr-wk1.xlsx',
  385 |       fileType: 'xlsx',
  386 |       payrollWeekStartDate: weekStart,
  387 |       payrollWeekEndDate: weekEnd,
  388 |       payrollWeekSource: 'SHEET_CONTENT',
  389 |       status: 'READY',
  390 |       isActiveForPayrollWeek: true,
  391 |       sourceFilePath: '/tmp/attendance-apr-wk1.xlsx',
  392 |     },
  393 |   });
  394 | 
  395 |   // emp1: reg=[8,8,6,0,8,8,8] ot=[2,0,0,0,3,1,0] → reg=46, ot=6
  396 |   // emp2: reg=[8,8,8,8,8,8,8] ot=[0,0,0,0,0,0,0] → reg=56, ot=0
  397 |   const attendanceDays = [
  398 |     [{ reg: 8, ot: 2 }, { reg: 8, ot: 0 }, { reg: 6, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 3 }, { reg: 8, ot: 1 }, { reg: 8, ot: 0 }],
  399 |     [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
  400 |   ];
  401 |   const employees = [emp1, emp2];
  402 | 
  403 |   const attendanceData = [];
  404 |   for (let ei = 0; ei < employees.length; ei++) {
  405 |     for (let day = 0; day < 7; day++) {
  406 |       const date = new Date(weekStart);
  407 |       date.setUTCDate(date.getUTCDate() + day);
  408 |       attendanceData.push({
  409 |         attendanceUploadId: upload.id,
  410 |         employeeId: employees[ei].id,
  411 |         attendanceDate: date,
  412 |         regularHours: attendanceDays[ei][day].reg,
  413 |         overtimeHours: attendanceDays[ei][day].ot,
  414 |         sourceSheetName: 'Attendance',
  415 |         sourceEmployeeBlockIndex: ei,
  416 |       });
  417 |     }
  418 |   }
  419 |   await prisma.attendanceRecord.createMany({ data: attendanceData });
  420 | 
  421 |   // emp1: reg=46h × Rs.62.5 = 2875, ot=6h × Rs.62.5 = 375, ded=500 → net=2750
  422 |   // emp2: reg=56h × Rs.75  = 4200, ot=0                    , ded=0   → net=4200
  423 |   const run = await prisma.payrollRun.create({
  424 |     data: {
  425 |       payrollWeekStartDate: weekStart,
  426 |       payrollWeekEndDate:   weekEnd,
  427 |       status: 'APPROVED',
  428 |       currentRevisionNumber: 1,
  429 |       totalRegularPay:  7075,
  430 |       totalOvertimePay: 375,
  431 |       totalAdditions:   0,
  432 |       totalDeductions:  500,
  433 |       totalNetPayable:  6950,
  434 |       approvedAt,
  435 |     },
  436 |   });
  437 | 
  438 |   const revision = await prisma.payrollRevision.create({
  439 |     data: {
```