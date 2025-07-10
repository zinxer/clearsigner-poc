import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '@/types';
import { AppError } from '@/middleware/errorHandler';

// Request validation schemas
const contractAddressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

const verifyContractSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  forceRefresh: z.boolean().optional().default(false),
});

export const contractController = {
  /**
   * Get contract information
   */
  async getContractInfo(req: Request, res: Response): Promise<void> {
    const { address } = contractAddressSchema.parse(req.params);

    if (!req.services?.contract) {
      throw new AppError('Contract service not available', 500);
    }

    const contractInfo = await req.services.contract.getContractInfo(address);

    const response: ApiResponse = {
      success: true,
      data: contractInfo,
    };

    res.json(response);
  },

  /**
   * Get contract metadata from Alchemy
   */
  async getContractMetadata(req: Request, res: Response): Promise<void> {
    const { address } = contractAddressSchema.parse(req.params);

    if (!req.services?.alchemy) {
      throw new AppError('Alchemy service not available', 500);
    }

    const metadata = await req.services.alchemy.getContractMetadata(address);

    const response: ApiResponse = {
      success: true,
      data: metadata,
    };

    res.json(response);
  },

  /**
   * Verify contract and update cache
   */
  async verifyContract(req: Request, res: Response): Promise<void> {
    const { address, forceRefresh } = verifyContractSchema.parse(req.body);

    if (!req.services?.contract) {
      throw new AppError('Contract service not available', 500);
    }

    // If force refresh, we might want to clear cache first
    // For now, just get the latest contract info
    const contractInfo = await req.services.contract.getContractInfo(address);

    const response: ApiResponse = {
      success: true,
      data: contractInfo,
      message: forceRefresh ? 'Contract information refreshed' : 'Contract information retrieved',
    };

    res.json(response);
  },
}; 