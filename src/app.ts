import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { validateEnv } from '@/validation/env';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { AlchemyService } from '@/services/alchemyService';
import { ContractService } from '@/services/contractService';
import { logger } from '@/utils/logger';
import { generalRateLimiter, readOnlyRateLimiter, healthCheckRateLimiter } from '@/middleware/rateLimiter';

// Import routes
import contractRoutes from '@/routes/contractRoutes';
import addressRoutes from '@/routes/addressRoutes';

export function createApp() {
  const app = express();
  const env = validateEnv();

  // Initialize services
  const alchemyService = new AlchemyService({
    apiKey: env.ALCHEMY_API_KEY,
    network: env.ALCHEMY_NETWORK,
  });

  const contractService = new ContractService(alchemyService, env.ETHERSCAN_API_KEY);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN || true,
    credentials: true,
  }));

  // Rate limiting
  app.use(generalRateLimiter);

  // Logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check with specific rate limiting
  app.get('/health', healthCheckRateLimiter, (req, res) => {
    res.json({
      success: true,
      message: 'tx-clearsigner backend is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Add services to request object
  app.use((req, res, next) => {
    req.services = {
      alchemy: alchemyService,
      contract: contractService,
    };
    next();
  });

  // API routes
  app.use('/api/contracts', contractRoutes);
  app.use('/api/addresses', addressRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
} 