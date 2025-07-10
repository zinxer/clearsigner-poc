import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3001'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  ALCHEMY_API_KEY: z.string().min(1, 'Alchemy API key is required'),
  ALCHEMY_NETWORK: z.enum(['eth-mainnet', 'eth-sepolia', 'polygon-mainnet', 'polygon-mumbai']).default('eth-mainnet'),
  ETHERSCAN_API_KEY: z.string().min(1, 'Etherscan API key is required'),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DEBUG: z.string().transform((val) => val.toLowerCase() === 'true').default('false'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnv(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
} 