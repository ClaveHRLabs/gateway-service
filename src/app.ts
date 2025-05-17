import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxy from 'express-http-proxy';
import { requestIdMiddleware } from './middleware/requestId';
import { authMiddleware } from './middleware/auth';
import { requestValidationMiddleware } from './middleware/validation';
import { responseInterceptor, errorHandler } from './middleware/response';
import { services, isServiceConfigured, getServiceConfig } from './config/services';
import { logger } from './utils/logger';
import { AuthenticatedRequest } from './types/request';
import { Config } from './config/config';
import axios from 'axios';
import identityRoutes from './routes/identity.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(responseInterceptor);

// Use custom routes for identity service
app.use('/api/auth', identityRoutes);

// Proxy middleware to forward user claims and request ID
const proxyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;

    // Forward request ID for idempotency
    req.headers['x-request-id'] = authenticatedReq.requestId;

    if (authenticatedReq.user) {
        // Basic user information
        req.headers['x-user-id'] = authenticatedReq.user.id;
        req.headers['x-user-email'] = authenticatedReq.user.email;
        req.headers['x-user-roles'] = authenticatedReq.user.roles.join(',');
        req.headers['x-organization-id'] = authenticatedReq.user.organizationId;

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
    const servicePath = req.path.split('/')[1]; // Get the first path segment
    const serviceName = `${servicePath}-service`;

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
    app.use(
        service.path,
        authMiddleware,
        requestValidationMiddleware,
        serviceAvailabilityMiddleware,
        proxyMiddleware,
        proxy(service.url, {
            proxyReqPathResolver: (req) => {
                return `${service.path}${req.url}`;
            },
            proxyErrorHandler: (err, res, next) => {
                logger.error(`Proxy error for ${service.name}:`, err);
                res.status(503).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    requestId: (res.req as AuthenticatedRequest).requestId,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: `${service.name} is currently unavailable`,
                        details: Config.SHOW_ERROR_DETAILS ? err.message : 'Please try again later',
                        stack: Config.SHOW_ERROR_STACK ? err.stack : undefined
                    }
                });
            },
        })
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