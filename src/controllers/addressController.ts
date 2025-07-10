import { Request, Response } from 'express';
import { z } from 'zod';
import { AddressService } from '@/services/addressService';
import { logger } from '@/utils/logger';

const addressService = new AddressService();

// Validation schemas
const createAddressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  chainId: z.number().positive(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().min(0).max(18).optional(),
  isContract: z.boolean().optional(),
  isToken: z.boolean().optional(),
  isProxy: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  tokenStandard: z.string().optional(),
  abi: z.any().optional(),
});

const addTagSchema = z.object({
  tagName: z.string().min(1).max(50),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

const addLabelSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isPrivate: z.boolean().optional(),
});

const addMetadataSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  category: z.string().optional(),
  source: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const searchSchema = z.object({
  chainId: z.coerce.number().optional(),
  isContract: z.coerce.boolean().optional(),
  isToken: z.coerce.boolean().optional(),
  isProxy: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  tokenStandard: z.string().optional(),
  protocolId: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

class AddressController {
  /**
   * GET /api/addresses/:address/:chainId - Get address information
   */
  async getAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address, chainId } = req.params;
      const parsedChainId = parseInt(chainId, 10);

      if (!address || isNaN(parsedChainId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid address or chain ID',
            statusCode: 400,
          },
        });
        return;
      }

      const addressData = await addressService.getAddress(address, parsedChainId);

      if (!addressData) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Address not found',
            statusCode: 404,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: addressData,
      });
    } catch (error) {
      logger.error('Failed to get address', {
        error: (error as Error).message,
        address: req.params.address,
        chainId: req.params.chainId,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * POST /api/addresses - Create or update address
   */
  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createAddressSchema.parse(req.body);
      const address = await addressService.createOrUpdateAddress(validatedData);

      res.status(201).json({
        success: true,
        data: address,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
            statusCode: 400,
          },
        });
        return;
      }

      logger.error('Failed to create address', {
        error: (error as Error).message,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * POST /api/addresses/:addressId/tags - Add tag to address
   */
  async addTag(req: Request, res: Response): Promise<void> {
    try {
      const { addressId } = req.params;
      const validatedData = addTagSchema.parse(req.body);

      await addressService.addTag(addressId, validatedData);

      res.json({
        success: true,
        message: 'Tag added successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
            statusCode: 400,
          },
        });
        return;
      }

      logger.error('Failed to add tag', {
        error: (error as Error).message,
        addressId: req.params.addressId,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * POST /api/addresses/:addressId/labels - Add label to address
   */
  async addLabel(req: Request, res: Response): Promise<void> {
    try {
      const { addressId } = req.params;
      const validatedData = addLabelSchema.parse(req.body);

      const label = await addressService.addLabel(addressId, validatedData);

      res.status(201).json({
        success: true,
        data: label,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
            statusCode: 400,
          },
        });
        return;
      }

      logger.error('Failed to add label', {
        error: (error as Error).message,
        addressId: req.params.addressId,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * POST /api/addresses/:addressId/metadata - Add metadata to address
   */
  async addMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { addressId } = req.params;
      const validatedData = addMetadataSchema.parse(req.body);

      const metadata = await addressService.addMetadata(addressId, validatedData);

      res.status(201).json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
            statusCode: 400,
          },
        });
        return;
      }

      logger.error('Failed to add metadata', {
        error: (error as Error).message,
        addressId: req.params.addressId,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * GET /api/addresses/search - Search addresses
   */
  async searchAddresses(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = searchSchema.parse(req.query);
      const { page, limit, ...filters } = validatedQuery;

      const result = await addressService.searchAddresses(filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
            statusCode: 400,
          },
        });
        return;
      }

      logger.error('Failed to search addresses', {
        error: (error as Error).message,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * GET /api/addresses/tags - Get all tags
   */
  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await addressService.getTags();

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      logger.error('Failed to get tags', {
        error: (error as Error).message,
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }
}

export const addressController = new AddressController(); 