import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from './middleware/requestId';
import { authMiddleware } from './middleware/auth';
import { proxyMiddleware } from './middleware/proxy';
import { errorHandler } from './middleware/response';
import { services } from './config/services';
import { logger } from './utils/logger';
import { AuthenticatedRequest } from './types/request';
import { Config } from './config/config';

const app = express();

// Middleware for all requests
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-setup-code', 'x-skip-auth', 'x-request-id'],
}));

// Only parse JSON and URL-encoded bodies when not multipart/form-data
app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Skip body parsing for multipart/form-data requests
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Skip body parsing for multipart/form-data requests
        next();
    } else {
        express.urlencoded({ extended: true })(req, res, next);
    }
});

app.use(requestIdMiddleware);

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

// Service routing - a unified approach for all services
// The pattern is /:service/* where :service is the service identifier (e.g. 'id', 'emp')
app.use('/:service',
    authMiddleware,      // Handle authentication and whitelisting 
    proxyMiddleware      // Forward requests to appropriate service
);

// Error handling
app.use(errorHandler);

// Start the server
const PORT = Config.PORT;
app.listen(PORT, () => {
    logger.info(`Gateway service listening on port ${PORT}`);
    logger.info(`Configured services: ${services.map(s => s.name).join(', ')}`);
}); 