import { createApp, createLogger, setupGracefulShutdown, Request, Response, HttpStatusCode } from '@vspl/core';
import { getConfig } from './config/appConfig';
import { getServices } from './config/services';
import { STATUS_CONFIGURED } from './utils/constants';
import { createAuthMiddleware } from './middleware/auth';

// Create an async function to initialize dependencies
export async function initializeDependencies() {
    const Config = await getConfig();

    const logger = createLogger({ service: Config.SERVICE_NAME });

    const app = createApp({
        name: Config.SERVICE_NAME,
        errorHandlerOptions: { includeStackTrace: Config.SHOW_ERROR_STACK },
    });

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