import { Request, Response, NextFunction, HttpStatusCode, logger } from '@vspl/core';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/request';
import { validateUser, userSchema } from '../models/user';
import { isWhitelisted } from '../config/whitelist';
import type { GatewayConfig } from '../config/appConfig';

// Constants
const BEARER_PREFIX = 'Bearer ';

/**
 * Creates authentication middleware with config passed as closure
 */
export const createAuthMiddleware = (config: GatewayConfig) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Extract service identifier from the URL path
            const servicePrefix = req.originalUrl.split('/')[1];
    
            // Check if the path should bypass authentication for this service
            if (servicePrefix) {
                const path = req.path.replace(`/${servicePrefix}`, ''); // remove the servicePrefix

                logger.info(`Checking whitelist for ${path} in service: ${servicePrefix}`);
                const whitelisted = await isWhitelisted(path, servicePrefix);
                if (whitelisted) {
                    logger.info(`Bypassing authentication for whitelisted endpoint: ${servicePrefix}${path}`);
                    return next();
                }
            }

            // if header contains setup code send the request to the setup service
            const setupCode = req.headers['x-setup-code'];
            if (setupCode) {
                console.log(`Setup code detected: ${setupCode}`);
                return next();
            }

            // For non-whitelisted paths, continue with authentication
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith(BEARER_PREFIX)) {
                return res.status(HttpStatusCode.UNAUTHORIZED).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    requestId: (req as AuthenticatedRequest).requestId,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                        details: 'No token provided',
                    },
                });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.JWT_SECRET);

            // Validate and parse the decoded token using Zod schema
            const userClaims = validateUser(decoded, userSchema);

            (req as AuthenticatedRequest).user = userClaims;
            next();
        } catch (error) {
            console.error(error instanceof Error ? error : 'Authentication error', {
                scope: 'authMiddleware',
            });

            const errorMessage = getErrorMessage(error);
            const errorCode = getErrorCode(error);

            let errorDetails: string | undefined;
            if (config.SHOW_ERROR_DETAILS) {
                errorDetails = error instanceof Error ? error.message : 'Unknown error';
            }

            const errorResponse = {
                success: false,
                timestamp: new Date().toISOString(),
                requestId: (req as AuthenticatedRequest).requestId,
                error: {
                    code: errorCode,
                    message: errorMessage,
                    details: errorDetails,
                },
            };

            return res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
        }
    };
};

// Helper functions
function getErrorMessage(error: unknown): string {
    if (error instanceof jwt.JsonWebTokenError) {
        return 'Invalid token';
    }
    if (error instanceof jwt.TokenExpiredError) {
        return 'Token expired';
    }
    return 'Authentication failed';
}

function getErrorCode(error: unknown): string {
    if (error instanceof jwt.TokenExpiredError) {
        return 'TOKEN_EXPIRED';
    }
    return 'UNAUTHORIZED';
}
