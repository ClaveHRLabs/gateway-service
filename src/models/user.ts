import { z } from 'zod';

// Common validation patterns
const patterns = {
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\+?[1-9]\d{1,14}$/,
    date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
    url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
};

// Custom error messages
const messages = {
    required: 'This field is required',
    invalidEmail: 'Invalid email format',
    invalidPhone: 'Invalid phone number format',
    invalidDate: 'Invalid date format',
    invalidUrl: 'Invalid URL format',
    tooLong: 'Value is too long',
    tooShort: 'Value is too short',
    invalidFormat: 'Invalid format',
};

// Base user schema
export const baseUserSchema = z.object({
    id: z.string().regex(patterns.uuid),
    email: z.string().regex(patterns.email, messages.invalidEmail),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().regex(patterns.phone, messages.invalidPhone).optional(),
    avatar: z.string().regex(patterns.url, messages.invalidUrl).optional(),
    metadata: z.record(z.unknown()).optional(),
    additionalData: z.record(z.unknown()).optional(),
    iat: z.number().optional(),
    exp: z.number().optional(),
    sub: z.string().optional(),
    employeeId: z.string().regex(patterns.uuid).optional(),
});

// User roles
export const UserRole = z.enum(['admin', 'manager', 'employee', 'guest']);
export type UserRole = z.infer<typeof UserRole>;

// User status
export const UserStatus = z.enum(['active', 'inactive', 'suspended', 'pending']);
export type UserStatus = z.infer<typeof UserStatus>;

// Complete user schema
export const userSchema = baseUserSchema.extend({
    role: z.string(),
    roles: z.array(z.string()).optional(),
    status: z.string(),
    organizationId: z.string().regex(patterns.uuid).optional().nullable(),
    type: z.enum(['access', 'refresh']),
    createdAt: z.string().regex(patterns.date, messages.invalidDate).optional(),
    updatedAt: z.string().regex(patterns.date, messages.invalidDate).optional(),
    lastLoginAt: z.string().regex(patterns.date, messages.invalidDate).optional(),
    departmentId: z.string().regex(patterns.uuid).optional(),
    managerId: z.string().regex(patterns.uuid).optional().nullable(),
    preferences: z
        .object({
            language: z.string().min(2).max(5),
            timezone: z.string(),
            notifications: z.object({
                email: z.boolean(),
                push: z.boolean(),
                sms: z.boolean(),
            }),
        })
        .optional(),
});

// User creation schema
export const createUserSchema = userSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
});

// User update schema
export const updateUserSchema = createUserSchema.partial();

// User response schema
export const userResponseSchema = z.object({
    success: z.boolean(),
    data: userSchema,
    metadata: z
        .record(z.unknown())
        .refine((data) => Object.keys(data).length <= 50, 'Maximum 50 metadata entries allowed')
        .optional(),
});

// User validation function
export const validateUser = (data: unknown, schema: z.ZodType) => {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code,
            }));
            throw new Error(`User validation failed: ${JSON.stringify(formattedErrors)}`);
        }
        throw error;
    }
};
