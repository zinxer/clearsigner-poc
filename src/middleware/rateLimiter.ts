import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { validateEnv } from '@/validation/env';
import { logger } from '@/utils/logger';

const env = validateEnv();

// Custom key generator that includes IP and optionally user ID
const keyGenerator = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  // You can extend this to include user ID if you have authentication
  return `${ip}`;
};

// Custom handler for when rate limit is exceeded
const rateLimitHandler = (req: Request, res: Response): void => {
  const ip = req.ip || 'unknown';
  logger.warn('Rate limit exceeded', {
    ip,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
  });

  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    },
  });
};

// General rate limiter for most endpoints
export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later',
  onLimitReached: (req: Request) => {
    logger.warn('Rate limit reached', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });
  },
});



// Lenient rate limiter for read-only endpoints
export const readOnlyRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS * 2, // Double the normal limit
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
});

// Very strict rate limiter for health checks and status endpoints
export const healthCheckRateLimiter = rateLimit({
  windowMs: 10000, // 10 seconds
  max: 10, // 10 requests per 10 seconds
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for internal health checks
    const userAgent = req.get('User-Agent') || '';
    return userAgent.includes('kube-probe') || userAgent.includes('health-check');
  },
}); 