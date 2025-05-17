import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/request';
import { logger } from '../utils/logger';
import { validateUser, userSchema } from '../models/user';
import { Config } from '../config/config';

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, Config.JWT_SECRET);

        // Validate and parse the decoded token using Zod schema
        const userClaims = validateUser(decoded, userSchema);

        (req as AuthenticatedRequest).user = userClaims;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Authentication failed' });
    }
}; 