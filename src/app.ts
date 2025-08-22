import { initializeDependencies } from './dependencies';
import { proxyMiddleware } from './middleware/proxy';
import { logger } from '@vspl/core';

async function startServer() {
    try {
        // Initialize dependencies with async config loading
        const { app, logger, Config } = await initializeDependencies();

        // Mount proxy routing for all services using pattern /:service/*
        app.use('/:service', proxyMiddleware);

        // Start server using validated config
        const port = Config.PORT;
        app.listen(port, () => {
            logger.debug(`${Config.SERVICE_NAME} running @ ${Config.HOST}:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

// Start the server
startServer();
