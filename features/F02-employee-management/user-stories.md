# F02 — Employee Management: User Stories

> **Status: ✅ DONE** — All 8 user stories fully implemented.

---

## US-02.1: Add a new employee ✅

**As a** Payroll Owner
**I want to** add a new employee to the master database
**So that** the employee is available for attendance matching and payroll calculation.

### Acceptance Criteria

- AC1: The form contains all fields from PRD Section 6 (Employee ID, Name, National ID, Designation, Date of Joining, Aadhaar ID, Police Verification ID, Salary, Hourly Rate, Phone, D.O.B, Health Card ID, GPay, Bank Account, Date of Resignation, Site, Active, Designation Short).
- AC2: Employee ID, Employee Name, Designation, Salary, Hourly Rate, and Active are required.
- AC3: Employee ID must be unique; the form shows an inline error if a duplicate is submitted.
- AC4: On successful save, a wage history entry is created with effectiveFrom = creation date.
- AC5: On successful save, an audit log is created with actionType = "CREATE", entityType = "EMPLOYEE".
- AC6: On successful save, the user is redirected to the employee list or the new employee's profile.
- AC7: Salary and Hourly Rate accept decimal values.

### Unit Tests

```
TEST: createEmployee saves employee and returns record
  GIVEN valid employee data with employeeId = "EMP-100"
  WHEN createEmployee() is called
  THEN the employee is saved to the database
  AND the returned record has matching fields

TEST: createEmployee rejects duplicate employeeId
  GIVEN employee "EMP-100" already exists
  WHEN createEmployee() is called with employeeId = "EMP-100"
  THEN it throws a "DUPLICATE_EMPLOYEE_ID" error

TEST: createEmployee rejects missing required fields
  GIVEN employee data with employeeName = null
  WHEN createEmployee() is called
  THEN it throws a validation error for "employeeName"

TEST: createEmployee creates initial wage history
  GIVEN valid employee data with salary = 12000, hourlyRate = 62.50
  WHEN createEmployee() is called
  THEN a wage history record is created with weeklySalary = 12000, hourlyRate = 62.50

TEST: createEmployee creates audit log
  GIVEN valid employee data
  WHEN createEmployee() is called
  THEN an audit log entry is created with actionType = "CREATE", entityType = "EMPLOYEE"
```

---

## US-02.2: View employee list ✅

**As a** Payroll Owner
**I want to** see a list of all employees
**So that** I can quickly find and manage employee records.

### Acceptance Criteria

- AC1: The list shows Employee ID, Employee Name, Designation, Site, Active status.
- AC2: The list includes active, inactive, and resigned employees.
- AC3: The list supports pagination.
- AC4: Each row is clickable and navigates to the employee's profile page.
- AC5: Active employees show a green status badge, inactive show gray, and resigned (employees with dateOfResignation set) show a red badge.

### Unit Tests

```
TEST: getEmployeeList returns all employees
  GIVEN 15 employees in the database (10 active, 3 inactive, 2 resigned)
  WHEN getEmployeeList() is called without filters
  THEN it returns 15 employees

TEST: getEmployeeList paginates correctly
  GIVEN 30 employees in the database
  WHEN getEmployeeList(page=1, limit=10) is called
  THEN it returns 10 employees and totalCount = 30

TEST: getEmployeeList returns correct status indicators
  GIVEN an employee with isActive = false and dateOfResignation = "2025-01-15"
  WHEN getEmployeeList() is called
  THEN that employee's computed status is "RESIGNED"
```

---

## US-02.3: Search employees ✅

**As a** Payroll Owner
**I want to** search employees by name or Employee ID
**So that** I can quickly find a specific employee.

### Acceptance Criteria

- AC1: Search matches against Employee Name (case-insensitive, partial match).
- AC2: Search matches against Employee ID (case-insensitive, partial match).
- AC3: Search results update as the user types (debounced at 300ms).
- AC4: If no results match, the list shows "No employees found".

### Unit Tests

```
TEST: searchEmployees matches by name substring
  GIVEN employees "Ravi Kumar", "Ravi Sharma", "Anil Patel"
  WHEN searchEmployees("ravi") is called
  THEN it returns "Ravi Kumar" and "Ravi Sharma"

TEST: searchEmployees matches by employee ID
  GIVEN employee with employeeId = "EMP-042"
  WHEN searchEmployees("EMP-04") is called
  THEN it returns that employee

TEST: searchEmployees returns empty when no match
  GIVEN employees exist
  WHEN searchEmployees("zzzzz") is called
  THEN it returns an empty array
```

---

## US-02.4: Filter employees by status ✅

**As a** Payroll Owner
**I want to** filter the employee list by Active, Inactive, or Resigned status
**So that** I can focus on a specific group of employees.

### Acceptance Criteria

