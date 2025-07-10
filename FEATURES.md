# tx-clearsigner backend Features

## 🚀 Overview

The tx-clearsigner backend now includes three major enhancements:

1. **Rate Limiting** - Protect your API from abuse
2. **Advanced Logging** - Better debugging and monitoring  
3. **Modular Analysis Framework** - Easily extensible contract analysis

## 🔒 Rate Limiting

### Automatic Protection
All endpoints are automatically protected with intelligent rate limiting:

```typescript
// Different limits for different endpoint types
General API: 100 req/min
Analysis API: 10 req/min (resource intensive)
Read-only API: 200 req/min (more lenient)
Health checks: 10 req/10sec
```

### Configuration
Control rate limits via environment variables:
```bash
RATE_LIMIT_WINDOW_MS=60000        # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100       # General limit
RATE_LIMIT_ANALYSIS_MAX=10        # Analysis limit
```

### Rate Limit Headers
Responses include standard rate limit headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1640995200
```

## 📝 Advanced Logging

### Structured Logging with Context
```typescript
import { logger } from '@/utils/logger';

// Different log levels
logger.error('Database connection failed', { 
  error: err.message, 
  host: 'localhost' 
});

logger.warn('High memory usage detected', { 
  usage: '85%', 
  threshold: '80%' 
});

logger.info('User authenticated successfully', { 
  userId: '123', 
  method: 'oauth' 
});

logger.debug('Cache hit for contract analysis', { 
  contractAddress: '0x123...', 
  cacheKey: 'analysis:123' 
});
```

### Debug Mode
Enable detailed logging for development:
```bash
# In .env file
DEBUG=true
LOG_LEVEL=debug
```

### Specialized Logging Methods
```typescript
// API request/response logging
logger.apiRequest('POST', '/api/analysis/transaction', { contractAddress });
logger.apiResponse('POST', '/api/analysis/transaction', 200, 1500);

// Service layer logging
logger.serviceCall('ContractService', 'getContractInfo', { address });

// Database operations
logger.dbQuery('SELECT', 'contracts', { address });

// Contract analysis steps
logger.contractAnalysis(address, 'Starting proxy analysis', { isProxy: true });
```

### Log Format
All logs follow a consistent format:
```
-I- 2024-01-15T10:30:45.123Z: User authenticated successfully {"userId":"123","method":"oauth"}
-E- 2024-01-15T10:30:46.456Z: Database connection failed {"error":"Connection timeout","host":"localhost"}
-D- 2024-01-15T10:30:47.789Z: Cache hit for contract analysis {"contractAddress":"0x123...","cacheKey":"analysis:123"}
```

## 🔍 Modular Analysis Framework

### Architecture
The analysis system is built on a plugin architecture:

```
AnalysisManager (orchestrates everything)
├── ProxyAnalysis (security category)
├── TokenAnalysis (defi category)  
├── GasAnalysis (gas category)
└── YourCustomAnalysis (any category)
```

### Creating Custom Analysis Modules

1. **Create the Analysis Class**
```typescript
// src/analysis/modules/security/MySecurityAnalysis.ts
import { BaseAnalysis } from '../BaseAnalysis';
import { AnalysisContext, AnalysisResult } from '../../interfaces/IAnalysis';

export class MySecurityAnalysis extends BaseAnalysis {
  readonly id = 'security-my-analysis';
  readonly name = 'My Security Analysis';
  readonly description = 'Checks for specific security patterns';
  readonly version = '1.0.0';
  readonly category = 'security';
  readonly tags = ['security', 'custom'];

  getPriority(): number {
    return 8; // High priority (1-10)
  }

  shouldAnalyze(context: AnalysisContext): boolean {
    // Only analyze if contract has ABI
    return this.hasABI(context);
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const findings = [];
    let riskScore = 0;

    // Your analysis logic here
    if (this.detectDangerousPattern(context)) {
      findings.push(this.createFinding(
        'risk',
        'high',
        'Dangerous Pattern Detected',
        'This contract contains a dangerous pattern',
        'Consider reviewing the contract implementation'
      ));
      riskScore += 5;
    }

    return this.createResult(riskScore, 0.9, findings);
  }

