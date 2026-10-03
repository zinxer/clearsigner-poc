# tx-clearsigner features

Only features present in the code are listed; see README for planned work.

## Rate limiting

```
General API: 100 req/min
Read-only API: 200 req/min
Health checks: 10 req/10 sec
```

Configure with `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`. Responses include standard `RateLimit-*` headers.

## Structured logging

```typescript
import { logger } from '@/utils/logger';
logger.info('message', { key: 'value' });
logger.apiRequest('GET', '/api/contracts/0x...');
logger.serviceCall('ContractService', 'getContractInfo', { address });
logger.dbQuery('SELECT', 'address', { address });
```

Format: `-I- 2025-01-15T10:30:45.123Z: message {"key":"value"}` (levels -E-, -W-, -I-, -D-). Enable debug with `DEBUG=true LOG_LEVEL=debug`.

## Planned (not implemented)

- Modular analysis framework and `/api/analysis/*` endpoints
- LLM-based contract risk analysis
- Cross-chain analysis, caching layer, batch processing
