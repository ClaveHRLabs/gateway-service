# Gateway Service

A microservices API gateway that handles authentication, request routing, and service discovery.

## Features

- Request routing to microservices
- Authentication and authorization
- Request ID tracking for distributed tracing
- Rate limiting
- Service health monitoring
- Error handling and response formatting

## Service Configuration

The gateway automatically routes requests based on the service name prefix:

- `/id/*` - Identity Service
- `/emp/*` - Employee Service
- `/perf/*` - Performance Service

## Authentication

- Bearer tokens are only forwarded to the Identity Service
- Other services receive user claims via custom headers
- All services receive the request ID for tracing

## Headers

The gateway adds the following headers to requests:

- `x-request-id`: Unique request identifier
- `x-user-id`: User's ID
- `x-user-email`: User's email
- `x-user-roles`: User's roles (comma-separated)
- `x-organization-id`: User's organization ID (if available)
- Additional user claims as needed

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Environment Variables

```env
PORT=5001
IDENTITY_SERVICE_URL=http://localhost:5002
EMPLOYEE_SERVICE_URL=http://localhost:5004
PERFORMANCE_SERVICE_URL=http://localhost:5003
```

## API Testing

Use the `client.http` file in the `test` directory to test the API endpoints.