  private detectDangerousPattern(context: AnalysisContext): boolean {
    // Your detection logic
    return false;
  }
}
```

2. **Register the Analysis**
```typescript
// src/analysis/registry.ts
import { MySecurityAnalysis } from './modules/security/MySecurityAnalysis';

export function registerAnalysisModules(): void {
  // ... existing registrations

  // Register your custom analysis
  analysisManager.register(new MySecurityAnalysis(), {
    enabled: true,
    timeout: 20000,
    priority: 8,
    dependencies: [], // Optional: depend on other analyses
  });
}
```

### Analysis Categories
Organize analyses by category:
- `security` - Security-focused analyses
- `defi` - DeFi protocol analyses  
- `gas` - Gas optimization analyses
- `nft` - NFT-specific analyses
- `governance` - Governance token analyses
- `compliance` - Regulatory compliance
- `general` - General purpose analyses

### Analysis Results
Each analysis returns structured results:
```typescript
{
  overallRiskScore: 6.5,      // 0-10 scale
  overallConfidence: 0.85,    // 0-1 scale
  categories: {
    security: { riskScore: 8, confidence: 0.9, findings: 3 },
    defi: { riskScore: 5, confidence: 0.8, findings: 2 },
    gas: { riskScore: 3, confidence: 0.7, findings: 5 }
  },
  totalFindings: 10,
  recommendations: [
    "Verify proxy admin controls",
    "Review token minting mechanisms"
  ],
  executionSummary: {
    totalAnalyses: 3,
    successfulAnalyses: 3,
    failedAnalyses: 0,
    totalExecutionTime: 1250
  }
}
```

### Example Analysis Workflow
```typescript
// 1. Analysis manager receives context
const context: AnalysisContext = {
  contractInfo: { address: '0x123...', abi: [...], isProxy: true },
  functionSelector: '0xa9059cbb',
  functionName: 'transfer',
  transactionData: { to: '0x123...', data: '0x...' }
};

// 2. Manager finds applicable analyses
// - ProxyAnalysis: shouldAnalyze() → true (isProxy)
// - TokenAnalysis: shouldAnalyze() → true (has transfer function)  
// - GasAnalysis: shouldAnalyze() → true (has ABI)

// 3. Executes analyses in priority order (9, 7, 3)
// 4. Compiles results with weighted scoring
// 5. Returns comprehensive analysis
```

## 🔧 Configuration

### Environment Variables
```bash
# Logging
DEBUG=true
LOG_LEVEL=debug

# Rate Limiting  
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_ANALYSIS_MAX=10

# Analysis Framework (future)
ANALYSIS_TIMEOUT_DEFAULT=30000
ANALYSIS_RETRIES_DEFAULT=2
```

### Runtime Configuration
```typescript
// Disable specific analyses
analysisManager.register(new ProxyAnalysis(), {
  enabled: false  // Disable this analysis
});

// Adjust timeouts per analysis
analysisManager.register(new TokenAnalysis(), {
  timeout: 5000,  // 5 second timeout
  retries: 1      // Only 1 retry
});
```

## 🚀 Getting Started

1. **Install the enhanced backend**:
```bash
./install.sh
```

2. **Configure environment**:
```bash
# Edit .env file
DEBUG=true
LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=50  # Lower for testing
```

3. **Start development server**:
```bash
npm run dev
```

4. **Test the features**:
```bash
# Test rate limiting
for i in {1..15}; do curl http://localhost:3001/api/analysis/transaction -X POST; done

# Test logging (check console)
curl http://localhost:3001/health

# Test analysis framework  
curl -X POST http://localhost:3001/api/analysis/transaction \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234...","data":"0x..."}'
```

## 🛠️ Future Enhancements

The modular system makes it easy to add:
- **LLM Integration**: AI-powered contract analysis
- **Cross-chain Analysis**: Multi-blockchain support
- **Real-time Monitoring**: Live contract scanning
- **Custom Risk Models**: Industry-specific scoring
- **Batch Processing**: Analyze multiple contracts
- **Webhook Integration**: Real-time notifications
- **Caching Layer**: Improved performance
- **Analysis Marketplace**: Community-contributed modules 