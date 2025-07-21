import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/request';
import { logger } from '../utils/logger';
import { validateUser, userSchema } from '../models/user';
import { Config } from '../config/config';
import { isWhitelisted } from '../config/whitelist';
import { services } from '@/config/services';

/**
 * Authentication middleware to validate JWT tokens and attach user claims to the request
 * Also handles bypassing authentication for whitelisted endpoints of any service
 */
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract service identifier from the URL path
        const pathParts = req.originalUrl.split('/');
        const servicePrefix = pathParts[1] || '';

        // Check if the path should bypass authentication for this service
        if (servicePrefix) {
            const path = req.path;
            if (isWhitelisted(path, servicePrefix)) {
                logger.info(`Bypassing authentication for whitelisted endpoint: ${servicePrefix}${path}`);
                return next();
            }
        }

        // if header contains setup code send the request to the setup service
        const setupCode = req.headers['x-setup-code'];
        if (setupCode) {
            logger.info(`Setup code detected: ${setupCode}`);
            return next();
        }

        // For non-whitelisted paths, continue with authentication
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                timestamp: new Date().toISOString(),
                requestId: (req as AuthenticatedRequest).requestId,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                    details: 'No token provided'
                }
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, Config.JWT_SECRET);

        // Validate and parse the decoded token using Zod schema
        const userClaims = validateUser(decoded, userSchema);

        (req as AuthenticatedRequest).user = userClaims;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        const errorResponse = {
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication failed',
                details: Config.SHOW_ERROR_DETAILS ? (error instanceof Error ? error.message : 'Unknown error') : undefined
            }
        };

        if (error instanceof jwt.JsonWebTokenError) {
            errorResponse.error.message = 'Invalid token';
        } else if (error instanceof jwt.TokenExpiredError) {
            errorResponse.error.message = 'Token expired';
            errorResponse.error.code = 'TOKEN_EXPIRED';
        }

        return res.status(401).json(errorResponse);
    }
}; 