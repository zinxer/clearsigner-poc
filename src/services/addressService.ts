import { prisma } from '@/prisma/client';
import { logger } from '@/utils/logger';
import { 
  Address, 
  CreateAddressRequest, 
  UpdateAddressRequest,
  AddLabelRequest,
  AddAttributeRequest,
  AddProxyHistoryRequest,
  AddMetadataRequest,
  UpdateAttributesRequest,
  AddressSearchFilters,
  AddressSearchResult,
  AddressLabel,
  AddressAttribute,
  AddressMetadata,
  ProxyHistory,
  SourceCode,
  ChainId,
  LabelType,
  AttributeKey
} from '@/types/address';

export class AddressService {
  
  /**
   * Create or update an address
   */
  async createOrUpdateAddress(data: CreateAddressRequest): Promise<Address> {
    try {
      logger.serviceCall('AddressService', 'createOrUpdateAddress', { 
        address: data.address, 
        chainId: data.chainId 
      });

      // Check if address already exists on this chain
      const existing = await prisma.address.findUnique({
        where: {
          address_chainId: {
            address: data.address.toLowerCase(),
            chainId: data.chainId
          }
        },
        include: {
          chain: true,
          attributes: true,
          labels: true,
          sourceCode: true,
          metadata: true,
          proxyHistory: { orderBy: { timestamp: 'desc' } },
          protocol: true
        }
      });

      if (existing) {
        // Update existing address
        const updated = await prisma.address.update({
          where: { id: existing.id },
          data: {
            contractName: data.contractName ?? existing.contractName,
            displayName: data.displayName ?? existing.displayName,
            symbol: data.symbol ?? existing.symbol,
            decimals: data.decimals ?? existing.decimals,
            isContract: data.isContract ?? existing.isContract,
            isToken: data.isToken ?? existing.isToken,
            isProxy: data.isProxy ?? existing.isProxy,
            isVerified: data.isVerified ?? existing.isVerified,
            currentImplementation: data.currentImplementation ?? existing.currentImplementation,
            proxyType: data.proxyType ?? existing.proxyType,
            tokenStandard: data.tokenStandard ?? existing.tokenStandard,
            tokenImageUrl: data.tokenImageUrl ?? existing.tokenImageUrl,
            abi: data.abi ?? existing.abi,
            lastSeenAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            chain: true,
            attributes: true,
            labels: true,
            sourceCode: true,
            metadata: true,
            proxyHistory: { orderBy: { timestamp: 'desc' } },
            protocol: true
          }
        });

        logger.info('Address updated successfully', { 
          addressId: updated.id,
          address: updated.address,
          chainId: updated.chainId
        });

        return updated as Address;
      } else {
        // Create new address
        const created = await prisma.address.create({
          data: {
            address: data.address.toLowerCase(),
            chainId: data.chainId,
            contractName: data.contractName,
            displayName: data.displayName,
            symbol: data.symbol,
            decimals: data.decimals,
            isContract: data.isContract ?? false,
            isToken: data.isToken ?? false,
            isProxy: data.isProxy ?? false,
            isVerified: data.isVerified ?? false,
            currentImplementation: data.currentImplementation,
            proxyType: data.proxyType,
            tokenStandard: data.tokenStandard,
            tokenImageUrl: data.tokenImageUrl,
            abi: data.abi,
            firstSeenAt: new Date(),
            lastSeenAt: new Date()
          },
          include: {
            chain: true,
            attributes: true,
            labels: true,
            sourceCode: true,
            metadata: true,
            proxyHistory: { orderBy: { timestamp: 'desc' } },
            protocol: true
          }
        });

        // If it's a proxy, create initial proxy history entry
        if (data.isProxy && data.currentImplementation) {
          await this.addProxyHistory(created.id, {
            implementation: data.currentImplementation,
            timestamp: new Date(),
            changeType: 'deployed',
            source: 'initial'
          });
        }

        logger.info('Address created successfully', { 
          addressId: created.id,
          address: created.address,
          chainId: created.chainId
        });

        return created as Address;
      }
    } catch (error) {
      logger.error('Failed to create/update address', { 
        error: (error as Error).message,
        address: data.address,
        chainId: data.chainId
      });
      throw error;
    }
  }

