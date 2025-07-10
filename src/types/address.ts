// Core address and chain types
export interface Chain {
  id: string;
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl?: string;
  blockExplorerUrl?: string;
  isTestnet: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  address: string;
  chainId: number;
  chain?: Chain;
  
  // Basic identification
  contractName?: string;  // Official/provided name
  displayName?: string;   // User-friendly display name
  symbol?: string;
  decimals?: number;
  
  // Core characteristics
  isContract: boolean;
  isToken: boolean;
  isProxy: boolean;
  isVerified: boolean;
  
  // Contract-specific data
  currentImplementation?: string;
  proxyType?: string;
  abi?: any;
  bytecode?: string;
  bytecodeHash?: string;
  
  // Token-specific data
  tokenStandard?: string;
  totalSupply?: string;
  maxSupply?: string;
  tokenImageUrl?: string;  // URL to token logo/icon
  
  // Risk and protocol association
  riskLevel?: number;
  protocolId?: string;
  protocol?: Protocol;
  
  // Timestamps
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  attributes?: AddressAttribute[];
  labels?: AddressLabel[];
  sourceCode?: SourceCode[];
  metadata?: AddressMetadata[];
  proxyHistory?: ProxyHistory[];
}

export interface AddressAttribute {
  id: string;
  addressId: string;
  address?: Address;
  key: string;           // e.g., "isUpgradeable", "hasTimelock", "auditFirm"
  value: string;         // "true", "false", "OpenZeppelin", etc.
  category?: string;     // "security", "defi", "token", "governance"
  confidence?: number;   // 0.0 - 1.0
  source?: string;       // "analysis", "manual", "etherscan"
  addedBy?: string;      // User ID or system identifier
  addedAt: Date;
  updatedAt: Date;
}

export interface ProxyHistory {
  id: string;
  addressId: string;
  address?: Address;
  implementation: string;        // Implementation address at this point
  blockNumber?: bigint;         // Block when change occurred
  transactionHash?: string;     // Transaction that made the change
  timestamp: Date;              // When the change happened
  
  // For router patterns (proxy -> proxy -> implementation)
  isDirectImplementation: boolean;  // false if this points to another proxy
  depth: number;                    // 0 = direct, 1 = proxy->proxy, etc.
  
  // Change tracking
  changeType?: string;          // "deployed", "upgraded", "deprecated"
  previousImpl?: string;        // Previous implementation (for upgrades)
  
  // Metadata
  source?: string;              // "etherscan", "analysis", "manual"
  addedBy?: string;             // User ID or system
  createdAt: Date;
}

export interface AddressLabel {
  id: string;
  addressId: string;
  address?: Address;
  
  // Label content
  name: string;                 // "audited", "My DEX", "high-risk", etc.
  description?: string;
  
  // Categorization
  type: string;                 // "system", "user", "community"
  category?: string;            // "security", "defi", "personal", etc.
  
  // UI styling
  color?: string;               // Hex color for UI
  icon?: string;                // Icon name or URL
  
  // Visibility and permissions
  isPublic: boolean;            // Public vs private labels
  isPinned: boolean;            // Show prominently in UI
  
  // Metadata
  confidence?: number;          // 0.0 - 1.0 (for system labels)
  source?: string;              // "manual", "analysis", "import", "api"
  addedBy?: string;             // User ID
  addedAt: Date;
  updatedAt: Date;
}

export interface SourceCode {
  id: string;
  addressId: string;
  address?: Address;
  
  // Source code information
  language: string;        // Solidity, Vyper, etc.
  sourceCode: string;      // Full source code
  fileName?: string;       // Main contract file name
  
  // Verification details
  isVerified: boolean;
  verifiedOn?: string;     // etherscan, sourcify, etc.
  verificationDate?: Date;
  
  // Compiler details
  compilerVersion?: string;
  optimization?: boolean;
  
  // Metadata
  contractName?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressMetadata {
  id: string;
  addressId: string;
  address?: Address;
  key: string;             // e.g., "deploymentBlock", "creator"
  value: any;              // Metadata value (flexible JSON)
  category?: string;       // "deployment", "analysis", "onchain"
  source?: string;         // "etherscan", "analysis", "blockchain"
  createdAt: Date;
  updatedAt: Date;
}

export interface Protocol {
  id: string;
  name: string;
  category?: string;  // defi, nft, gaming, etc.
  
