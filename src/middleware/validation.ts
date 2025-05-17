import { Request, Response, NextFunction } from 'express';
import { validateRequestHeaders } from '../models/request';
import { logger } from '../utils/logger';

export const requestValidationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Convert headers to lowercase for case-insensitive matching
        const headers = Object.entries(req.headers).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key.toLowerCase()]: value,
            }),
            {}
        );

        // Validate headers
        validateRequestHeaders(headers as Record<string, string>);
        next();
    } catch (error) {
        logger.error('Request validation error:', error);
        if (error instanceof Error) {
            return res.status(400).json({
                error: 'Invalid request headers',
                details: error.message,
            });
        }
        return res.status(400).json({ error: 'Invalid request headers' });
    }
}; 