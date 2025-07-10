import { AlchemyService } from '@/services/alchemyService';
import { ContractService } from '@/services/contractService';

declare global {
  namespace Express {
    interface Request {
      services?: {
        alchemy: AlchemyService;
        contract: ContractService;
      };
    }
  }
} 