  /**
   * Get address by address and chain ID
   */
  async getAddress(address: string, chainId: number): Promise<Address | null> {
    try {
      const result = await prisma.address.findUnique({
        where: {
          address_chainId: {
            address: address.toLowerCase(),
            chainId
          }
        },
        include: {
          chain: true,
          attributes: true,
          labels: true,
          sourceCode: true,
          metadata: true,
          proxyHistory: { orderBy: { timestamp: 'desc' } },
          protocol: true
        }
      });

      return result as Address | null;
    } catch (error) {
      logger.error('Failed to get address', { 
        error: (error as Error).message,
        address,
        chainId
      });
      throw error;
    }
  }

  /**
   * Add or update address attribute
   */
  async addAttribute(addressId: string, attributeData: AddAttributeRequest): Promise<AddressAttribute> {
    try {
      const attribute = await prisma.addressAttribute.upsert({
        where: {
          addressId_key: {
            addressId,
            key: attributeData.key
          }
        },
        create: {
          addressId,
          key: attributeData.key,
          value: attributeData.value,
          category: attributeData.category,
          confidence: attributeData.confidence ?? 1.0,
          source: attributeData.source ?? 'manual',
          addedBy: 'system' // TODO: Get from auth context
        },
        update: {
          value: attributeData.value,
          category: attributeData.category,
          confidence: attributeData.confidence ?? 1.0,
          source: attributeData.source ?? 'manual',
          updatedAt: new Date()
        }
      });

      logger.debug('Attribute added to address', { 
        addressId, 
        key: attributeData.key, 
        value: attributeData.value 
      });
      
      return attribute as AddressAttribute;
    } catch (error) {
      logger.error('Failed to add attribute', { 
        error: (error as Error).message,
        addressId,
        key: attributeData.key
      });
      throw error;
    }
  }

  /**
   * Update multiple attributes at once
   */
  async updateAttributes(addressId: string, attributesData: UpdateAttributesRequest): Promise<void> {
    try {
      // Use transaction to ensure all attributes are updated together
      await prisma.$transaction(async (tx: any) => {
        for (const attr of attributesData.attributes) {
          await tx.addressAttribute.upsert({
            where: {
              addressId_key: {
                addressId,
                key: attr.key
              }
            },
            create: {
              addressId,
              key: attr.key,
              value: attr.value,
              category: attr.category,
              confidence: attr.confidence ?? 1.0,
              source: attr.source ?? 'manual',
              addedBy: 'system'
            },
            update: {
              value: attr.value,
              category: attr.category,
              confidence: attr.confidence ?? 1.0,
              source: attr.source ?? 'manual',
              updatedAt: new Date()
            }
          });
        }
      });

      logger.debug('Multiple attributes updated', { 
        addressId, 
        count: attributesData.attributes.length 
      });
    } catch (error) {
      logger.error('Failed to update attributes', { 
        error: (error as Error).message,
        addressId
      });
      throw error;
    }
  }

  /**
   * Add label to address
   */
  async addLabel(addressId: string, labelData: AddLabelRequest): Promise<AddressLabel> {
    try {
      const label = await prisma.addressLabel.create({
        data: {
          addressId,
          name: labelData.name,
          description: labelData.description,
          type: labelData.type ?? LabelType.USER,
          category: labelData.category,
          color: labelData.color,
          icon: labelData.icon,
          isPublic: labelData.isPublic ?? false,
          isPinned: labelData.isPinned ?? false,
          confidence: labelData.confidence,
          source: labelData.source ?? 'manual',
          addedBy: 'system' // TODO: Get from auth context
        }
      });

      logger.debug('Label added to address', { addressId, name: labelData.name });
      return label as AddressLabel;
    } catch (error) {
      logger.error('Failed to add label', { 
        error: (error as Error).message,
        addressId,
        name: labelData.name
      });
      throw error;
    }
  }

