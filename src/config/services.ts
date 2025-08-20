
import { ServiceConfig } from '../types/request';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '../utils/constants';
import { getConfig } from './appConfig';

// Shared constants
const METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const);
const DEFAULT_RATE_LIMIT = Object.freeze({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });

// Cache for initialized services
let servicesInitialized = false;
let servicesCache: ReadonlyArray<ServiceConfig> = [];
let serviceMapCache = new Map<string, ServiceConfig>();

// Initialize services configuration
async function initializeServices() {
    if (servicesInitialized) return;

    const Config = await getConfig();

    // Helper to read URL from validated config, fallback to schema defaults already applied
    const url = (key: keyof typeof Config, fallback?: string) => (Config as any)[key] || fallback || '';

    // Raw candidate definitions (no mutation later)
    const CANDIDATES: ReadonlyArray<ServiceConfig> = Object.freeze([
        { name: 'id-service', url: url('IDENTITY_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
        { name: 'emp-service', url: url('EMPLOYEE_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
        { name: 'rec-service', url: url('RECRUITMENT_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
        { name: 'eng-service', url: url('ENGAGEMENT_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
        { name: 'perf-service', url: url('PERFORMANCE_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
        { name: 'nt-service', url: url('NOTIFICATION_SERVICE_URL'), methods: [...METHODS], rateLimit: DEFAULT_RATE_LIMIT },
    ]);

    // Validate and build an indexed map for O(1) lookups
    const serviceMap = new Map<string, ServiceConfig>();
    for (const svc of CANDIDATES) {
        if (!svc.url) {
            console.error('Service URL missing', { service: svc.name, scope: 'servicesConfig' });
            continue; // Skip invalid entry instead of throwing to keep gateway up
        }
        if (!svc.methods?.length) {
            console.error('Service methods missing', { service: svc.name, scope: 'servicesConfig' });
            continue;
        }
        serviceMap.set(svc.name, Object.freeze({ ...svc }));
    }

    // Cache the results
    serviceMapCache = serviceMap;
    servicesCache = Object.freeze(Array.from(serviceMap.values()));
    servicesInitialized = true;
}

// Export async getter functions
export async function getServices(): Promise<ReadonlyArray<ServiceConfig>> {
    await initializeServices();
    return servicesCache;
}

export async function isServiceConfigured(serviceName: string): Promise<boolean> {
    await initializeServices();
    return serviceMapCache.has(serviceName);
}

export async function getServiceConfig(serviceName: string): Promise<ServiceConfig | undefined> {
    await initializeServices();
    return serviceMapCache.get(serviceName);
}

// For backward compatibility, export synchronous versions that throw if not initialized
export const services: ReadonlyArray<ServiceConfig> = new Proxy([] as any, {
    get(target, prop) {
        if (!servicesInitialized) {
            throw new Error('Services not initialized. Use getServices() instead.');
        }
        return servicesCache[prop as any];
    }
});