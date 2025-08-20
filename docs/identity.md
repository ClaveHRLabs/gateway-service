# Identity Service API (Gateway Prefix: /id)

Base path at gateway: /id/api
Auth: Bearer token required unless marked Public. Gateway forwards user context headers.

Standard response envelope

- success: boolean
- timestamp: ISO string
- requestId: string
- data?: any
- error?: { code: string, message: string, details?: object }

## Auth

- POST /id/api/auth/login (Public)
    - body: { email: string, password: string }
    - 200 data: { accessToken: string, refreshToken: string, user: UserSummary }
- POST /id/api/auth/refresh (Public)
    - body: { refreshToken: string }
    - 200 data: { accessToken: string, refreshToken: string }
- POST /id/api/auth/logout
    - body: { refresh_token?: string }
    - 200: { success: true }
- OAuth (Public)
    - GET /id/api/auth/google/authorize?redirect_uri: url
    - POST /id/api/auth/google { id_token: string }
    - GET /id/api/auth/microsoft/authorize?redirect_uri: url
    - POST /id/api/auth/microsoft { id_token: string }
    - GET /id/api/auth/linkedin/authorize?redirect_uri: url
    - POST /id/api/auth/linkedin { code: string, redirect_uri: string }
- Magic link (Public)
    - POST /id/api/auth/magic-link { email: string }
    - POST /id/api/auth/verify-magic-link { token: string }

## Users

- GET /id/api/users
    - query: { organization_id?: uuid, status?: 'active'|'inactive'|'suspended', email?: string, limit?: number, offset?: number }
    - 200 data: { items: User[], total: number }
- GET /id/api/users/me
    - 200 data: User
- GET /id/api/users/:id
    - params: { id: uuid }
    - 200 data: User
- POST /id/api/users
    - body: CreateUser
    - 201 data: User
- PUT /id/api/users/:id
    - params: { id: uuid }
    - body: UpdateUser
    - 200 data: User
- DELETE /id/api/users/:id
    - params: { id: uuid }
    - 200: { success: true }

User

- id: uuid
- email: string
- firstName?: string
- lastName?: string
- phone?: string
- avatarUrl?: string
- role: string
- status: 'pending'|'active'|'disabled'
- createdAt: string (ISO)
- updatedAt: string (ISO)

CreateUser

- email: string
- password?: string
- firstName?: string
- lastName?: string
- role?: string
- organizationId?: uuid

UpdateUser: Partial<CreateUser>

## Organizations

- POST /id/api/organizations
    - body: { name: string, domain?: string, industry?: string, size?: string }
    - 201 data: Organization
- GET /id/api/organizations/:id
    - params: { id: uuid }
    - 200 data: Organization
- PUT /id/api/organizations/:id
    - params: { id: uuid }
    - body: OrganizationUpdate
    - 200 data: Organization
- PATCH /id/api/organizations/:id
    - params: { id: uuid }
    - body: OrganizationUpdate
    - 200 data: Organization
- DELETE /id/api/organizations/:id
    - params: { id: uuid }
    - 200: { success: true }
- PATCH /id/api/organizations/:id/branding
    - params: { id: uuid }
    - body: { logo_url?: url, primary_color?: hex, secondary_color?: hex }
    - 200 data: Organization
- POST /id/api/organizations/:id/complete-setup
    - params: { id: uuid }
    - 200: { success: true }

Organization

- id: uuid
- name: string
- domain?: string
- industry?: string
- size?: string
- logoUrl?: string
- status: 'active'|'suspended'

OrganizationUpdate: Partial<Organization>

## Roles & Permissions

- GET /id/api/roles
- GET /id/api/roles/:id
- POST /id/api/roles { name: string, permissions: string[] }
- PUT /id/api/roles/:id { name?: string, permissions?: string[] }
- DELETE /id/api/roles/:id
- GET /id/api/permissions
- GET /id/api/permissions/:id
- POST /id/api/permissions { name: string, description?: string }
- PUT /id/api/permissions/:id { name?: string, description?: string }
- DELETE /id/api/permissions/:id
- GET /id/api/roles/:roleId/permissions
- POST /id/api/permissions/assign { roleId: uuid, permissionId: uuid }
- DELETE /id/api/roles/:roleId/permissions/:permissionId
- GET /id/api/roles/user/:userId
- POST /id/api/roles/assign { userId: uuid, roleId: uuid, organizationId?: uuid }
- POST /id/api/roles/assign-by-name { userId: uuid, roleName: string, organizationId?: uuid }
- POST /id/api/roles/user/:userId/remove-role { roleName: string, organizationId?: uuid }
- DELETE /id/api/roles/user/:userId/role/:roleId
- GET /id/api/roles/check-permission/:userId/:permissionName

Notes

- Service-to-service calls may use `x-service-key` header per identity service policy.
