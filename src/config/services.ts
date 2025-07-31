import { ServiceConfig } from '../types/request';
import { logger } from '../utils/logger';

// Get service URLs directly from environment variables to avoid circular dependencies
const getServiceUrl = (envVarName: string, defaultValue: string): string => {
    return process.env[envVarName] || defaultValue;
};

// Validate service configuration
const validateServiceConfig = (service: ServiceConfig): void => {
    if (!service.url) {
        throw new Error(`Service URL not configured for ${service.name}`);
    }
    if (!service.methods || service.methods.length === 0) {
        throw new Error(`Service methods not configured for ${service.name}`);
    }
};

// Service configuration with validation
export const services: ServiceConfig[] = [
    {
        name: 'id-service',
        url: getServiceUrl('IDENTITY_SERVICE_URL', 'http://localhost:5002'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
    },
    {
        name: 'emp-service',
        url: getServiceUrl('EMPLOYEE_SERVICE_URL', 'http://localhost:5003'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        },
    },
    {
        name: 'rec-service',
        url: getServiceUrl('RECRUITMENT_SERVICE_URL', 'http://localhost:5004'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
    },
    {
        name: 'eng-service',
        url: getServiceUrl('ENGAGEMENT_SERVICE_URL', 'http://localhost:5005'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
    },
    {
        name: 'perf-service',
        url: getServiceUrl('PERFORMANCE_SERVICE_URL', 'http://localhost:5006'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
    },
    {
        name: 'nt-service',
        url: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://localhost:5010'),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
        },
    },
    
    // Add other services as needed
].map(service => {
    try {
        validateServiceConfig(service);
        return service;
    } catch (error) {
        logger.error(`Service configuration error for ${service.name}:`, error);
        throw error;
    }
});

// Helper function to check if a service is configured
export const isServiceConfigured = (serviceName: string): boolean => {
    return services.some(service => service.name === serviceName);
};

// Helper function to get service configuration
export const getServiceConfig = (serviceName: string): ServiceConfig | undefined => {
    return services.find(service => service.name === serviceName);
}; 