import { Router } from 'express';
import { addressController } from '@/controllers/addressController';
import { asyncHandler } from '@/middleware/errorHandler';
import { readOnlyRateLimiter, generalRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// GET /api/addresses/search - Search addresses (read-only)
router.get('/search', readOnlyRateLimiter, asyncHandler(addressController.searchAddresses));

// GET /api/addresses/tags - Get all tags (read-only)
router.get('/tags', readOnlyRateLimiter, asyncHandler(addressController.getTags));

// GET /api/addresses/:address/:chainId - Get address information (read-only)
router.get('/:address/:chainId', readOnlyRateLimiter, asyncHandler(addressController.getAddress));

// POST /api/addresses - Create or update address (resource intensive)
router.post('/', generalRateLimiter, asyncHandler(addressController.createAddress));

// POST /api/addresses/:addressId/tags - Add tag to address
router.post('/:addressId/tags', generalRateLimiter, asyncHandler(addressController.addTag));

// POST /api/addresses/:addressId/labels - Add label to address
router.post('/:addressId/labels', generalRateLimiter, asyncHandler(addressController.addLabel));

// POST /api/addresses/:addressId/metadata - Add metadata to address
router.post('/:addressId/metadata', generalRateLimiter, asyncHandler(addressController.addMetadata));

export default router; 