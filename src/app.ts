import { initializeDependencies } from './dependencies';
import { proxyMiddleware } from './middleware/proxy';

async function startServer() {
    try {
        // Initialize dependencies with async config loading
        const { app, logger, Config } = await initializeDependencies();

        // Mount proxy routing for all services using pattern /:service/*
        app.use('/:service', proxyMiddleware);

        // Start server using validated config
        const port = Config.PORT;
        app.listen(port, () => {
            logger.info(`Gateway listening on ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
