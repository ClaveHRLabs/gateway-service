/**
 * Configuration for endpoints that bypass authentication
 * Contains path patterns that should be accessible without requiring authentication
 */

// Get environment variables directly to avoid circular dependencies
const getEnvVar = (key: string, defaultValue: string = ''): string => {
    return process.env[key] || defaultValue;
};

// Default public endpoint patterns by service
const defaultPublicPatterns: Record<string, Array<string | RegExp>> = {
    // Identity service public endpoints
    'id': [
        // Health checks
        '/health',

        // Authentication endpoints
        /^\/api\/auth\/.*/,

        // Auth refresh token
        '/api/auth/refresh-token',

        // Setup code validation
        /^\/api\/setup-codes\/validate.*/,

        // Public organizational endpoints
        /^\/api\/organizations\/public.*/
    ],

    // Add other services' public endpoints here
    // 'emp': ['/health', '/api/public/*'],
    // 'perf': ['/health', '/api/public/*'],
};

// Get additional public endpoint patterns from environment variables
const getAdditionalPublicPatterns = (): Record<string, Array<string | RegExp>> => {
    const result: Record<string, Array<string | RegExp>> = {};

    // Process each service's patterns from environment variables
    Object.keys(defaultPublicPatterns).forEach(servicePrefix => {
        const envVar = `${servicePrefix.toUpperCase()}_PUBLIC_ENDPOINTS`;
        const additionalPatterns = getEnvVar(envVar);

        if (!additionalPatterns) {
            result[servicePrefix] = [];
            return;
        }

        result[servicePrefix] = additionalPatterns.split(',').map(pattern => {
            pattern = pattern.trim();
            // Convert simple glob patterns to RegExp (e.g., "/api/*/public")
            if (pattern.includes('*')) {
                return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            }
            return pattern;
        });
    });

    return result;
};

// Combine default and environment-specific patterns for each service
const additionalPatterns = getAdditionalPublicPatterns();
export const publicPatterns: Record<string, Array<string | RegExp>> =
    Object.keys(defaultPublicPatterns).reduce((result, servicePrefix) => {
        result[servicePrefix] = [
            ...defaultPublicPatterns[servicePrefix],
            ...(additionalPatterns[servicePrefix] || [])
        ];
        return result;
    }, {} as Record<string, Array<string | RegExp>>);

/**
 * Check if a path matches a whitelist pattern for a specific service
 * 
 * @param path The path to check
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 * @returns True if the path is whitelisted, false otherwise
 */
export const isWhitelisted = (path: string, servicePrefix: string): boolean => {
    // If no whitelist patterns exist for this service, require authentication
    if (!publicPatterns[servicePrefix]) {
        return false;
    }

    const patterns = publicPatterns[servicePrefix];

    // Check exact string matches
    if (patterns.includes(path)) {
        return true;
    }

    // Check regex pattern matches
    for (const pattern of patterns) {
        if (pattern instanceof RegExp && pattern.test(path)) {
            return true;
        }
    }

    return false;
};

/**
 * Add a pattern to the whitelist at runtime
 * 
 * @param pattern The string path or RegExp pattern to add
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 */
export const addToWhitelist = (pattern: string | RegExp, servicePrefix: string): void => {
    // Initialize the service's patterns array if it doesn't exist
    if (!publicPatterns[servicePrefix]) {
        publicPatterns[servicePrefix] = [];
    }

    const patterns = publicPatterns[servicePrefix];

    // Check if string or regex pattern already exists
    const exists = patterns.some(existing => {
        if (pattern instanceof RegExp && existing instanceof RegExp) {
            return pattern.toString() === existing.toString();
        }
        return pattern === existing;
    });

    if (!exists) {
        patterns.push(pattern);
    }
};

/**
 * Remove a pattern from the whitelist at runtime
 * 
 * @param pattern The string path or RegExp pattern to remove
 * @param servicePrefix The service prefix (e.g., 'id', 'emp')
 */
export const removeFromWhitelist = (pattern: string | RegExp, servicePrefix: string): void => {
    // If no whitelist exists for this service, nothing to do
    if (!publicPatterns[servicePrefix]) {
        return;
    }

    const patterns = publicPatterns[servicePrefix];
    const index = patterns.findIndex(existing => {
        if (pattern instanceof RegExp && existing instanceof RegExp) {
            return pattern.toString() === existing.toString();
        }
        return pattern === existing;
    });

    if (index !== -1) {
        patterns.splice(index, 1);
    }
}; 