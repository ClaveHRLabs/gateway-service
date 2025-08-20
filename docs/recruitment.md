# Recruitment Service API (Gateway Prefix: /rec)

Base path at gateway: /rec/api
Auth: Bearer token required unless stated public (public endpoints under /rec/api/public).

Standard response envelope (see docs/README.md)

## Candidates

- GET /rec/api/candidates
- GET /rec/api/candidates/:id
- POST /rec/api/candidates { ...candidate }
- PUT /rec/api/candidates/:id { ...partial }
- DELETE /rec/api/candidates/:id
- POST /rec/api/candidates/:candidateId/applications/:requisitionId
- PUT /rec/api/candidates/applications/:applicationId/status { status }
- GET /rec/api/candidates/applications/:candidateId/:requisitionId/check
- Bulk:
    - POST /rec/api/candidates/bulk/status { candidate_ids: uuid[], status }
    - POST /rec/api/candidates/bulk/stage { candidate_ids: uuid[], stage }
    - POST /rec/api/candidates/bulk/schedule-interview { candidate_ids: uuid[], ... }
    - POST /rec/api/candidates/bulk/email { candidate_ids: uuid[], subject, body }
    - POST /rec/api/candidates/bulk/reject { candidate_ids: uuid[], reason }

## Requisitions

- GET /rec/api/requisitions
- GET /rec/api/requisitions/:id
- POST /rec/api/requisitions { ...requisition }
- PUT /rec/api/requisitions/:id { ...partial }
- DELETE /rec/api/requisitions/:id
- POST /rec/api/requisitions/:id/submit
- POST /rec/api/requisitions/:id/approval { approverId, decision }
- POST /rec/api/requisitions/:id/withdraw
- POST /rec/api/requisitions/:id/toggle-status { status }
- GET /rec/api/requisitions/:id/approvals
- GET /rec/api/requisitions/:id/approval-status
- GET /rec/api/requisitions/:id/approval-history
- POST /rec/api/requisitions/:id/publish
- POST /rec/api/requisitions/:id/close
- GET /rec/api/requisitions/:id/applications
- POST /rec/api/requisitions/:id/add-candidate { candidate_id, notes?, source? }

## Offers

- GET /rec/api/offers
- GET /rec/api/offers/:id
- POST /rec/api/applications/:applicationId/offers { ...offer }
- PUT /rec/api/offers/:id { ...partial }
- POST /rec/api/offers/:id/submit
- POST /rec/api/offers/:id/approval { approverId, decision }
- POST /rec/api/offers/:id/extend { ... }
- POST /rec/api/offers/:id/response { response }
- POST /rec/api/offers/:id/withdraw { reason? }
- GET /rec/api/offers/:id/approvals

## Interviews

- GET /rec/api/interviews
- GET /rec/api/interviews/application/:applicationId
- GET /rec/api/interviews/:id
- POST /rec/api/interviews/application/:applicationId { ...interview }
- PUT /rec/api/interviews/:id { ...partial }
- POST /rec/api/interviews/:id/cancel
- POST /rec/api/interviews/:id/complete
- POST /rec/api/interviews/:id/participants { participantId }
- POST /rec/api/interviews/:id/participants/bulk { participantIds: uuid[] }
- DELETE /rec/api/interviews/:id/participants/:participantId
- POST /rec/api/interviews/:id/feedback { ...feedback }
- GET /rec/api/interviews/:id/feedback
- PUT /rec/api/interviews/:id/feedback/:feedbackId { ... }
- DELETE /rec/api/interviews/:id/feedback/:feedbackId

## Analytics

- GET /rec/api/analytics/recruitment?time_range=...
- GET /rec/api/analytics/applications?time_range=...
- GET /rec/api/analytics/interviews?time_range=...
- GET /rec/api/analytics/offers?time_range=...
- GET /rec/api/analytics/hiring?time_range=...
- GET /rec/api/analytics/departments/progress
- GET /rec/api/analytics/candidate-source?time_range=...

## Employee Search

- GET /rec/api/employee-search?q=...&filters=...

## Documents

- POST /rec/api/documents { ...meta }, file upload handled by service
- GET /rec/api/documents/:id
- PUT /rec/api/documents/:id { ...partial }
- DELETE /rec/api/documents/:id
- GET /rec/api/documents/:id/logs
- POST /rec/api/documents/:id/associate { entity_type, entity_id }
- DELETE /rec/api/documents/:id/associate?entity_type=...&entity_id=...

## Onboarding

- GET /rec/api/onboarding
- GET /rec/api/onboarding/:id
- POST /rec/api/onboarding/offer/:offerId { ... }
- PUT /rec/api/onboarding/:id { ...partial }
- POST /rec/api/onboarding/:id/start { notes? }
- POST /rec/api/onboarding/:id/complete { ... }
- POST /rec/api/onboarding/:id/cancel { ... }
- GET /rec/api/onboarding/:id/tasks
- POST /rec/api/onboarding/:id/tasks { ...task }
- GET /rec/api/onboarding/tasks/:taskId
- PUT /rec/api/onboarding/tasks/:taskId { ...partial }
- PUT /rec/api/onboarding/tasks/:taskId/status { status }
- PUT /rec/api/onboarding/tasks/:taskId/assign { assignee }
- DELETE /rec/api/onboarding/tasks/:taskId

## Public (no auth)

- GET /rec/api/public/requisitions
- GET /rec/api/public/requisitions/:id
- POST /rec/api/public/applications { requisition_id, candidate: { ... }, attachments?: [] }
