import { validateEnv } from '@/validation/env';

type LogLevel = 'E' | 'W' | 'I' | 'D';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private env = validateEnv();
  private shouldShowDebug: boolean;
  private logLevel: string;

  constructor() {
    this.shouldShowDebug = this.env.DEBUG;
    this.logLevel = this.env.LOG_LEVEL;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `-${level}- ${timestamp}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      return `${baseMessage} ${JSON.stringify(context)}`;
    }
    
    return baseMessage;
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === 'D' && !this.shouldShowDebug) {
      return false;
    }

    const levelPriority = {
      'E': 4, // Error
      'W': 3, // Warning  
      'I': 2, // Info
      'D': 1, // Debug
    };

    const configLevelPriority = {
      'error': 4,
      'warn': 3,
      'info': 2,
      'debug': 1,
    };

    return levelPriority[level] >= (configLevelPriority[this.logLevel as keyof typeof configLevelPriority] || 2);
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('E')) {
      console.error(this.formatMessage('E', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('W')) {
      console.warn(this.formatMessage('W', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('I')) {
      console.info(this.formatMessage('I', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('D')) {
      console.log(this.formatMessage('D', message, context));
    }
  }

  // Convenience methods for common use cases
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, context);
  }

  apiResponse(method: string, url: string, statusCode: number, duration?: number): void {
    const context = { statusCode, ...(duration && { duration: `${duration}ms` }) };
    this.info(`${method} ${url} - ${statusCode}`, context);
  }

  serviceCall(service: string, method: string, context?: LogContext): void {
    this.debug(`${service}.${method}`, context);
  }

  dbQuery(operation: string, model: string, context?: LogContext): void {
    this.debug(`DB ${operation} ${model}`, context);
  }

  contractAnalysis(address: string, step: string, context?: LogContext): void {
    this.debug(`Contract Analysis ${address}: ${step}`, context);
  }
}

// Create singleton instance
export const logger = new Logger();

// Legacy function for backward compatibility
export const log = (level: 'I' | 'D' | 'W' | 'E', message: string, context?: LogContext) => {
  switch (level) {
    case 'E':
      logger.error(message, context);
      break;
    case 'W':
      logger.warn(message, context);
      break;
    case 'I':
      logger.info(message, context);
      break;
    case 'D':
      logger.debug(message, context);
      break;
  }
}; 