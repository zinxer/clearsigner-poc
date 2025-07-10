import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { AlchemyConfig, ContractInfo } from '@/types';

export class AlchemyService {
  private alchemy: Alchemy;
  private provider: ethers.JsonRpcProvider;

  constructor(config: AlchemyConfig) {
    const networkMap: Record<string, Network> = {
      'eth-mainnet': Network.ETH_MAINNET,
      'eth-sepolia': Network.ETH_SEPOLIA,
      'polygon-mainnet': Network.MATIC_MAINNET,
      'polygon-mumbai': Network.MATIC_MUMBAI,
    };

    this.alchemy = new Alchemy({
      apiKey: config.apiKey,
      network: networkMap[config.network] || Network.ETH_MAINNET,
    });

    this.provider = new ethers.JsonRpcProvider(
      `https://${config.network}.g.alchemy.com/v2/${config.apiKey}`
    );
  }

  /**
   * Get contract bytecode
   */
  async getContractBytecode(address: string): Promise<string> {
    try {
      return await this.provider.getCode(address);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to get bytecode for ${address}:`, error);
      throw new Error('Failed to retrieve contract bytecode');
    }
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      const code = await this.getContractBytecode(address);
      return code !== '0x';
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to check if address is contract:`, error);
      return false;
    }
  }

  /**
   * Resolve proxy contract to implementation
   */
  async resolveProxyContract(address: string): Promise<string | null> {
    try {
      // EIP-1967 implementation slot
      const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      
      const implementationAddress = await this.provider.getStorage(address, implementationSlot);
      
      if (implementationAddress && implementationAddress !== '0x' + '0'.repeat(64)) {
        // Extract address from storage (last 20 bytes)
        return '0x' + implementationAddress.slice(-40);
      }

      // Try EIP-1822 (UUPS) proxy pattern
      const uupsSlot = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';
      const uupsImplementation = await this.provider.getStorage(address, uupsSlot);
      
      if (uupsImplementation && uupsImplementation !== '0x' + '0'.repeat(64)) {
        return '0x' + uupsImplementation.slice(-40);
      }

      return null;
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to resolve proxy contract:`, error);
      return null;
    }
  }

  /**
   * Get contract metadata from Alchemy
   */
  async getContractMetadata(address: string): Promise<any> {
    try {
      return await this.alchemy.core.getContractMetadata(address);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to get contract metadata:`, error);
      return null;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash: string): Promise<any> {
    try {
      return await this.provider.getTransaction(hash);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to get transaction:`, error);
      throw new Error('Failed to retrieve transaction details');
    }
  }

  /**
   * Get block details
   */
  async getBlock(blockNumber: number | string): Promise<any> {
    try {
      return await this.provider.getBlock(blockNumber);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to get block:`, error);
      throw new Error('Failed to retrieve block details');
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to estimate gas:`, error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      console.error(`-E- ${new Date().toISOString()}: Failed to get gas price:`, error);
      throw new Error('Failed to retrieve gas price');
    }
  }

  /**
   * Get ENS name for address
   */
  async getEnsName(address: string): Promise<string | null> {
    try {
      return await this.provider.lookupAddress(address);
    } catch (error) {
      console.error(`-D- ${new Date().toISOString()}: No ENS name found for ${address}`);
      return null;
    }
  }
} 