# Document Service API (Gateway Prefix: /document)

Base path at gateway: /document/api
Auth: Bearer token required (permissions enforced by service).

Standard response envelope (see docs/README.md)

## Documents
- GET /document/api/documents
  - query: filters supported by service
- POST /document/api/documents (multipart/form-data)
  - fields: file (binary), metadata fields per service
- GET /document/api/documents/:id
- PUT /document/api/documents/:id { ...partial }
- DELETE /document/api/documents/:id
- GET /document/api/documents/:id/download
- GET /document/api/documents/:id/url

## Signatures
- GET /document/api/signatures
- GET /document/api/signatures/pending
- POST /document/api/signatures/:id/sign
- POST /document/api/signatures/:id/remind

## Shares
- GET /document/api/shares/shared
- POST /document/api/shares/documents/:id/share { target_user_id, permissions }
- GET /document/api/shares/documents/:id/shares
- PUT /document/api/shares/documents/:id/shares/:shareId { ...partial }
- DELETE /document/api/shares/documents/:id/shares/:shareId
