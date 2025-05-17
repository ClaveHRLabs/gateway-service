# Gateway Service

Part of the ClaveHR platform, this service acts as the API Gateway, providing a unified entry point for all client requests. It handles request routing, authentication, and request/response transformation.

## Features

- **Request ID Generation**: Automatically generates and tracks unique request IDs for all incoming requests
- **JWT Authentication**: Validates user information from JWT tokens
- **Request Validation**: Validates incoming requests using Zod schemas
- **Response Formatting**: Standardizes API responses with consistent error handling
- **Service Proxying**: Routes requests to appropriate microservices
- **Environment-based Configuration**: Configurable through environment variables
- **Comprehensive Logging**: Detailed request/response logging with Winston
- **Security**: Implements CORS, rate limiting, and security headers
- **Health Checks**: Service health monitoring endpoints

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn or npm
- Docker (optional, for containerization)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
COMPLIANCE_SERVICE_URL=http://localhost:3003
CDN_SERVICE_URL=http://localhost:3004
AI_SERVICE_URL=http://localhost:3005
BACKUP_SERVICE_URL=http://localhost:3006

# Error Handling
SHOW_ERROR_STACK=false
SHOW_ERROR_DETAILS=false
```

### Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

### Development

```bash
# Start development server
yarn dev

# Run tests
yarn test

# Run linter
yarn lint

# Format code
yarn format
```

### API Testing

The project includes a `client.http` file for testing API endpoints using VS Code's REST Client extension. Configure the following variables in your environment:

```http
@baseUrl = http://localhost:3000
@jwtToken = your_jwt_token
```

## Project Structure

```
src/
├── config/         # Configuration management
├── middleware/     # Express middleware
├── models/         # Zod schemas and types
├── services/       # Service configurations
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Error Handling

The service implements standardized error responses with the following structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}, // Optional, controlled by SHOW_ERROR_DETAILS
    "stack": "" // Optional, controlled by SHOW_ERROR_STACK
  }
}
```

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.
