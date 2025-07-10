import axios from 'axios';
import { prisma } from '@/prisma/client';
import { AlchemyService } from './alchemyService';
import { ContractInfo } from '@/types';
import { logger } from '@/utils/logger';

export class ContractService {
  constructor(
    private alchemyService: AlchemyService,
    private etherscanApiKey: string
  ) {}

  /**
   * Get contract information with caching
   */
  async getContractInfo(address: string): Promise<ContractInfo> {
    try {
      // Check if contract exists in database
      let contract = await prisma.address.findFirst({
        where: { 
          address: address.toLowerCase(),
          isContract: true
        }
      });

      if (contract) {
        logger.info(`Found cached contract info for ${address}`);
        return this.mapContractToInfo(contract);
      }

      logger.info(`Fetching contract info for ${address}`);

      // Check if it's a contract
      const isContract = await this.alchemyService.isContract(address);
      if (!isContract) {
        throw new Error('Address is not a contract');
      }

      // Check if it's a proxy
      const implementationAddress = await this.alchemyService.resolveProxyContract(address);
      const isProxy = !!implementationAddress;

      // Get contract details from Etherscan
      const etherscanData = await this.getEtherscanContractData(address);
      
      // Create or update contract in database
      contract = await prisma.address.upsert({
        where: { 
          address_chainId: {
            address: address.toLowerCase(),
            chainId: 1 // Default to Ethereum mainnet for now
          }
        },
        update: {
          contractName: etherscanData.name ?? null,
          isProxy,
          currentImplementation: implementationAddress?.toLowerCase() ?? null,
          abi: etherscanData.abi ?? null,
          isVerified: etherscanData.isVerified,
          isContract: true,
          updatedAt: new Date(),
        },
        create: {
          address: address.toLowerCase(),
          chainId: 1, // Default to Ethereum mainnet for now
          contractName: etherscanData.name ?? null,
          isProxy,
          currentImplementation: implementationAddress?.toLowerCase() ?? null,
          abi: etherscanData.abi ?? null,
          isVerified: etherscanData.isVerified,
          isContract: true,
        },
      });

      return this.mapContractToInfo(contract);
    } catch (error) {
      logger.error(`Failed to get contract info for ${address}`, { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get contract data from Etherscan API
   */
  private async getEtherscanContractData(address: string): Promise<{
    name?: string;
    abi?: any[];
    sourceCode?: string;
    isVerified: boolean;
  }> {
    try {
      // Get contract source code
      const sourceResponse = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey: this.etherscanApiKey,
        },
      });

      if (sourceResponse.data.status === '1' && sourceResponse.data.result.length > 0) {
        const result = sourceResponse.data.result[0];
        
        if (result.SourceCode && result.SourceCode !== '') {
          return {
            name: result.ContractName,
            abi: result.ABI ? JSON.parse(result.ABI) : undefined,
            sourceCode: result.SourceCode,
            isVerified: true,
          };
        }
      }

      logger.warn(`Contract ${address} is not verified on Etherscan`);
      return { isVerified: false };
    } catch (error) {
      logger.error('Failed to fetch Etherscan data', { error: (error as Error).message, address });
      return { isVerified: false };
    }
  }



  /**
   * Helper methods
   */
  private mapContractToInfo(contract: any): ContractInfo {
    return {
      address: contract.address,
      name: contract.name,
      abi: contract.abi,
      sourceCode: contract.sourceCode,
      isVerified: contract.isVerified,
      isProxy: contract.isProxy,
      implementationAddress: contract.implementationAddress,
      protocol: contract.protocol,
    };
  }



  private getFunctionSelector(func: any): string {
    // This is a simplified implementation
    // In practice, you'd use ethers.js utils to compute the selector
    return '0x' + func.name; // Placeholder
  }


} 