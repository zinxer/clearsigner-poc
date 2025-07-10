import { Router } from 'express';
import { contractController } from '@/controllers/contractController';
import { asyncHandler } from '@/middleware/errorHandler';
import { readOnlyRateLimiter, generalRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// GET /api/contracts/:address - Get contract information (read-only)
router.get('/:address', readOnlyRateLimiter, asyncHandler(contractController.getContractInfo));

// GET /api/contracts/:address/metadata - Get contract metadata (read-only)
router.get('/:address/metadata', readOnlyRateLimiter, asyncHandler(contractController.getContractMetadata));

// POST /api/contracts/verify - Verify contract status (resource intensive)
router.post('/verify', generalRateLimiter, asyncHandler(contractController.verifyContract));

export default router; 