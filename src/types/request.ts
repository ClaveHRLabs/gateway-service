import { Request } from 'express';
import { UserClaims } from '../models/user';

export interface AuthenticatedRequest extends Request {
    requestId: string;
    user?: UserClaims;
}

export interface ServiceConfig {
    name: string;
    url: string;
    path: string;
    methods: string[];
    rateLimit?: {
        windowMs: number;
        max: number;
    };
} 