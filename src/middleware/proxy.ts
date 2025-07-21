import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/request';
import { Config } from '../config/config';
import { services, getServiceConfig } from '../config/services';

/**
 * Generic proxy middleware that handles routing to any service
 */
export const proxyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Proxy middleware called for ${req.originalUrl}`);

    try {
        const authenticatedReq = req as AuthenticatedRequest;

        // Extract service identifier from the URL path
        const pathParts = req.originalUrl.split('/');
        const servicePrefix = pathParts[1] || '';
        const serviceName = `${servicePrefix}-service`;

        // Get service configuration
        const serviceConfig = getServiceConfig(serviceName);
        if (!serviceConfig) {
            return res.status(503).json({
                success: false,
                timestamp: new Date().toISOString(),
                requestId: authenticatedReq.requestId,
                error: {
                    code: 'SERVICE_NOT_CONFIGURED',
                    message: `Service ${serviceName} is not configured`,
                    details: 'Please check the service configuration and try again later'
                }
            });
        }

        // Check if the HTTP method is allowed for this service
        if (!serviceConfig.methods.includes(req.method)) {
            return res.status(405).json({
                success: false,
                timestamp: new Date().toISOString(),
                requestId: authenticatedReq.requestId,
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: `Method ${req.method} not allowed for ${serviceName}`,
                    details: `Allowed methods: ${serviceConfig.methods.join(', ')}`
                }
            });
        }

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Forward request ID for idempotency
        headers['x-request-id'] = authenticatedReq.requestId || '';

        const isIdentityService = servicePrefix === 'id';
        const isOrgApi = req.path.includes('/api/organizations/');

        // Forward auth and setup headers for identity service
        if (isIdentityService) {
            // Always forward Authorization header to identity service
            if (req.headers.authorization) {
                headers['Authorization'] = req.headers.authorization as string;
            }

            // Always forward X-Setup-Code header to identity service, especially for org APIs
            if (req.headers['x-setup-code']) {
                logger.debug(`Forwarding X-Setup-Code header for ${req.path}`);
                headers['x-setup-code'] = req.headers['x-setup-code'] as string;
            }
        } else {
            // For non-identity services, remove auth header and add user claims
            delete req.headers.authorization;
        }

        // Forward other special headers used by all services (except setup-code which is handled above for identity)
        if (!isIdentityService || !req.headers['x-setup-code']) {
            ['x-api-key'].forEach(header => {
                if (req.headers[header]) {
                    headers[header] = req.headers[header] as string;
                }
            });
        }

        // For non-identity services, forward user claims if available
        if (authenticatedReq.user && !isIdentityService) {
            // Basic user information
            headers['x-user-id'] = authenticatedReq.user.id;
            headers['x-user-email'] = authenticatedReq.user.email;
            headers['x-user-roles'] = authenticatedReq.user.roles.join(',');
            if (authenticatedReq.user.organizationId) {
                headers['x-organization-id'] = authenticatedReq.user.organizationId;
            }

            // Additional user claims
            if (authenticatedReq.user.firstName) headers['x-user-first-name'] = authenticatedReq.user.firstName;
            if (authenticatedReq.user.lastName) headers['x-user-last-name'] = authenticatedReq.user.lastName;
            if (authenticatedReq.user.department) headers['x-user-department'] = authenticatedReq.user.department;
            if (authenticatedReq.user.position) headers['x-user-position'] = authenticatedReq.user.position;
            if (authenticatedReq.user.permissions) headers['x-user-permissions'] = authenticatedReq.user.permissions.join(',');
            if (authenticatedReq.user.tenantId) headers['x-tenant-id'] = authenticatedReq.user.tenantId;
            if (authenticatedReq.user.locale) headers['x-user-locale'] = authenticatedReq.user.locale;
            if (authenticatedReq.user.timezone) headers['x-user-timezone'] = authenticatedReq.user.timezone;
            if (authenticatedReq.user.lastLogin) headers['x-user-last-login'] = authenticatedReq.user.lastLogin;
            if (authenticatedReq.user.isActive !== undefined) headers['x-user-is-active'] = String(authenticatedReq.user.isActive);

            // Forward metadata as JSON if present
            if (authenticatedReq.user.metadata) {
                headers['x-user-metadata'] = JSON.stringify(authenticatedReq.user.metadata);
            }
        }

        // Construct target URL
        const path = req.path;
        const targetUrl = `${serviceConfig.url}${path}`;
        const method = req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

        logger.debug(`Proxying ${method} request to: ${targetUrl}`);

        // Execute the request based on the method
        let response;
        switch (method) {
            case 'GET':
                response = await axios.get(targetUrl, {
                    headers,
                    params: req.query
                });
                break;
            case 'POST':
                response = await axios.post(targetUrl, req.body, { headers });
                break;
            case 'PUT':
                response = await axios.put(targetUrl, req.body, { headers });
                break;
            case 'PATCH':
                response = await axios.patch(targetUrl, req.body, { headers });
                break;
            case 'DELETE':
                response = await axios.delete(targetUrl, {
                    headers,
                    data: req.body
                });
                break;
            default:
                // Handle other methods
                return res.status(405).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    requestId: authenticatedReq.requestId,
                    error: {
                        code: 'METHOD_NOT_ALLOWED',
                        message: `Method ${method} not supported`
                    }
                });
        }

        // Return the response
        return res.status(response.status).json({
            success: true,
            timestamp: new Date().toISOString(),
            requestId: authenticatedReq.requestId,
            data: response.data?.data || response.data
        });

    } catch (error: any) {
        logger.error(`Proxy error: ${error.message}`);

        const statusCode = error.response?.status || 503;
        const errorData = error.response?.data;

        return res.status(statusCode).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: errorData?.error?.code || errorData?.code || `HTTP_${statusCode}`,
                message: errorData?.error?.message ||
                    errorData?.message ||
                    'Service request failed',
                details: Config.SHOW_ERROR_DETAILS ?
                    (errorData?.error?.details || errorData?.details || error.message) :
                    undefined,
                stack: Config.SHOW_ERROR_STACK ? error.stack : undefined
            }
        });
    }
}; 