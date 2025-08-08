# Employee Service API (Gateway Prefix: /emp)

Base path at gateway: /emp/api
Auth: Bearer token required.

See docs/README.md for the standard response envelope.

## Employees
- POST /emp/api/employees
  - body: CreateEmployee (see structure below)
  - 201 data: Employee
- GET /emp/api/employees
  - 200 data: Employee[] (with pagination via query if supported)
- GET /emp/api/employees/ids?ids=uuid,uuid
  - 200 data: Employee[]
- GET /emp/api/employees/total-employees
  - 200 data: { total: number }
- GET /emp/api/employees/hierarchy
  - 200 data: TreeNode[]
- GET /emp/api/employees/org-chart
  - 200 data: OrgChartNode[]
- GET /emp/api/employees/manager/:managerId
  - params: { managerId: uuid }
  - 200 data: Employee[]
- GET /emp/api/employees/user/:userId
  - params: { userId: uuid }
  - 200 data: Employee
- GET /emp/api/employees/internal-id/:internalId
  - params: { internalId: string }
  - 200 data: Employee
- GET /emp/api/employees/:id
  - params: { id: uuid }
  - 200 data: Employee
- GET /emp/api/employees/:id/lite
  - 200 data: EmployeeLite
- GET /emp/api/employees/:id/full
  - 200 data: EmployeeFull
- PATCH /emp/api/employees/:id
  - body: UpdateEmployee
  - 200 data: Employee
- DELETE /emp/api/employees/:id
  - 200: { success: true }
- CSV Upload: POST /emp/api/employees/upload/csv (Content-Type: text/csv)

CreateEmployee (key sections)
- userId?: uuid
- status: 'active'|'onboarding'|'offboarding'|'terminated'|'on_leave'
- personalInfo: { firstName: string, middleName?: string, lastName: string, preferredName?: string, pronouns?: string, photo?: string }
- contactInfo: { email: email, personalEmail?: email, phone: string, alternatePhone?: string, address: { street: string, city: string, state: string, zipCode: string, country: string }, emergencyContact?: { name: string, relationship: string, phone: string, email?: email } }
- employmentDetails: { employeeId: string, startDate: date, endDate?: date, department: string, position: string, level: string, contractType: string, manager?: uuid, directReports?: uuid[], workLocation: 'remote'|'office'|'hybrid', office?: string, salary?: number, salaryFrequency?: 'hourly'|'monthly'|'annually', status: status }
- education?: Array<{ institution: string, degree: string, fieldOfStudy: string, startDate: date, endDate?: date, gpa?: number, achievements?: string[] }>
- workExperience?: Array<{ company: string, position: string, startDate: date, endDate?: date, description?: string, achievements?: string[] }>
- skills?: Array<{ name: string, category: string, proficiency: 'beginner'|'intermediate'|'advanced'|'expert', yearsOfExperience?: number }>
- documents?: Array<{ id: string, type: string, name: string, status: string, uploadDate?: date, expirationDate?: date, verificationDate?: date, notes?: string, url?: string }>
- onboarding?: { stage: string, progress: number, startDate: date, targetCompletionDate: date, actualCompletionDate?: date, buddy?: string, tasks?: Task[], notes?: string }

UpdateEmployee: Partial<CreateEmployee>

