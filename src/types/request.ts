import { Request } from '@vspl/core';
import { z } from 'zod';
import { baseUserSchema } from '../models/user';

export type UserClaims = z.infer<typeof baseUserSchema> & {
    roles: string[];
    organizationId?: string;
    department?: string;
    position?: string;
    permissions?: string[];
    tenantId?: string;
    locale?: string;
    timezone?: string;
    lastLogin?: string;
    isActive?: boolean;
    employeeId?: string;
};

export interface AuthenticatedRequest extends Request {
    requestId: string;
    user?: UserClaims;
}

export interface ServiceConfig {
    name: string;
    url: string;
    methods: string[];
    rateLimit?: {
        windowMs: number;
        max: number;
    };
}
