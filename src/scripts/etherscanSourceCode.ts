#!/usr/bin/env tsx
/**
 * Etherscan Source Code Fetcher Script
 * 
 * This script fetches source code for a smart contract from Etherscan API.
 * 
 * Usage:
 *   npm run script:etherscan-source <contract-address>
 *   tsx src/scripts/etherscanSourceCode.ts <contract-address>
 *   
 * Example:
 *   tsx src/scripts/etherscanSourceCode.ts 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413
 *   
 * Prerequisites:
 *   - Environment variables should be configured (see README.md)
 *   - ETHERSCAN_API_KEY must be set in .env file
 */
import 'dotenv/config';
import axios from 'axios';

const log = (level: 'I' | 'D' | 'W' | 'E', message: string) => {
  const datetime = new Date().toISOString();
  console.log(`-${level}- ${datetime}: ${message}`);
};

interface EtherscanSourceResponse {
  status: string;
  message: string;
  result: Array<{
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string;
    Implementation: string;
    SwarmSource: string;
  }>;
}

async function fetchSourceCode(contractAddress: string): Promise<void> {
  try {
    // Get ETHERSCAN_API_KEY from environment
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      log('E', 'ETHERSCAN_API_KEY is required in .env file');
      process.exit(1);
    }
    
    log('I', `Fetching source code for contract: ${contractAddress}`);
    log('D', `Using Etherscan API key: ${etherscanApiKey.substring(0, 6)}...`);

          // Call Etherscan API
      const response = await axios.get<EtherscanSourceResponse>('https://api.etherscan.io/api', {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: etherscanApiKey,
        },
        timeout: 10000, // 10 second timeout
      });

    log('D', `API Response Status: ${response.data.status}`);
    log('D', `API Response Message: ${response.data.message}`);

    // Check if the request was successful
    if (response.data.status !== '1') {
      log('E', `Etherscan API error: ${response.data.message}`);
      return;
    }

    // Check if we have results
    if (!response.data.result || response.data.result.length === 0) {
      log('W', 'No source code data found for this contract');
      return;
    }

    const contractData = response.data.result[0];
    if (!contractData) {
      log('W', 'Contract data is empty');
      return;
    }

    // Check if the contract is verified
    if (!contractData.SourceCode || contractData.SourceCode === '') {
      log('W', 'Contract is not verified on Etherscan - no source code available');
      return;
    }

    // Display the results
    log('I', '✅ Contract source code retrieved successfully!');
    console.log('\n📄 CONTRACT INFORMATION:');
    console.log('=' .repeat(50));
    console.log(`Contract Name: ${contractData.ContractName || 'Not provided'}`);
    console.log(`Compiler Version: ${contractData.CompilerVersion || 'Not provided'}`);
    console.log(`Optimization Used: ${contractData.OptimizationUsed || 'Not provided'}`);
    console.log(`Optimization Runs: ${contractData.Runs || 'Not provided'}`);
    console.log(`EVM Version: ${contractData.EVMVersion || 'Not provided'}`);
    console.log(`License Type: ${contractData.LicenseType || 'Not provided'}`);
    console.log(`Is Proxy: ${contractData.Proxy === '1' ? 'Yes' : 'No'}`);
    
    if (contractData.Implementation && contractData.Implementation !== '') {
      console.log(`Implementation Address: ${contractData.Implementation}`);
    }

    console.log('\n📋 ABI:');
    console.log('=' .repeat(50));
    if (contractData.ABI && contractData.ABI !== 'Contract source code not verified') {
      try {
        const abi = JSON.parse(contractData.ABI);
        console.log(JSON.stringify(abi, null, 2));
      } catch (error) {
        console.log(contractData.ABI);
      }
    } else {
      console.log('ABI not available');
    }

    console.log('\n💻 SOURCE CODE:');
    console.log('=' .repeat(50));
    console.log(contractData.SourceCode);

    if (contractData.ConstructorArguments && contractData.ConstructorArguments !== '') {
      console.log('\n🔧 CONSTRUCTOR ARGUMENTS:');
      console.log('=' .repeat(50));
      console.log(contractData.ConstructorArguments);
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        log('E', 'Request timeout - Etherscan API is taking too long to respond');
      } else if (error.response) {
        log('E', `HTTP Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        log('E', 'Network error - Unable to reach Etherscan API');
      } else {
        log('E', `Request setup error: ${error.message}`);
      }
    } else {
      log('E', `Unexpected error: ${(error as Error).message}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n🚨 Error: Contract address is required');
    console.log('\nUsage:');
    console.log('  tsx src/scripts/etherscanSourceCode.ts <contract-address>');
    console.log('\nExample:');
    console.log('  tsx src/scripts/etherscanSourceCode.ts 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413');
    process.exit(1);
  }

  const contractAddress = args[0];
  if (!contractAddress) {
    log('E', 'Contract address is required');
    process.exit(1);
  }
  
  // Basic address validation
  if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    log('E', 'Invalid Ethereum address format. Address should start with 0x and be 42 characters long');
    process.exit(1);
  }

  log('I', '🚀 Starting Etherscan source code fetcher...');
  await fetchSourceCode(contractAddress);
  log('I', '✅ Script execution completed');
}

// Execute main function
main().catch((error) => {
  log('E', `Fatal error: ${error.message}`);
  process.exit(1);
}); 