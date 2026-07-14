// utils/logger.js
const winston = require('winston');
const { combine, timestamp, printf, colorize, errors } = winston.format;
const path = require('path');

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),
    // Combined log file
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      level: 'info'
    }),
    // Error log file
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/errors.log'),
      level: 'error'
    })
  ]
});

// For morgan HTTP request logging
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger;