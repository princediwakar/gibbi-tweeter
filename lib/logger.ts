import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { INDIAN_TZ } from './datetime'; // Assuming INDIAN_TZ is still relevant for logs

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogOptions {
  level?: LogLevel;
  context?: string;
  error?: Error;
}

function log(message: string, options?: LogOptions, ...args: unknown[]): void {
  const { level = LogLevel.INFO, context, error } = options || {};
  const timestamp = formatTz(toZonedTime(new Date(), INDIAN_TZ), 'yyyy-MM-dd HH:mm:ss', { timeZone: INDIAN_TZ });
  
  let logMessage = `[${timestamp} IST] [${level}]`;
  if (context) {
    logMessage += ` [${context}]`;
  }
  logMessage += ` ${message}`;

  if (error) {
    logMessage += ` - Error: ${error.message}`;
    if (error.stack) {
      logMessage += `\nStack: ${error.stack}`;
    }
  }

  console.log(logMessage, ...args);
}

export const logger = {
  info: (message: string, context?: string, ...args: unknown[]) => log(message, { level: LogLevel.INFO, context }, ...args),
  warn: (message: string, context?: string, ...args: unknown[]) => log(message, { level: LogLevel.WARN, context }, ...args),
  error: (message: string, context?: string, error?: Error, ...args: unknown[]) => log(message, { level: LogLevel.ERROR, context, error }, ...args),
  debug: (message: string, context?: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') { // Only log debug in development
      log(message, { level: LogLevel.DEBUG, context }, ...args);
    }
  },
};