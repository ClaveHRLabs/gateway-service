# Notification Service API (Gateway Prefix: /nt)

Base path at gateway: /nt/api
Auth: Bearer token required.

Standard response envelope (see docs/README.md)

## Templates

- POST /nt/api/templates { name, channel: 'email'|'sms'|'whatsapp'|'telegram', subject?, body, variables?: string[] }
- GET /nt/api/templates/:id
- GET /nt/api/templates/organization/:organizationId
- PUT /nt/api/templates/:id { ...partial }
- DELETE /nt/api/templates/:id

## Notifications

- POST /nt/api/notifications { templateId?, channel?, to: string|object, subject?, body?, variables?: object, attachments?: [] }
- GET /nt/api/notifications/:id
- GET /nt/api/notifications/:id/logs
- GET /nt/api/notifications/types (Public)
