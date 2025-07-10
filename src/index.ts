import 'dotenv/config';
import { createApp } from './app';
import { validateEnv } from '@/validation/env';
import { logger } from '@/utils/logger';

async function startServer() {
  try {
    const env = validateEnv();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 tx-clearsigner backend is running on port ${env.PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Alchemy Network: ${env.ALCHEMY_NETWORK}`);
      logger.info(`📊 Health check: http://localhost:${env.PORT}/health`);
      logger.debug(`💫 Debug logging enabled: ${env.DEBUG}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer(); 