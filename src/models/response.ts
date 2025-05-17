import { z } from 'zod';

// Common response patterns
const patterns = {
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
    url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
};

// Base response schema
export const baseResponseSchema = z.object({
    success: z.boolean(),
    timestamp: z.string().regex(patterns.date),
    requestId: z.string().regex(patterns.uuid),
    data: z.unknown(),
    metadata: z.record(z.unknown())
        .refine(
            (data) => Object.keys(data).length <= 50,
            'Maximum 50 metadata entries allowed'
        )
        .optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
    success: z.literal(false),
    timestamp: z.string().regex(patterns.date),
    requestId: z.string().regex(patterns.uuid),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
        stack: z.string().optional(),
    }),
    metadata: z.record(z.unknown())
        .refine(
            (data) => Object.keys(data).length <= 50,
            'Maximum 50 metadata entries allowed'
        )
        .optional(),
});

// Pagination metadata schema
export const paginationSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
});

// Paginated response schema
export const paginatedResponseSchema = baseResponseSchema.extend({
    data: z.array(z.unknown()),
    metadata: z.object({
        pagination: paginationSchema,
    }),
});

// Response validation function
export const validateResponse = (data: unknown, schema: z.ZodType) => {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
                received: err.received,
            }));
            throw new Error(`Response validation failed: ${JSON.stringify(formattedErrors)}`);
        }
        throw error;
    }
}; 