  /**
   * Add proxy history entry
   */
  async addProxyHistory(addressId: string, historyData: AddProxyHistoryRequest): Promise<ProxyHistory> {
    try {
      const history = await prisma.proxyHistory.create({
        data: {
          addressId,
          implementation: historyData.implementation,
          blockNumber: historyData.blockNumber,
          transactionHash: historyData.transactionHash,
          timestamp: historyData.timestamp ?? new Date(),
          isDirectImplementation: historyData.isDirectImplementation ?? true,
          depth: historyData.depth ?? 0,
          changeType: historyData.changeType,
          previousImpl: historyData.previousImpl,
          source: historyData.source ?? 'manual',
          addedBy: 'system' // TODO: Get from auth context
        }
      });

      // Update the current implementation in the address
      if (historyData.isDirectImplementation !== false) {
        await prisma.address.update({
          where: { id: addressId },
          data: { currentImplementation: historyData.implementation }
        });
      }

      logger.debug('Proxy history added', { 
        addressId, 
        implementation: historyData.implementation,
        changeType: historyData.changeType
      });
      
      return history as ProxyHistory;
    } catch (error) {
      logger.error('Failed to add proxy history', { 
        error: (error as Error).message,
        addressId,
        implementation: historyData.implementation
      });
      throw error;
    }
  }

  /**
   * Add metadata to address
   */
  async addMetadata(addressId: string, metadataData: AddMetadataRequest): Promise<AddressMetadata> {
    try {
      const metadata = await prisma.addressMetadata.upsert({
        where: {
          addressId_key: {
            addressId,
            key: metadataData.key
          }
        },
        create: {
          addressId,
          key: metadataData.key,
          value: metadataData.value,
          category: metadataData.category,
          source: metadataData.source
        },
        update: {
          value: metadataData.value,
          category: metadataData.category,
          source: metadataData.source,
          updatedAt: new Date()
        }
      });

      logger.debug('Metadata added to address', { addressId, key: metadataData.key });
      return metadata as AddressMetadata;
    } catch (error) {
      logger.error('Failed to add metadata', { 
        error: (error as Error).message,
        addressId,
        key: metadataData.key
      });
      throw error;
    }
  }

  /**
   * Add source code to address
   */
  async addSourceCode(addressId: string, sourceCodeData: {
    language: string;
    sourceCode: string;
    fileName?: string;
    isVerified?: boolean;
    verifiedOn?: string;
    verificationDate?: Date;
    compilerVersion?: string;
    optimization?: boolean;
    contractName?: string;
  }): Promise<SourceCode> {
    try {
      const sourceCode = await prisma.sourceCode.create({
        data: {
          addressId,
          ...sourceCodeData
        }
      });

      // Update address verification status and contract name
      const updateData: any = {};
      if (sourceCodeData.isVerified) {
        updateData.isVerified = true;
      }
      if (sourceCodeData.contractName) {
        updateData.contractName = sourceCodeData.contractName;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.address.update({
          where: { id: addressId },
          data: updateData
        });
      }

      logger.debug('Source code added to address', { 
        addressId, 
        language: sourceCodeData.language,
        isVerified: sourceCodeData.isVerified
      });
      
      return sourceCode as SourceCode;
    } catch (error) {
      logger.error('Failed to add source code', { 
        error: (error as Error).message,
        addressId
      });
      throw error;
    }
  }

