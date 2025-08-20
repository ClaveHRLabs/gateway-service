import { createApp, createLogger, setupGracefulShutdown, Request, Response, HttpStatusCode } from '@vspl/core';
import { getConfig } from './config/appConfig';
import { getServices } from './config/services';
import { STATUS_CONFIGURED } from './utils/constants';
import { createAuthMiddleware } from './middleware/auth';
import { createResponseInterceptor, createErrorHandler } from './middleware/response';

// Create an async function to initialize dependencies
export async function initializeDependencies() {
    const Config = await getConfig();

    // Runtime security guard: ensure a proper JWT secret in production
    if ((process.env.NODE_ENV === 'production') && Config.JWT_SECRET === 'dev-insecure-secret-change-me') {
        // Fail fast to prevent running with insecure secret
        throw new Error('Insecure default JWT_SECRET used in production. Set a strong JWT_SECRET env variable.');
    }

    const logger = createLogger({ service: Config.SERVICE_NAME });

    const app = createApp({
        name: Config.SERVICE_NAME,
        errorHandlerOptions: { includeStackTrace: Config.SHOW_ERROR_STACK },
    });

    // Apply middleware that depends on config
    app.use(createResponseInterceptor(Config));
    app.use(createAuthMiddleware(Config));

    app.get('/services/health', async (req: Request, res: Response) => {
        const services = await getServices();
        res.status(HttpStatusCode.OK).json({
            success: true,
            timestamp: new Date().toISOString(),
            service: Config.SERVICE_NAME,
            services: services.map(s => ({ name: s.name, status: STATUS_CONFIGURED })),
        });
    });

    // Apply error handler middleware last
    app.use(createErrorHandler(Config));

    setupGracefulShutdown([
        async () => {
            logger.info('Gateway shutting down. Cleaning up resources...');
        }
    ]);

    return { app, logger, Config };
}

// For backward compatibility - create a singleton pattern
let globalDependencies: Awaited<ReturnType<typeof initializeDependencies>> | null = null;

export async function getDependencies() {
    globalDependencies ??= await initializeDependencies();
    return globalDependencies;
}

// Export individual getters that throw if not initialized
export async function getApp() {
    const deps = await getDependencies();
    return deps.app;
}

export async function getLogger() {
    const deps = await getDependencies();
    return deps.logger;
}

export async function getConfigSync() {
    const deps = await getDependencies();
    return deps.Config;
}