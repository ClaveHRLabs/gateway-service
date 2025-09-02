
// Centralized constants for gateway-service
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100;
export const STATUS_CONFIGURED = 'configured';

export const HEADER_REQUEST_ID = 'x-request-id';

export const HEADER_CONTENT_TYPE = 'content-type';
export const HEADER_AUTHORIZATION = 'authorization';
export const MEDIA_MULTIPART = 'multipart/form-data';
export const DEFAULT_CONTENT_TYPE = 'application/json';

export const ERROR_UNAUTHORIZED = 'UNAUTHORIZED';
export const ERROR_METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED';
export const ERROR_SERVICE_NOT_CONFIGURED = 'SERVICE_NOT_CONFIGURED';
export const ERROR_RESPONSE_VALIDATION = 'RESPONSE_VALIDATION_ERROR';
export const ERROR_INTERNAL = 'INTERNAL_SERVER_ERROR';
