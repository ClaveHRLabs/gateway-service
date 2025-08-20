import { Request, Response, NextFunction, HttpStatusCode } from '@vspl/core';
import { AuthenticatedRequest } from '../types/request';
import { validateResponse, baseResponseSchema, errorResponseSchema } from '../models/response';
import type { GatewayConfig } from '../config/appConfig';

/**
 * Creates response interceptor middleware with config passed as closure
 */
export const createResponseInterceptor = (config: GatewayConfig) => {
    return (req: Request, res: Response, next: NextFunction) => {
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
                console.error(error instanceof Error ? error : 'Response formatting error', {
                    scope: 'responseInterceptor',
                    message: 'Response formatting error',
                });

                const errorDetails = getErrorDetails(error, config);

                return originalJson.call(this, {
                    success: false,
                    timestamp: new Date().toISOString(),
                    requestId: (req as AuthenticatedRequest).requestId,
                    error: {
                        code: 'RESPONSE_VALIDATION_ERROR',
                        message: 'Invalid response format',
                        details: errorDetails.details,
                        stack: errorDetails.stack,
                    },
                });
            }
        };

        next();
    };
};

/**
 * Creates error handler middleware with config passed as closure
 */
export const createErrorHandler = (config: GatewayConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required 4-arg signature for Express error handler
    return (error: Error, req: Request, res: Response, _next: NextFunction) => {
        console.error(error, { scope: 'gatewayErrorHandler' });

        const errorDetails = getErrorDetails(error, config);

        const response = {
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                details: errorDetails.details,
                stack: errorDetails.stack,
            },
        };

        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(response);
    };
};

// Helper function to extract error details based on config
function getErrorDetails(error: unknown, config: GatewayConfig): { details?: string; stack?: string } {
    const result: { details?: string; stack?: string } = {};

    if (config.SHOW_ERROR_DETAILS) {
        result.details = error instanceof Error ? error.message : 'Unknown error';
    }

    if (config.SHOW_ERROR_STACK && error instanceof Error) {
        result.stack = error.stack;
    }

    return result;
}
