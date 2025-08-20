# Gateway API Documentation

This directory contains API documentation for each backend service as exposed through the Gateway. All paths are prefixed by the service key at the gateway (e.g., `/id`, `/emp`, `/eng`, `/perf`, `/rec`, `/nt`, `/document`).

Documents:

- identity.md – Authentication, users, organizations, roles
- employee.md – Employees, goals/okrs, time & leave
- engagement.md – Surveys, recognitions, events, wellness, dashboards, retention
- performance.md – Performance reviews, cycles, templates, development plans
- recruitment.md – Candidates, requisitions, offers, interviews, onboarding
- notification.md – Notification templates and notifications
- document.md – Documents, signatures, shares

Conventions:

- Request/Response bodies are shown with field names, types, and optionality
- All endpoints require `Authorization: Bearer <token>` unless noted as public
- Gateway adds user context headers when proxying requests
