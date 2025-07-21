import winston from 'winston';

// Get log level from environment variable directly instead of using Config
// This breaks the circular dependency
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
}); 