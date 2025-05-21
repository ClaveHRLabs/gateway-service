import { z } from 'zod';

// Request metadata schema
export const requestMetadataSchema = z.object({
    requestId: z.string().uuid(),
    timestamp: z.string().datetime(),
    clientIp: z.string().ip().optional(),
    userAgent: z.string().optional(),
    correlationId: z.string().uuid().optional(),
});

// Request headers schema
export const requestHeadersSchema = z.object({
    'x-request-id': z.string().uuid(),
    'x-user-id': z.string().uuid(),
    'x-user-email': z.string().email(),
    'x-user-roles': z.string(),
    'x-organization-id': z.string().uuid().optional(),
    'x-tenant-id': z.string().uuid().optional(),
    'x-user-first-name': z.string().optional(),
    'x-user-last-name': z.string().optional(),
    'x-user-department': z.string().optional(),
    'x-user-position': z.string().optional(),
    'x-user-permissions': z.string().optional(),
    'x-user-locale': z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).optional(),
    'x-user-timezone': z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/).optional(),
    'x-user-last-login': z.string().datetime().optional(),
    'x-user-is-active': z.string().transform(val => val === 'true').optional(),
    'x-user-metadata': z.string().transform(val => JSON.parse(val)).optional(),
}).passthrough();

// Request validation function
export const validateRequestHeaders = (headers: Record<string, string>) => {
    try {
        console.log('headers', headers);
        return requestHeadersSchema.parse(headers);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            throw new Error(`Request validation failed: ${JSON.stringify(formattedErrors)}`);
        }
        throw error;
    }
}; 