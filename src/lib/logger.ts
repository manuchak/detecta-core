/**
 * Structured Logger for Planeación Module
 * Provides consistent logging with module/action context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module: string;
  action: string;
  details?: Record<string, any>;
}

class Logger {
  private module: string;
  private isDevelopment: boolean;

  constructor(module: string) {
    this.module = module;
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, action: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.module}] [${action}] ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return emojis[level];
  }

  debug(action: string, message: string, details?: Record<string, any>) {
    if (!this.isDevelopment) return;
    const emoji = this.getEmoji('debug');
    console.debug(`${emoji} ${this.formatMessage('debug', action, message)}`, details || '');
  }

  info(action: string, message: string, details?: Record<string, any>) {
    const emoji = this.getEmoji('info');
    console.info(`${emoji} ${this.formatMessage('info', action, message)}`, details || '');
  }

  warn(action: string, message: string, details?: Record<string, any>) {
    const emoji = this.getEmoji('warn');
    console.warn(`${emoji} ${this.formatMessage('warn', action, message)}`, details || '');
  }

  error(action: string, message: string, error?: Error | unknown, details?: Record<string, any>) {
    const emoji = this.getEmoji('error');
    const errorInfo = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    
    console.error(
      `${emoji} ${this.formatMessage('error', action, message)}`,
      { error: errorInfo, ...details }
    );
  }

  // Convenience method for operation tracking
  operation(action: string, status: 'start' | 'success' | 'failure', details?: Record<string, any>) {
    const statusEmoji = {
      start: '🚀',
      success: '✅',
      failure: '💥'
    };
    
    const level = status === 'failure' ? 'error' : 'info';
    const message = `Operation ${status}`;
    
    if (level === 'error') {
      console.error(`${statusEmoji[status]} ${this.formatMessage(level, action, message)}`, details || '');
    } else {
      console.info(`${statusEmoji[status]} ${this.formatMessage(level, action, message)}`, details || '');
    }
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}

export { Logger };
