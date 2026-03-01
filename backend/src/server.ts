import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

async function startServer() {
    try {
        // Check DB connection
        await prisma.$connect();
        logger.info('Connected to Database successfully');

        const port = env.PORT || 3000;
        app.listen(port, () => {
            logger.info(`Server is running on port ${port} in ${env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
