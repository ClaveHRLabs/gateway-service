/**
 * Configuration for endpoints that bypass authentication
 * Contains path patterns that should be accessible without requiring authentication
 */

// Use central validated config (no direct process.env access)
import { getConfig } from './appConfig';

// Cache for initialized patterns
let patternsInitialized = false;
let publicPatternsCache: Record<string, Array<string | RegExp>> = {};

// Default public endpoint patterns by service
const defaultPublicPatterns: Record<string, Array<string | RegExp>> = {
    // Identity service public endpoints
    id: [
        // Health checks
        '/health',

        // Authentication endpoints
        /^\/api\/auth\/.*/,

        // Auth refresh token
        '/api/auth/refresh-token',

        // Setup code validation
        /^\/api\/setup-codes\/validate.*/,

        // Public organizational endpoints
        /^\/api\/organizations\/public.*/,
    ],

    // Add other services' public endpoints here
    // 'emp': ['/health', '/api/public/*'],
    // 'perf': ['/health', '/api/public/*'],

    // Recruitment service public endpoints
    rec: [
        // Health checks
        '/health',

        // Public recruitment endpoints
        /^\/api\/public\/.*/,
    ],
};

// Initialize patterns with config
async function initializePatterns() {
    if (patternsInitialized) return;

    const Config = await getConfig();
    const result: Record<string, Array<string | RegExp>> = {};

    // Process each service's patterns from environment variables
    for (const servicePrefix of Object.keys(defaultPublicPatterns)) {
        const envVar = `${servicePrefix.toUpperCase()}_PUBLIC_ENDPOINTS`;
        const additionalPatterns = (Config as any)[envVar] || '';

        result[servicePrefix] = [...defaultPublicPatterns[servicePrefix]];

        if (additionalPatterns && typeof additionalPatterns === 'string') {
            const patterns = additionalPatterns.split(',').map((pattern: string) => {
                pattern = pattern.trim();
                // Convert simple glob patterns to RegExp (e.g., "/api/*/public")
                if (pattern.includes('*')) {
                    return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                }
                return pattern;
            });
            result[servicePrefix].push(...patterns);
        }
    }

    publicPatternsCache = result;
    patternsInitialized = true;
}

// Export async getter for patterns
export async function getPublicPatterns(): Promise<Record<string, Array<string | RegExp>>> {
    await initializePatterns();
    return publicPatternsCache;
}

/**
 * Check if a path matches a whitelist pattern for a specific service
 *
 * @param path The path to check
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 * @returns True if the path is whitelisted, false otherwise
 */
export async function isWhitelisted(path: string, servicePrefix: string): Promise<boolean> {
    const patterns = await getPublicPatterns();

    // If no whitelist patterns exist for this service, require authentication
    if (!patterns[servicePrefix]) {
        return false;
    }

    const servicePatterns = patterns[servicePrefix];

    // Check exact string matches
    if (servicePatterns.includes(path)) {
        return true;
    }

    // Check regex pattern matches
    for (const pattern of servicePatterns) {
        if (pattern instanceof RegExp && pattern.test(path)) {
            return true;
        }
    }

    return false;
}

/**
 * Add a pattern to the whitelist at runtime
 *
 * @param pattern The string path or RegExp pattern to add
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 */
export async function addToWhitelist(
    pattern: string | RegExp,
    servicePrefix: string,
): Promise<void> {
    const patterns = await getPublicPatterns();

    // Initialize the service's patterns array if it doesn't exist
    if (!patterns[servicePrefix]) {
        patterns[servicePrefix] = [];
    }

    const servicePatterns = patterns[servicePrefix];

    // Check if string or regex pattern already exists
    const exists = servicePatterns.some((existing) => {
        if (pattern instanceof RegExp && existing instanceof RegExp) {
            return pattern.toString() === existing.toString();
        }
        return pattern === existing;
    });

    if (!exists) {
        servicePatterns.push(pattern);
    }
}

/**
 * Remove a pattern from the whitelist at runtime
 *
 * @param pattern The string path or RegExp pattern to remove
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 */
export async function removeFromWhitelist(
    pattern: string | RegExp,
    servicePrefix: string,
): Promise<void> {
    const patterns = await getPublicPatterns();

    // If no whitelist exists for this service, nothing to do
    if (!patterns[servicePrefix]) {
        return;
    }

    const servicePatterns = patterns[servicePrefix];
    const index = servicePatterns.findIndex((existing) => {
        if (pattern instanceof RegExp && existing instanceof RegExp) {
            return pattern.toString() === existing.toString();
        }
        return pattern === existing;
    });

    if (index !== -1) {
        servicePatterns.splice(index, 1);
    }
}

// For backward compatibility, export synchronous versions that throw if not initialized
export const publicPatterns: Record<string, Array<string | RegExp>> = new Proxy({} as any, {
    get(target, prop) {
        if (!patternsInitialized) {
            throw new Error('Patterns not initialized. Use getPublicPatterns() instead.');
        }
        return publicPatternsCache[prop as string];
    },
});
