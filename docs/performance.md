# Performance Service API (Gateway Prefix: /perf)

Base path at gateway: /perf/api
Auth: Bearer token required.

Standard response envelope (see docs/README.md)

## Review Templates

- GET /perf/api/review-templates
- GET /perf/api/review-templates/:id
- POST /perf/api/review-templates { name, description?, sections: [...] }
- PUT /perf/api/review-templates/:id { ...partial }
- DELETE /perf/api/review-templates/:id
- GET /perf/api/review-templates/:id/questions
- POST /perf/api/review-templates/:id/questions { prompt, type, options? }
- PUT /perf/api/review-templates/:templateId/questions/:questionId { ...partial }
- DELETE /perf/api/review-templates/:templateId/questions/:questionId

## Review Cycles

- GET /perf/api/review-cycles
- GET /perf/api/review-cycles/active
- GET /perf/api/review-cycles/:id
- POST /perf/api/review-cycles { name, startDate, endDate, templateId, scope }
- PUT /perf/api/review-cycles/:id { ...partial }
- DELETE /perf/api/review-cycles/:id
- PUT /perf/api/review-cycles/:id/status { status }
- POST /perf/api/review-cycles/:id/participants { employeeIds: uuid[] }
- DELETE /perf/api/review-cycles/:cycleId/participants/:participantId
- PUT /perf/api/review-cycles/:id/statistics { ... }

## Reviews

- GET /perf/api/reviews
- GET /perf/api/reviews/employee/:employeeId
- GET /perf/api/reviews/manager/:managerId
- GET /perf/api/reviews/:id
- POST /perf/api/reviews { employeeId, cycleId, templateId, reviewers: uuid[] }
- DELETE /perf/api/reviews/:id
- PUT /perf/api/reviews/:id/status { status }
- POST /perf/api/reviews/:id/sections { sectionId, answers: [...] }
- POST /perf/api/reviews/:id/comments { comment }
- POST /perf/api/reviews/:id/acknowledge

## Development Plans

- GET /perf/api/development-plans
- GET /perf/api/development-plans/employee/:employeeId
- GET /perf/api/development-plans/review/:reviewId
- GET /perf/api/development-plans/:id
- POST /perf/api/development-plans { employeeId, objectives: [...] }
- PUT /perf/api/development-plans/:id { ...partial }
- DELETE /perf/api/development-plans/:id
- POST /perf/api/development-plans/:id/objectives { title, description?, dueDate? }
- PUT /perf/api/development-plans/:planId/objectives/:objectiveId { ...partial }
- DELETE /perf/api/development-plans/:planId/objectives/:objectiveId
- POST /perf/api/development-plans/objectives/:objectiveId/actions { title, dueDate? }
- PUT /perf/api/development-plans/actions/:actionId { ...partial }
- DELETE /perf/api/development-plans/actions/:actionId
