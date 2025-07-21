import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types/request';

export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    (req as AuthenticatedRequest).requestId = requestId;
    next();
}; 