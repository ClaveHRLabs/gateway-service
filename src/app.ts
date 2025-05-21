import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxy from 'express-http-proxy';
import { requestIdMiddleware } from './middleware/requestId';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/response';
import { services, isServiceConfigured, getServiceConfig } from './config/services';
import { logger } from './utils/logger';
import { AuthenticatedRequest } from './types/request';
import { Config } from './config/config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Proxy middleware to forward user claims and request ID
const proxyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const pathParts = req.originalUrl.split('/');
    const servicePrefix = pathParts[1] || '';
    const isIdentityService = servicePrefix === 'id';

    // Forward request ID for idempotency
    req.headers['x-request-id'] = authenticatedReq.requestId;

    // Forward Bearer token only to identity service
    if (isIdentityService && req.headers.authorization) {
        // Keep the Authorization header as is for identity service
    } else {
        // Remove Authorization header for other services
        delete req.headers.authorization;
    }

    if (authenticatedReq.user && !isIdentityService) {
        // Basic user information
        req.headers['x-user-id'] = authenticatedReq.user.id;
        req.headers['x-user-email'] = authenticatedReq.user.email;
        req.headers['x-user-roles'] = authenticatedReq.user.roles.join(',');
        if (authenticatedReq.user.organizationId) {
            req.headers['x-organization-id'] = authenticatedReq.user.organizationId;
        }

        // Additional user claims
        if (authenticatedReq.user.firstName) req.headers['x-user-first-name'] = authenticatedReq.user.firstName;
        if (authenticatedReq.user.lastName) req.headers['x-user-last-name'] = authenticatedReq.user.lastName;
        if (authenticatedReq.user.department) req.headers['x-user-department'] = authenticatedReq.user.department;
        if (authenticatedReq.user.position) req.headers['x-user-position'] = authenticatedReq.user.position;
        if (authenticatedReq.user.permissions) req.headers['x-user-permissions'] = authenticatedReq.user.permissions.join(',');
        if (authenticatedReq.user.tenantId) req.headers['x-tenant-id'] = authenticatedReq.user.tenantId;
        if (authenticatedReq.user.locale) req.headers['x-user-locale'] = authenticatedReq.user.locale;
        if (authenticatedReq.user.timezone) req.headers['x-user-timezone'] = authenticatedReq.user.timezone;
        if (authenticatedReq.user.lastLogin) req.headers['x-user-last-login'] = authenticatedReq.user.lastLogin;
        if (authenticatedReq.user.isActive !== undefined) req.headers['x-user-is-active'] = String(authenticatedReq.user.isActive);

        // Forward metadata as JSON if present
        if (authenticatedReq.user.metadata) {
            req.headers['x-user-metadata'] = JSON.stringify(authenticatedReq.user.metadata);
        }
    }
    next();
};

// Service availability check middleware
const serviceAvailabilityMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pathParts = req.originalUrl.split('/');
    const servicePrefix = pathParts[1] || '';
    const serviceName = `${servicePrefix}-service`;

    if (!isServiceConfigured(serviceName)) {
        return res.status(503).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'SERVICE_NOT_CONFIGURED',
                message: `Service ${serviceName} is not configured`,
                details: 'Please check the service configuration and try again later'
            }
        });
    }

    const serviceConfig = getServiceConfig(serviceName);
    if (!serviceConfig?.methods.includes(req.method)) {
        return res.status(405).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: `Method ${req.method} not allowed for ${serviceName}`,
                details: `Allowed methods: ${serviceConfig?.methods.join(', ')}`
            }
        });
    }

    next();
};

// Setup routes for each service
services.forEach((service) => {
    // Extract service identifier from service name (e.g., 'emp' from 'emp-service')
    const serviceIdentifier = service.name.split('-')[0];
    const path = `/${serviceIdentifier}`;

    app.use(
        path,
        authMiddleware,
        serviceAvailabilityMiddleware,
        proxyMiddleware,
        (proxy(service.url, {
            proxyReqPathResolver: (req) => {
                return `${req.url}`;
            },
            proxyErrorHandler: (err, res, next) => {
                logger.error(`Proxy error for ${service.name}:`, err);
                res.status(503).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    requestId: ((res.req as any) as AuthenticatedRequest).requestId,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: `${service.name} is currently unavailable`,
                        details: Config.SHOW_ERROR_DETAILS ? err.message : 'Please try again later',
                        stack: Config.SHOW_ERROR_STACK ? err.stack : undefined
                    }
                });
            },
        }) as any)
    );
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        requestId: (req as AuthenticatedRequest).requestId,
        data: {
            status: 'ok',
            services: services.map(service => ({
                name: service.name,
                status: 'configured'
            }))
        }
    });
});

// Error handling
app.use(errorHandler);

const PORT = Config.PORT;

app.listen(PORT, () => {
    logger.info(`Gateway service listening on port ${PORT}`);
}); 