## Time & Leave
- GET /emp/api/time/holidays
- GET /emp/api/time/holidays/by-country?year=YYYY&country=ISO3
- POST /emp/api/time/holidays { name, date, country_code, is_recurring? }
- PUT /emp/api/time/holidays/:holidayId
- DELETE /emp/api/time/holidays/:holidayId
- POST /emp/api/time/holidays/bulk-import (CSV payload)
- POST /emp/api/time/time-entries { employee_id, start_time, end_time?, project?, description? }
- GET /emp/api/time/time-entries
- GET /emp/api/time/time-entries/employee/:employeeId
- GET /emp/api/time/time-entries/:timeEntryId
- PUT /emp/api/time/time-entries/:timeEntryId
- DELETE /emp/api/time/time-entries/:timeEntryId
- GET /emp/api/time/time-entries/employee/:employeeId/by-project
- GET /emp/api/time/time-entries/by-project
- POST /emp/api/time/leave-requests { employee_id, leave_type_id, start_date, end_date, reason? }
- PUT /emp/api/time/leave-requests/:leaveRequestId/status { status }
- GET /emp/api/time/leave-requests/employee/:employeeId
- GET /emp/api/time/leave-requests/pending
- GET /emp/api/time/leave-requests/:leaveRequestId
- GET /emp/api/time/leave-types
- GET /emp/api/time/leave-types/:leaveTypeId
- POST /emp/api/time/leave-types { name, description?, color?, is_paid?, requires_approval?, max_days_per_year?, accrual_rate? }
- PUT /emp/api/time/leave-types/:leaveTypeId
- DELETE /emp/api/time/leave-types/:leaveTypeId
- GET /emp/api/time/leave-balances/employee/:employeeId
- GET /emp/api/time/leave-statistics
- GET /emp/api/time/daily-time-entries/employee/:employeeId
- GET /emp/api/time/projects
- POST /emp/api/time/projects { name, description? }
- PUT /emp/api/time/projects/:projectId
- DELETE /emp/api/time/projects/:projectId
- GET /emp/api/time/projects/:projectId
- GET /emp/api/time/employee-work-schedule/:employeeId
- GET /emp/api/time/working-days

## Goals & OKRs
- POST /emp/api/goals { title, description?, scope, timeFrame, startDate, dueDate, priority, category, ownerId?, departmentId?, visibility, metrics?, alignWith?, contributors?, visibilityEntities? }
- GET /emp/api/goals
- GET /emp/api/goals/:id
- PATCH /emp/api/goals/:id { ...partial goal }
- DELETE /emp/api/goals/:id
- POST /emp/api/goals/:id/smart
- GET /emp/api/goals/:id/milestones
- POST /emp/api/goals/:id/milestones { title, due_date }
- PATCH /emp/api/goals/:id/milestones/:milestoneId
- DELETE /emp/api/goals/:id/milestones/:milestoneId
- GET /emp/api/goals/:id/metrics
- POST /emp/api/goals/:id/metrics { name, target, unit, description? }
- PATCH /emp/api/goals/:id/metrics/:metricId
- DELETE /emp/api/goals/:id/metrics/:metricId
- GET /emp/api/goals/:id/checkins
- POST /emp/api/goals/:id/checkins { note, progress, status? }
- PATCH /emp/api/goals/:id/checkins/:checkInId
- DELETE /emp/api/goals/:id/checkins/:checkInId
- GET /emp/api/goals/:id/comments
- POST /emp/api/goals/:id/comments { content, isPrivate? }
- PATCH /emp/api/goals/:id/comments/:commentId { content, isPrivate? }
- DELETE /emp/api/goals/:id/comments/:commentId
- POST /emp/api/goals/align { parentGoalId, childGoalId }
- DELETE /emp/api/goals/align/:parentId/:childId
- GET /emp/api/goals/:id/parents
- GET /emp/api/goals/:id/children
- GET /emp/api/goals/okrs
- POST /emp/api/goals/okrs { objective: {...}, keyResults: [{ title, target, unit, current? }] }
- GET /emp/api/goals/okrs/:id
- GET /emp/api/goals/:goalId/okr
- PATCH /emp/api/goals/okrs/:id { ...partial okr }
- DELETE /emp/api/goals/okrs/:id
- POST /emp/api/goals/okrs/:id/keyresults { title, target, unit, current? }
- PATCH /emp/api/goals/okrs/:id/keyresults/:keyResultId
- DELETE /emp/api/goals/okrs/:id/keyresults/:keyResultId
