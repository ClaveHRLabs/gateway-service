# Gateway Service

A microservices API gateway that handles authentication, request routing, and service discovery with a simplified, generic approach.

## Architecture

The Gateway Service acts as the central entry point for all API requests from the web frontend to the backend services. It implements the API Gateway pattern to provide a unified interface for clients while routing requests to appropriate microservices.

```
┌────────────┐           ┌──────────────┐           ┌──────────────────┐
│            │           │              │           │                  │
│   Web UI   ├───────────►  API Gateway ├───────────►  Backend Services │
│            │           │              │           │                  │
└────────────┘           └──────────────┘           └──────────────────┘
```

## Features

- Generic request routing to microservices
- Service-agnostic implementation
- Authentication and authorization
- Pattern-based authentication bypass for any service
- Request ID tracking for distributed tracing
- Standardized error handling and response formatting
- Header forwarding and user claim propagation
- Special header handling for organization APIs

## Service Routing

The gateway uses a simple and generic approach for routing:

- All requests follow the `/:service/*` pattern
- The `:service` parameter identifies which backend service to route to (e.g., 'id', 'emp')
- Service configuration is defined in `services.ts` without hardcoded routes
- Authentication is applied uniformly with configurable bypass patterns

## Authentication Bypass

The gateway allows public access to specific endpoints based on service and path patterns:

- Pattern-based whitelist by service (e.g., `/api/auth/*` for 'id' service)
- Support for exact paths and regular expressions
- Environment variable configuration for each service
- Runtime configuration capabilities

## Special Headers

The gateway handles special headers for specific service scenarios:

- `Authorization`: Only forwarded to the identity service
- `X-Setup-Code`: Always preserved and forwarded to the identity service, particularly for organization API operations
- `X-Request-ID`: Generated for each request and forwarded to all services for tracing
- User claims: Forwarded as headers to non-identity services (e.g., `x-user-id`, `x-user-email`)

### Setup Code for Organization APIs

When making requests to organization endpoints with a setup code:

```http
PATCH /id/api/organizations/org-123
Content-Type: application/json
X-Setup-Code: your-setup-code-here

{
  "name": "Updated Organization Name"
}
```

The gateway ensures the `X-Setup-Code` header is preserved and forwarded to the identity service without modification.

## Headers

The gateway automatically forwards appropriate headers to backend services:

- `x-request-id`: Unique request identifier for tracing
- `Authorization`: Bearer token (only for identity service)
- User claims for authenticated requests (for non-identity services):
    - `x-user-id`, `x-user-email`, `x-user-roles`, etc.

## Standardized Response Format

All API responses follow a standardized JSON format:

```json
{
  "success": true|false,
  "timestamp": "ISO8601 date string",
  "requestId": "unique-request-id",
  "data": { /* response data */ },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional detailed error info */ }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Configuration

The gateway is designed to be configured primarily through environment variables:

```env
PORT=5001
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
LOG_LEVEL=info

# Service URLs
IDENTITY_SERVICE_URL=http://localhost:5002
EMPLOYEE_SERVICE_URL=http://localhost:5004
PERFORMANCE_SERVICE_URL=http://localhost:5003

# Error handling
SHOW_ERROR_DETAILS=false
SHOW_ERROR_STACK=false

# Public endpoints by service (comma-separated patterns, support for * wildcards)
ID_PUBLIC_ENDPOINTS=/api/custom/endpoint,/api/*/public
EMP_PUBLIC_ENDPOINTS=/health,/api/public/*
PERF_PUBLIC_ENDPOINTS=/health,/api/reports/public
```

## Adding New Services

To add a new service:

1. Add the service configuration to `src/config/services.ts`
2. Define public endpoints in environment variables (if any)
3. No other code changes needed!
