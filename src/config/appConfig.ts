import { AppConfig, AppConfigSchema, loadAppConfig } from '@vspl/core';
import { z } from 'zod';

export const GatewayConfigSchema = AppConfigSchema.extend({
    PORT: z.coerce.number().default(5001),
    API_PREFIX: z.string().default('/'),
    SHOW_ERROR_STACK: z.string().optional().transform(v => (v ? v.toLowerCase() === 'true' : false)),
    SHOW_ERROR_DETAILS: z.string().optional().transform(v => (v ? v.toLowerCase() === 'true' : false)), JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    IDENTITY_SERVICE_URL: z.string().url().default('http://localhost:5002'),
    EMPLOYEE_SERVICE_URL: z.string().url().default('http://localhost:5003'),
    RECRUITMENT_SERVICE_URL: z.string().url().default('http://localhost:5004'),
    ENGAGEMENT_SERVICE_URL: z.string().url().default('http://localhost:5005'),
    PERFORMANCE_SERVICE_URL: z.string().url().default('http://localhost:5006'),
    NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:5010'),
    // Optional public endpoint patterns (comma-separated) per service
    ID_PUBLIC_ENDPOINTS: z.string().optional().default(''),
    EMP_PUBLIC_ENDPOINTS: z.string().optional().default(''),
    PERF_PUBLIC_ENDPOINTS: z.string().optional().default(''),
    REC_PUBLIC_ENDPOINTS: z.string().optional().default(''),
    ENG_PUBLIC_ENDPOINTS: z.string().optional().default(''),
    NOTIF_PUBLIC_ENDPOINTS: z.string().optional().default(''),
});

export interface GatewayConfig extends AppConfig {
    PORT: number;
    API_PREFIX: string;
    SHOW_ERROR_STACK: boolean;
    SHOW_ERROR_DETAILS: boolean;
    JWT_SECRET: string;
    IDENTITY_SERVICE_URL: string;
    EMPLOYEE_SERVICE_URL: string;
    RECRUITMENT_SERVICE_URL: string;
    ENGAGEMENT_SERVICE_URL: string;
    PERFORMANCE_SERVICE_URL: string;
    NOTIFICATION_SERVICE_URL: string;
    ID_PUBLIC_ENDPOINTS?: string;
    EMP_PUBLIC_ENDPOINTS?: string;
    PERF_PUBLIC_ENDPOINTS?: string;
    REC_PUBLIC_ENDPOINTS?: string;
    ENG_PUBLIC_ENDPOINTS?: string;
    NOTIF_PUBLIC_ENDPOINTS?: string;
}

// Load configuration using the async loadAppConfig with options
const loadConfigOptions = {
    env: process.env,
    useAwsSecrets: true,
    useLocalEnvOverride: process.env.USE_LOCAL_ENV_OVERRIDE === 'true',
};

// Create async config loader function
async function createConfig(): Promise<GatewayConfig> {
    const baseConfig = await loadAppConfig(loadConfigOptions);

    // Validate against gateway-specific schema
    const result = GatewayConfigSchema.safeParse(baseConfig);
    if (!result.success) {
        throw new Error(`Gateway configuration validation failed: ${result.error.message}`);
    }

    return {
        ...result.data,
        SERVICE_NAME: result.data.SERVICE_NAME || 'gateway-service'
    } as GatewayConfig;
}

// Export the config promise
export const configPromise = createConfig();

// For backward compatibility, export a function to get the config
export async function getConfig(): Promise<GatewayConfig> {
    return await configPromise;
}

// Default export for backward compatibility
export default getConfig;
