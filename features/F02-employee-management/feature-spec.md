# F02 — Employee Management

> **Status: ✅ DONE**

## Goal

Allow the Payroll Owner to maintain a complete employee master database — creating, viewing, editing, searching, and deactivating employee records — so that employees are accurately represented for attendance matching and payroll generation.

## Scope

- Add a new employee manually with all supported fields.
- View a searchable, filterable list of all employees.
- View an individual employee profile with full details and wage history.
- Edit employee details (including Salary and Hourly Rate with automatic wage history creation).
- Deactivate or reactivate an employee.
- Set Date of Resignation.
- Audit logging for all create/update/wage-change operations.

## PRD References

- Section 6: Employee Master Data (field definitions)
- Section 9.1: Add Employee Manually (workflow)
- Section 9.2: Update Employee (workflow)
- Section 16.3: Inactive and Resigned Employee Rules
- Section 17.3: Auditability

---

## E2E Behavior Tests

### E2E-01: Add a new employee successfully

```
GIVEN the user is on the Employee Management page
WHEN the user clicks "Add Employee"
AND fills in Employee ID = "EMP-042", Employee Name = "Ravi Kumar", Designation = "Guard", Salary = 12000, Hourly Rate = 62.50, Active = true
AND clicks "Save"
THEN the employee is saved to the database
AND the employee appears in the employee list
AND a wage history entry is created with effectiveFrom = today, weeklySalary = 12000, hourlyRate = 62.50
AND an audit log entry is created with actionType = "CREATE", entityType = "EMPLOYEE"
```

### E2E-02: Prevent duplicate Employee ID

```
GIVEN employee "EMP-042" already exists in the database
WHEN the user tries to add a new employee with Employee ID = "EMP-042"
AND clicks "Save"
THEN the app shows a validation error: "Employee ID already exists"
AND the employee is not saved
```

### E2E-03: Update employee with wage change creates wage history

```
GIVEN employee "EMP-042" exists with Hourly Rate = 62.50
WHEN the user opens the employee profile for "EMP-042"
AND changes Hourly Rate to 75.00
AND clicks "Save"
THEN the employee record is updated with hourlyRate = 75.00
AND a new wage history entry is created with the new hourlyRate and effectiveFrom = today
AND the previous wage history entry gets effectiveTo = today
AND an audit log is created with actionType = "UPDATE" for the employee
AND an audit log is created with actionType = "UPDATE" for the wage change
```

### E2E-04: Search employees

```
GIVEN 25 employees exist in the database
WHEN the user types "Ravi" into the search box on the Employee Management page
THEN the list filters to show only employees whose name contains "Ravi"
```

### E2E-05: Filter employees by active status

```
GIVEN 20 active employees, 5 inactive employees, and 3 resigned employees exist
WHEN the user selects the "Inactive" filter
THEN the list shows only the 5 inactive employees
```

### E2E-06: Deactivate an employee

```
GIVEN employee "EMP-042" is active
WHEN the user opens the employee profile
AND sets Active to "Inactive"
AND clicks "Save"
THEN the employee's isActive is set to false
AND the employee still appears in search results
AND an audit log is created with actionType = "UPDATE"
```

### E2E-07: Employee with required fields missing is rejected

```
GIVEN the user is on the Add Employee form
WHEN the user fills in Employee ID = "EMP-043" but leaves Employee Name blank
AND clicks "Save"
THEN the app shows a validation error on the Employee Name field
AND the employee is not saved
```

### E2E-08: View employee wage history

```
GIVEN employee "EMP-042" has had 3 wage changes over time
WHEN the user opens the employee profile for "EMP-042"
AND scrolls to the Wage History section
THEN the user sees 3 wage history entries ordered by effectiveFrom descending
AND each entry shows weeklySalary, hourlyRate, effectiveFrom, effectiveTo, and changeSource
```
