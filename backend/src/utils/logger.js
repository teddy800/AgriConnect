import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Custom format for file output (JSON for better parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transport for all logs
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: fileFormat,
  level: 'info'
});

// Transport for error logs only
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Keep error logs for 30 days
  format: fileFormat,
  level: 'error'
});

// Transport for HTTP access logs
const httpLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d',
  format: fileFormat,
  level: 'http'
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'agriconnect-api' },
  transports: [
    allLogsTransport,
    errorLogsTransport,
    httpLogsTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

/**
 * Express middleware for HTTP request logging
 */
function httpLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    
    logger.http('Outgoing response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || body?.length || 0
    });
    
    return originalSend.call(this, body);
  };
  
  next();
}

/**
 * Log authentication events
 */
function logAuth(action, user, success = true, details = {}) {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth: ${action}`, {
    action,
    userId: user?.id,
    phone: user?.phone,
    role: user?.role,
    success,
    ...details
  });
}

/**
 * Log database operations
 */
function logDB(operation, table, success = true, details = {}) {
  logger.info(`Database: ${operation}`, {
    operation,
    table,
    success,
    ...details
  });
}

/**
 * Log security events
 */
function logSecurity(event, level = 'warn', details = {}) {
  logger[level](`Security: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
}

/**
 * Log API errors with full context
 */
function logError(error, context = {}) {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...context
  });
}

/**
 * Log performance metrics
 */
function logPerformance(operation, duration, details = {}) {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    slow: duration > 1000,
    ...details
  });
}

/**
 * Log user actions for audit trail
 */
function logAudit(userId, action, resource, details = {}) {
  logger.info('Audit Log', {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...details
  });
}

/**
 * Log file upload events
 */
function logUpload(userId, filename, size, success = true) {
  logger.info('File Upload', {
    userId,
    filename,
    size: `${(size / 1024).toFixed(2)} KB`,
    success
  });
}

/**
 * Log rate limit violations
 */
function logRateLimit(ip, endpoint, details = {}) {
  logger.warn('Rate Limit Exceeded', {
    ip,
    endpoint,
    timestamp: new Date().toISOString(),
    ...details
  });
}

/**
 * Create a child logger with additional context
 */
function createChildLogger(context = {}) {
  return logger.child(context);
}

/**
 * Stream for Morgan HTTP logger integration
 */
const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Export the main logger and utilities
export default logger;

export {
  logger,
  httpLogger,
  logAuth,
  logDB,
  logSecurity,
  logError,
  logPerformance,
  logAudit,
  logUpload,
  logRateLimit,
  createChildLogger,
  stream
};
