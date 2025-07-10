import { Address, Chain } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

// Contract analysis types
export interface ContractInfo {
  address: string;
  name?: string;
  abi?: any[];
  sourceCode?: string;
  isVerified: boolean;
  isProxy: boolean;
  implementationAddress?: string;
  protocol?: string;
}

export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  from?: string;
}



// Alchemy SDK types
export interface AlchemyConfig {
  apiKey: string;
  network: string;
}

// Database model exports
export type { Address, Chain }; 