  /**
   * Search addresses with filters
   */
  async searchAddresses(
    filters: AddressSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<AddressSearchResult> {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = {};

      if (filters.chainId) where.chainId = filters.chainId;
      if (filters.isContract !== undefined) where.isContract = filters.isContract;
      if (filters.isToken !== undefined) where.isToken = filters.isToken;
      if (filters.isProxy !== undefined) where.isProxy = filters.isProxy;
      if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
      if (filters.tokenStandard) where.tokenStandard = filters.tokenStandard;
      if (filters.protocolId) where.protocolId = filters.protocolId;

      if (filters.riskLevel) {
        where.riskLevel = {};
        if (filters.riskLevel.min !== undefined) where.riskLevel.gte = filters.riskLevel.min;
        if (filters.riskLevel.max !== undefined) where.riskLevel.lte = filters.riskLevel.max;
      }

      if (filters.labels && filters.labels.length > 0) {
        where.labels = {
          some: {
            name: { in: filters.labels }
          }
        };
      }

      if (filters.labelTypes && filters.labelTypes.length > 0) {
        where.labels = {
          ...where.labels,
          some: {
            ...where.labels?.some,
            type: { in: filters.labelTypes }
          }
        };
      }

      if (filters.labelCategories && filters.labelCategories.length > 0) {
        where.labels = {
          ...where.labels,
          some: {
            ...where.labels?.some,
            category: { in: filters.labelCategories }
          }
        };
      }

      if (filters.hasAttribute) {
        where.attributes = {
          some: {
            key: filters.hasAttribute,
            ...(filters.attributeValue && { value: filters.attributeValue })
          }
        };
      }

      const [addresses, total] = await Promise.all([
        prisma.address.findMany({
          where,
          include: {
            chain: true,
            attributes: true,
            labels: true,
            protocol: true
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.address.count({ where })
      ]);

      return {
        addresses: addresses as Address[],
        total,
        page,
        limit,
        hasMore: offset + addresses.length < total
      };
    } catch (error) {
      logger.error('Failed to search addresses', { 
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get all labels with usage statistics
   */
  async getLabels(): Promise<(AddressLabel & { usageCount: number })[]> {
    try {
      const labelStats = await prisma.addressLabel.groupBy({
        by: ['name', 'type', 'category'],
        _count: {
          id: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return labelStats.map((stat: any) => ({
        id: '',
        addressId: '',
        name: stat.name,
        type: stat.type,
        category: stat.category,
        isPublic: false,
        isPinned: false,
        addedAt: new Date(),
        updatedAt: new Date(),
        usageCount: stat._count.id
      })) as (AddressLabel & { usageCount: number })[];
    } catch (error) {
      logger.error('Failed to get labels', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Create system labels
   */
  async createSystemLabels(): Promise<void> {
    // This will be called during initialization
    // System labels will be created as needed by the analysis system
    logger.info('System labels creation handled by analysis system integration');
  }

  /**
   * Helper: Set boolean attribute
   */
  async setBooleanAttribute(
    addressId: string, 
    key: AttributeKey, 
    value: boolean,
    category?: string,
    source?: string,
    confidence?: number
  ): Promise<void> {
    await this.addAttribute(addressId, {
      key,
      value: value.toString(),
      ...(category && { category }),
      ...(source && { source }),
      ...(confidence && { confidence })
    });
  }

  /**
   * Helper: Set string attribute
   */
  async setStringAttribute(
    addressId: string, 
    key: string, 
    value: string,
    category?: string,
    source?: string,
    confidence?: number
  ): Promise<void> {
    await this.addAttribute(addressId, {
      key,
      value,
      ...(category && { category }),
      ...(source && { source }),
      ...(confidence && { confidence })
    });
  }

  /**
   * Initialize chain data
   */
  async initializeChains(): Promise<void> {
    const chains = [
      {
        chainId: ChainId.ETHEREUM_MAINNET,
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        isTestnet: false
      },
      {
        chainId: ChainId.ETHEREUM_SEPOLIA,
        name: 'Ethereum Sepolia',
        symbol: 'ETH',
        isTestnet: true
      },
      {
        chainId: ChainId.POLYGON_MAINNET,
        name: 'Polygon Mainnet',
        symbol: 'MATIC',
        isTestnet: false
      },
      {
        chainId: ChainId.POLYGON_MUMBAI,
        name: 'Polygon Mumbai',
        symbol: 'MATIC',
        isTestnet: true
      },
      {
        chainId: ChainId.ARBITRUM_ONE,
        name: 'Arbitrum One',
        symbol: 'ETH',
        isTestnet: false
      },
      {
        chainId: ChainId.OPTIMISM_MAINNET,
        name: 'Optimism Mainnet',
        symbol: 'ETH',
        isTestnet: false
      },
      {
        chainId: ChainId.BASE_MAINNET,
        name: 'Base Mainnet',
        symbol: 'ETH',
        isTestnet: false
      }
    ];

    for (const chainData of chains) {
      await prisma.chain.upsert({
        where: { chainId: chainData.chainId },
        create: chainData,
        update: {
          name: chainData.name,
          symbol: chainData.symbol,
          isTestnet: chainData.isTestnet
        }
      });
    }

    logger.info('Chains initialized', { count: chains.length });
  }
} 