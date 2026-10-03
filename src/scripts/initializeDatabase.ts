#!/usr/bin/env tsx
/**
 * Database Initialization Script
 * 
 * This script initializes the tx-clearsigner database with essential data:
 * - Blockchain networks (Ethereum, Polygon, Arbitrum, etc.)
 * - System tag definitions for categorizing addresses
 * 
 * Usage:
 *   npm run db:init
 *   
 * Prerequisites:
 *   - Database should be created and migrated
 *   - Environment variables should be configured (see README.md)
 *   - Run `npm run db:generate` first
 *   
 * Required environment variables:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - ALCHEMY_API_KEY: Your Alchemy API key  
 *   - ETHERSCAN_API_KEY: Your Etherscan API key
 */
import 'dotenv/config';
import { AddressService } from '@/services/addressService';
import { logger } from '@/utils/logger';
import { prisma } from '@/prisma/client';

const log = (level: 'I' | 'D' | 'W' | 'E', message: string) => {
  const datetime = new Date().toISOString();
  console.log(`-${level}- ${datetime}: ${message}`);
};

async function main() {
  try {
    log('I', 'Starting database initialization...');
    
    const addressService = new AddressService();
    
    // Initialize chains
    log('I', 'Initializing blockchain networks...');
    await addressService.initializeChains();
    
    // Create system tags
    log('I', 'Creating system tags...');
    await createSystemTags();
    
    log('I', 'Database initialization completed successfully!');
    
    // Print some stats
    const stats = await getStats();
    log('I', `Database statistics:`);
    log('I', `  - Chains: ${stats.chains}`);
    log('I', `  - Addresses: ${stats.addresses}`);
    
  } catch (error) {
    log('E', `Database initialization failed: ${(error as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSystemTags() {
  // Since AddressTag requires an addressId, we'll just log the available system tags
  // These can be used as reference when creating tags for actual addresses
  
  const systemTags = [
    // Security-related tags
    'audited', 'verified', 'high-risk', 'medium-risk', 'low-risk', 
    'proxy', 'upgradeable', 'timelock', 'multisig',
    
    // Protocol-related tags
    'defi', 'dex', 'lending', 'amm', 'governance', 'staking', 'bridge', 'oracle',
    
    // Token-related tags
    'erc20', 'erc721', 'erc1155', 'nft', 'stablecoin', 'wrapped',
    
    // Exchange/Marketplace tags
    'exchange', 'marketplace', 'aggregator',
    
    // Infrastructure tags
    'infrastructure', 'wallet', 'factory', 'router'
  ];

  log('I', `System tag categories defined. Available tags: ${systemTags.join(', ')}`);
  log('I', `These tags can be used when creating addresses through the API.`);
}

async function getStats() {
  const [
    chainCount,
    addressCount
  ] = await Promise.all([
    prisma.chain.count(),
    prisma.address.count()
  ]);

  return {
    chains: chainCount,
    addresses: addressCount
  };
}

// Run the script
main().catch(console.error); 