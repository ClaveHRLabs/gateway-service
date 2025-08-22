import { createApp, logger, setupGracefulShutdown, Request, Response, HttpStatusCode } from '@vspl/core';
import { getConfig } from './config/appConfig';
import { getServices } from './config/services';
import { STATUS_CONFIGURED } from './utils/constants';
import { createAuthMiddleware } from './middleware/auth';

// Create an async function to initialize dependencies
export async function initializeDependencies() {
    const Config = await getConfig();

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