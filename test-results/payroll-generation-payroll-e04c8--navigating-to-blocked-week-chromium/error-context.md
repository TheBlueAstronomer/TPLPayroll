# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-generation\payroll-flow.spec.ts >> E2E-02: Blocked week >> shows blocker message when navigating to blocked week
- Location: e2e\payroll-generation\payroll-flow.spec.ts:35:7

# Error details

```
Error: Connection terminated unexpectedly
```

# Test source

```ts
  72  |         adjustmentType: 'DEDUCTION',
  73  |         recurrenceType: 'ONE_TIME',
  74  |         amount: 500,
  75  |         reason: 'Advance recovery seed',
  76  |         startPayrollWeekStartDate: week1Start,
  77  |         startPayrollWeekEndDate: week1End,
  78  |         status: 'ACTIVE',
  79  |         skippedCarryForwardCount: 0,
  80  |       },
  81  |     });
  82  |     await prisma.payrollAdjustmentApplication.create({
  83  |       data: {
  84  |         payrollAdjustmentId: adj1.id,
  85  |         employeeId: employee.id,
  86  |         payrollWeekStartDate: week1Start,
  87  |         payrollWeekEndDate: week1End,
  88  |         appliedAmount: 500,
  89  |         approvalStatus: 'PENDING',
  90  |       },
  91  |     });
  92  | 
  93  |     // Adjustment 2: RECURRING ADDITION (active)
  94  |     const adj2 = await prisma.payrollAdjustment.create({
  95  |       data: {
  96  |         employeeId: employee.id,
  97  |         adjustmentType: 'ADDITION',
  98  |         recurrenceType: 'RECURRING',
  99  |         amount: 1000,
  100 |         reason: 'Transport allowance seed',
  101 |         startPayrollWeekStartDate: week1Start,
  102 |         startPayrollWeekEndDate: week1End,
  103 |         recurrenceEndType: 'FIXED_WEEKS',
  104 |         totalRecurrenceWeeks: 4,
  105 |         status: 'ACTIVE',
  106 |         skippedCarryForwardCount: 0,
  107 |       },
  108 |     });
  109 |     await prisma.payrollAdjustmentApplication.create({
  110 |       data: {
  111 |         payrollAdjustmentId: adj2.id,
  112 |         employeeId: employee.id,
  113 |         payrollWeekStartDate: week1Start,
  114 |         payrollWeekEndDate: week1End,
  115 |         appliedAmount: 1000,
  116 |         approvalStatus: 'APPROVED',
  117 |         appliedAt: new Date('2025-03-12'),
  118 |       },
  119 |     });
  120 | 
  121 |     // Adjustment 3: RECURRING DEDUCTION with total balance (completed)
  122 |     const adj3 = await prisma.payrollAdjustment.create({
  123 |       data: {
  124 |         employeeId: employee.id,
  125 |         adjustmentType: 'DEDUCTION',
  126 |         recurrenceType: 'RECURRING',
  127 |         amount: 2000,
  128 |         reason: 'Loan recovery seed',
  129 |         startPayrollWeekStartDate: week2Start,
  130 |         startPayrollWeekEndDate: week2End,
  131 |         recurrenceEndType: 'TOTAL_BALANCE',
  132 |         totalBalance: 2000,
  133 |         remainingBalance: 0,
  134 |         status: 'COMPLETED',
  135 |         skippedCarryForwardCount: 0,
  136 |       },
  137 |     });
  138 |     await prisma.payrollAdjustmentApplication.create({
  139 |       data: {
  140 |         payrollAdjustmentId: adj3.id,
  141 |         employeeId: employee.id,
  142 |         payrollWeekStartDate: week2Start,
  143 |         payrollWeekEndDate: week2End,
  144 |         appliedAmount: 2000,
  145 |         approvalStatus: 'APPROVED',
  146 |         appliedAt: new Date('2025-03-19'),
  147 |       },
  148 |     });
  149 |   } catch (err) {
  150 |     console.error('Adjustment seed failed:', err);
  151 |     throw err;
  152 |   }
  153 | }
  154 | 
  155 | // ─── seedPayrollTestData ──────────────────────────────────────────────────────
  156 | // Seeds a minimal but complete scenario for F06 E2E tests:
  157 | //   - 3 employees with wage history
  158 | //   - 1 READY AttendanceUpload for March 6-12 with daily records
  159 | //   - 1 ERRORS AttendanceUpload for March 13-19 (blocked)
  160 | //   - 1 pending adjustment application for March 6-12
  161 | 
  162 | export async function seedPayrollTestData() {
  163 |   try {
  164 |     await prisma.$connect();
  165 | 
  166 |     const weekStart = new Date('2025-03-06T00:00:00.000Z');
  167 |     const weekEnd   = new Date('2025-03-12T00:00:00.000Z');
  168 |     const errWeekStart = new Date('2025-03-13T00:00:00.000Z');
  169 |     const errWeekEnd   = new Date('2025-03-19T00:00:00.000Z');
  170 | 
  171 |     // ── Employees ──────────────────────────────────────────────────────────
> 172 |     const employees = await Promise.all([
      |                       ^ Error: Connection terminated unexpectedly
  173 |       prisma.employee.create({
  174 |         data: {
  175 |           employeeId: 'EMP-PRY-001',
  176 |           employeeName: 'Kavitha Rajan',
  177 |           designation: 'Security Guard',
  178 |           designationShort: 'Guard',
  179 |           site: 'North Gate',
  180 |           gPay: '9876543210',
  181 |           bankAccount: '012345678901',
  182 |           isActive: true,
  183 |           wageHistory: {
  184 |             create: {
  185 |               weeklySalary: 2500,
  186 |               hourlyRate: 62.5,
  187 |               effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
  188 |               changeSource: 'SEED',
  189 |             },
  190 |           },
  191 |         },
  192 |       }),
  193 |       prisma.employee.create({
  194 |         data: {
  195 |           employeeId: 'EMP-PRY-002',
  196 |           employeeName: 'Ramesh Nair',
  197 |           designation: 'Supervisor',
  198 |           designationShort: 'Supv.',
  199 |           site: 'South Gate',
  200 |           gPay: '9123456780',
  201 |           bankAccount: '098765432109',
  202 |           isActive: true,
  203 |           wageHistory: {
  204 |             create: {
  205 |               weeklySalary: 3000,
  206 |               hourlyRate: 75.0,
  207 |               effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
  208 |               changeSource: 'SEED',
  209 |             },
  210 |           },
  211 |         },
  212 |       }),
  213 |       prisma.employee.create({
  214 |         data: {
  215 |           employeeId: 'EMP-PRY-003',
  216 |           employeeName: 'Sunita Pillai',
  217 |           designation: 'Security Guard',
  218 |           designationShort: 'Guard',
  219 |           site: 'East Gate',
  220 |           gPay: null,
  221 |           bankAccount: null,
  222 |           isActive: true,
  223 |           wageHistory: {
  224 |             create: {
  225 |               weeklySalary: 2500,
  226 |               hourlyRate: 62.5,
  227 |               effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
  228 |               changeSource: 'SEED',
  229 |             },
  230 |           },
  231 |         },
  232 |       }),
  233 |     ]);
  234 | 
  235 |     // ── READY upload for March 6-12 ────────────────────────────────────────
  236 |     const readyUpload = await prisma.attendanceUpload.create({
  237 |       data: {
  238 |         fileName: 'attendance-march-wk1.xlsx',
  239 |         fileType: 'xlsx',
  240 |         payrollWeekStartDate: weekStart,
  241 |         payrollWeekEndDate: weekEnd,
  242 |         payrollWeekSource: 'SHEET_CONTENT',
  243 |         status: 'READY',
  244 |         isActiveForPayrollWeek: true,
  245 |         sourceFilePath: '/tmp/attendance-march-wk1.xlsx',
  246 |       },
  247 |     });
  248 | 
  249 |     // Daily records for each employee (Thu–Wed = 7 days)
  250 |     // Employee 1: reg=[8,8,6,0,8,8,8], OT=[2,0,0,0,3,1,0] → reg=46, OT=6
  251 |     // Employee 2: reg=[8,8,8,8,8,8,8], OT=[0,0,0,0,0,0,0] → reg=56, OT=0
  252 |     // Employee 3: reg=[8,8,8,0,8,8,8], OT=[0,0,0,0,0,0,0] → reg=48, OT=0
  253 |     const attendanceDays = [
  254 |       [{ reg: 8, ot: 2 }, { reg: 8, ot: 0 }, { reg: 6, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 3 }, { reg: 8, ot: 1 }, { reg: 8, ot: 0 }],
  255 |       [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
  256 |       [{ reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 0, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }, { reg: 8, ot: 0 }],
  257 |     ];
  258 | 
  259 |     for (let empIdx = 0; empIdx < employees.length; empIdx++) {
  260 |       for (let day = 0; day < 7; day++) {
  261 |         const date = new Date(weekStart);
  262 |         date.setUTCDate(date.getUTCDate() + day);
  263 |         await prisma.attendanceRecord.create({
  264 |           data: {
  265 |             attendanceUploadId: readyUpload.id,
  266 |             employeeId: employees[empIdx].id,
  267 |             attendanceDate: date,
  268 |             regularHours: attendanceDays[empIdx][day].reg,
  269 |             overtimeHours: attendanceDays[empIdx][day].ot,
  270 |             sourceSheetName: 'Attendance',
  271 |             sourceEmployeeBlockIndex: empIdx,
  272 |           },
```