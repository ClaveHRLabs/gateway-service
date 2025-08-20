import { Request, Response, NextFunction, HttpStatusCode } from '@vspl/core';
import { validateRequestHeaders } from '../models/request';

export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Convert headers to lowercase for case-insensitive matching
        const headers = Object.entries(req.headers).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key.toLowerCase()]: value,
            }),
            {},
        );

        // Validate headers
        validateRequestHeaders(headers as Record<string, string>);
        next();
    } catch (error) {
        console.error(error instanceof Error ? error : 'Request validation error', {
            scope: 'requestValidation',
        });
        if (error instanceof Error) {
            return res.status(HttpStatusCode.BAD_REQUEST).json({
                error: 'Invalid request headers',
                details: error.message,
            });
        }
        return res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'Invalid request headers' });
    }
};