- AC1: Filter options: All, Active, Inactive, Resigned.
- AC2: "All" is selected by default.
- AC3: "Resigned" filters to employees with `dateOfResignation` set, regardless of `isActive`.
- AC4: Filter and search work together.

### Unit Tests

```
TEST: filterEmployees with status ACTIVE returns only active employees
  GIVEN 10 active, 3 inactive, 2 resigned employees
  WHEN filterEmployees(status="ACTIVE") is called
  THEN it returns 10 employees all with isActive = true

TEST: filterEmployees with status RESIGNED returns only resigned employees
  GIVEN 2 employees with dateOfResignation set
  WHEN filterEmployees(status="RESIGNED") is called
  THEN it returns 2 employees
```

---

## US-02.5: View employee profile ✅

**As a** Payroll Owner
**I want to** view the full details of a single employee, including wage history
**So that** I can review and manage their information.

### Acceptance Criteria

- AC1: The profile page shows all fields from PRD Section 6.
- AC2: Sensitive fields (Aadhaar ID, Bank Account, GPay) are displayed on this page.
- AC3: A "Wage History" section lists all wage history entries sorted by effectiveFrom descending.
- AC4: Each wage history entry shows weeklySalary, hourlyRate, effectiveFrom, effectiveTo, changeSource.
- AC5: An "Edit" button opens the edit form.

### Unit Tests

```
TEST: getEmployeeById returns full employee data
  GIVEN employee "EMP-042" exists
  WHEN getEmployeeById("EMP-042") is called
  THEN it returns the complete employee record including all fields

TEST: getEmployeeWageHistory returns sorted history
  GIVEN employee "EMP-042" has 3 wage history entries
  WHEN getEmployeeWageHistory(employeeId) is called
  THEN it returns 3 entries sorted by effectiveFrom descending
```

---

## US-02.6: Edit employee details ✅

**As a** Payroll Owner
**I want to** update an employee's details
**So that** changes like site assignments, phone numbers, and wage changes are reflected.

### Acceptance Criteria

- AC1: All editable fields are pre-populated with current values.
- AC2: Employee ID is read-only after creation.
- AC3: If Salary or Hourly Rate changes, a new wage history entry is automatically created.
- AC4: The previous wage history entry's effectiveTo is set to today.
- AC5: An audit log is created for the update with a JSON diff of changed fields.
- AC6: A separate audit log is created for wage changes specifically.

### Unit Tests

```
TEST: updateEmployee saves changes and returns updated record
  GIVEN employee "EMP-042" with phone = "9876543210"
  WHEN updateEmployee(id, { phone: "1111111111" }) is called
  THEN the employee's phone is updated to "1111111111"

TEST: updateEmployee creates wage history on salary change
  GIVEN employee "EMP-042" with salary = 12000
  WHEN updateEmployee(id, { salary: 14000 }) is called
  THEN a new wage history entry is created with weeklySalary = 14000
  AND the previous wage history entry has effectiveTo = today

TEST: updateEmployee creates audit log
  GIVEN employee "EMP-042"
  WHEN updateEmployee(id, { site: "North Gate" }) is called
  THEN an audit log is created with actionType = "UPDATE", entityType = "EMPLOYEE"

TEST: updateEmployee does NOT create wage history if wages unchanged
  GIVEN employee "EMP-042" with salary = 12000
  WHEN updateEmployee(id, { phone: "9999999999" }) is called
  THEN no new wage history entry is created
```

---

## US-02.7: Deactivate / Reactivate employee ✅

**As a** Payroll Owner
**I want to** mark an employee as inactive or reactivate them
**So that** inactive employees are excluded from payroll but retained in the system.

### Acceptance Criteria

- AC1: Toggling isActive to false deactivates the employee.
- AC2: Toggling isActive to true reactivates the employee.
- AC3: Deactivated employees remain in search, list, and export.
- AC4: An audit log is created.

### Unit Tests

```
TEST: deactivateEmployee sets isActive to false
  GIVEN an active employee
  WHEN updateEmployee(id, { isActive: false }) is called
  THEN the employee's isActive is false

TEST: reactivateEmployee sets isActive to true
  GIVEN an inactive employee
  WHEN updateEmployee(id, { isActive: true }) is called
  THEN the employee's isActive is true
```

---

## US-02.8: Set Date of Resignation ✅

**As a** Payroll Owner
**I want to** record an employee's resignation date
**So that** the system can block payroll for employees who resigned before the payroll week.

### Acceptance Criteria

- AC1: Date of Resignation is an optional date field on the employee form.
- AC2: Setting a resignation date does not automatically change isActive — they are independent.
- AC3: An audit log is created when the resignation date is set or changed.

### Unit Tests

```
TEST: setResignationDate saves the date
  GIVEN employee "EMP-042" with no resignation date
  WHEN updateEmployee(id, { dateOfResignation: "2025-06-15" }) is called
  THEN the employee's dateOfResignation is "2025-06-15"
```
