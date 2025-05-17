import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';
import { validateResponse, baseResponseSchema, errorResponseSchema } from '../models/response';
import { logger } from '../utils/logger';
import { Config } from '../config/config';

// Response interceptor middleware
export const responseInterceptor = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method
    res.json = function (body: unknown) {
        try {
            // Add standard response fields
            const response = {
                success: res.statusCode < 400,
                timestamp: new Date().toISOString(),
                requestId: (req as AuthenticatedRequest).requestId,
                data: body,
            };

            // Validate response format
            const schema = res.statusCode < 400 ? baseResponseSchema : errorResponseSchema;
            validateResponse(response, schema);

            // Call original json method with formatted response
            return originalJson.call(this, response);
        } catch (error) {
            logger.error('Response formatting error:', error);
            // If validation fails, send error response
            return originalJson.call(this, {
                success: false,
                timestamp: new Date().toISOString(),
                requestId: (req as AuthenticatedRequest).requestId,
                error: {
                    code: 'RESPONSE_VALIDATION_ERROR',
                    message: 'Invalid response format',
                    details: Config.SHOW_ERROR_DETAILS ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
                    stack: Config.SHOW_ERROR_STACK ? (error instanceof Error ? error.stack : undefined) : undefined,
                },
            });
        }
    };

    next();
};

// Error handler middleware
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Unhandled error:', error);

    const response = {
        success: false,
        timestamp: new Date().toISOString(),
        requestId: (req as AuthenticatedRequest).requestId,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: Config.SHOW_ERROR_DETAILS ? error.message : undefined,
            stack: Config.SHOW_ERROR_STACK ? error.stack : undefined,
        },
    };

    res.status(500).json(response);
}; 