  // On-chain risk assessment
  riskLevel?: number;  // 1-10 scale
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  addresses?: Address[];
}

// Request/Response types
export interface CreateAddressRequest {
  address: string;
  chainId: number;
  contractName?: string;
  displayName?: string;
  symbol?: string;
  decimals?: number;
  isContract?: boolean;
  isToken?: boolean;
  isProxy?: boolean;
  isVerified?: boolean;
  tokenStandard?: string;
  tokenImageUrl?: string;
  abi?: any;
  currentImplementation?: string;
  proxyType?: string;
}

export interface UpdateAddressRequest {
  contractName?: string;
  displayName?: string;
  symbol?: string;
  decimals?: number;
  isContract?: boolean;
  isToken?: boolean;
  isProxy?: boolean;
  isVerified?: boolean;
  currentImplementation?: string;
  proxyType?: string;
  abi?: any;
  bytecode?: string;
  tokenStandard?: string;
  tokenImageUrl?: string;
  totalSupply?: string;
  maxSupply?: string;
  riskLevel?: number;
  protocolId?: string;
}

export interface AddLabelRequest {
  name: string;
  description?: string;
  type?: string;           // "system", "user", "community"
  category?: string;       // "security", "defi", "personal"
  color?: string;
  icon?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  confidence?: number;
  source?: string;
}

export interface AddAttributeRequest {
  key: string;
  value: string;
  category?: string;
  confidence?: number;
  source?: string;
}

export interface AddProxyHistoryRequest {
  implementation: string;
  blockNumber?: bigint;
  transactionHash?: string;
  timestamp?: Date;
  isDirectImplementation?: boolean;
  depth?: number;
  changeType?: string;
  previousImpl?: string;
  source?: string;
}

export interface AddMetadataRequest {
  key: string;             // e.g., "deploymentBlock", "creator"
  value: any;              // Metadata value (flexible JSON)
  category?: string;       // "deployment", "analysis", "onchain"
  source?: string;         // "etherscan", "analysis", "blockchain"
}

export interface UpdateAttributesRequest {
  attributes: {
    key: string;
    value: string;
    category?: string;
    confidence?: number;
    source?: string;
  }[];
}

// Search and filter types
export interface AddressSearchFilters {
  chainId?: number;
  isContract?: boolean;
  isToken?: boolean;
  isProxy?: boolean;
  isVerified?: boolean;
  tokenStandard?: string;
  protocolId?: string;
  labels?: string[];           // Search by label names
  labelTypes?: string[];       // "system", "user", "community"
  labelCategories?: string[];  // "security", "defi", etc.
  hasAttribute?: string;       // Search by attribute key
  attributeValue?: string;     // Search by attribute value
  riskLevel?: {
    min?: number;
    max?: number;
  };
}

export interface AddressSearchResult {
  addresses: Address[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Label/attribute categories enum
export enum LabelCategory {
  SECURITY = 'security',
  DEFI = 'defi',
  NFT = 'nft',
  GOVERNANCE = 'governance',
  EXCHANGE = 'exchange',
  BRIDGE = 'bridge',
  ORACLE = 'oracle',
  GAMING = 'gaming',
  SOCIAL = 'social',
  INFRASTRUCTURE = 'infrastructure',
  PERSONAL = 'personal',
  BUSINESS = 'business',
  GENERAL = 'general'
}

// Label types
export enum LabelType {
  SYSTEM = 'system',      // Auto-generated by system
  USER = 'user',          // Created by individual users
  COMMUNITY = 'community' // Community-contributed
}

// Common attribute keys for type safety
export enum AttributeKey {
  // Contract characteristics
  IS_UPGRADEABLE = 'isUpgradeable',
  HAS_TIMELOCK = 'hasTimelock',
  HAS_MULTISIG = 'hasMultisig',
  HAS_GOVERNANCE = 'hasGovernance',
  IS_PAUSED = 'isPaused',
  IS_DEPRECATED = 'isDeprecated',
  
  // Token characteristics
  IS_MINTABLE = 'isMintable',
  IS_BURNABLE = 'isBurnable',
  IS_PAUSABLE = 'isPausable',
  HAS_BLACKLIST = 'hasBlacklist',
  HAS_WHITELIST = 'hasWhitelist',
  IS_DEFLATIONARY = 'isDeflationary',
  IS_REBASING = 'isRebasing',
  
  // DeFi characteristics
  IS_LENDING = 'isLending',
  IS_BORROWING = 'isBorrowing',
  IS_STAKING = 'isStaking',
  IS_YIELD_FARMING = 'isYieldFarming',
  IS_LIQUIDITY_POOL = 'isLiquidityPool',
  IS_AMM = 'isAMM',
  IS_DEX = 'isDEX',
  IS_BRIDGE = 'isBridge',
  IS_ORACLE = 'isOracle',
  
  // Security characteristics
  HAS_AUDIT = 'hasAudit',
  AUDIT_FIRM = 'auditFirm',
  HAS_INSURANCE = 'hasInsurance',
  HAS_BUG_BOUNTY = 'hasBugBounty',
  HAS_KNOWN_VULNS = 'hasKnownVulns',
  
  // Usage characteristics
  HAS_HIGH_VOLUME = 'hasHighVolume',
  HAS_HIGH_TVL = 'hasHighTVL',
  IS_POPULAR = 'isPopular',
  IS_NEW_PROJECT = 'isNewProject'
}

// Common chain IDs
export enum ChainId {
  ETHEREUM_MAINNET = 1,
  ETHEREUM_SEPOLIA = 11155111,
  POLYGON_MAINNET = 137,
  POLYGON_MUMBAI = 80001,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  ARBITRUM_ONE = 42161,
  ARBITRUM_SEPOLIA = 421614,
  OPTIMISM_MAINNET = 10,
  OPTIMISM_SEPOLIA = 11155420,
  AVALANCHE_MAINNET = 43114,
  AVALANCHE_FUJI = 43113,
  BASE_MAINNET = 8453,
  BASE_SEPOLIA = 84532
} 