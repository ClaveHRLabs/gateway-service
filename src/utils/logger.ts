import { createLogger } from '@vspl/core';

// Gateway logger now uses core logger with automatic caller tagging
export const logger = createLogger({ service: 'gateway' });

export default logger;
