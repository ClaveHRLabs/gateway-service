import { Request, Response, NextFunction, HttpStatusCode, CatchErrors, Measure } from '@vspl/core';
import axios, { AxiosRequestConfig } from 'axios';
import proxy from 'express-http-proxy';
import { OutgoingHttpHeaders } from 'http';
import { AuthenticatedRequest } from '../types/request';
import { getServiceConfig } from '../config/services';
import {
    DEFAULT_CONTENT_TYPE,
    ERROR_METHOD_NOT_ALLOWED,
    ERROR_SERVICE_NOT_CONFIGURED,
    HEADER_REQUEST_ID,
    MEDIA_MULTIPART,
} from '../utils/constants';

// Type augmentation for headers to prevent TypeScript errors
interface ExtendedHeaders extends OutgoingHttpHeaders {
    [key: string]: string | string[] | number | undefined;
}

/**
 * Helper function to create a proxy middleware for multipart/form-data requests
 */
export const createMultipartProxy = (serviceUrl: string) => {
    return proxy(serviceUrl, {
        proxyReqPathResolver: function (req) {
            return req.path;
        },
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
            // We need to handle headers properly for TypeScript
            proxyReqOpts.headers ??= {};

            // Cast headers to our extended type
            const headers = proxyReqOpts.headers as ExtendedHeaders;

            // Forward the original headers that we need
            const srcHeaders = srcReq.headers;
            if (srcHeaders && typeof srcHeaders === 'object') {
                // Safely handle x-request-id
                const requestId = srcHeaders['x-request-id'];
                if (requestId) {
                    headers['x-request-id'] = requestId.toString();
                }

                // Safely handle content-type
                const contentType = srcHeaders['content-type'];
                if (contentType) {
                    headers['content-type'] = contentType.toString();
                }

                // Safely handle authorization
                const authorization = srcHeaders.authorization;
                if (authorization) {
                    headers['authorization'] = authorization.toString();
                }

                // Copy other important headers from the source request
                const headersToForward = [
                    'x-organization-id',
                    'x-user-id',
                    'x-user-email',
                    'x-user-roles',
                    'x-employee-id',
                    'x-setup-code',
                ];

                headersToForward.forEach((header) => {
                    const value = srcHeaders[header];
                    if (value) {
                        headers[header] = value.toString();
                    }
                });
            }

            return proxyReqOpts;
        },
    });
};

/**
 * Generic proxy middleware that handles routing to any service
 */
class GatewayProxy {
    private now() {
        return new Date().toISOString();
    }

    private buildError(
        code: string | number,
        message: string,
        requestId?: string,
        details?: string,
    ) {
        return {
            success: false,
            timestamp: this.now(),
            requestId,
            error: { code, message, ...(details ? { details } : {}) },
        };
    }

    private extractServiceName(req: Request) {
        const servicePrefix = (req.originalUrl.split('/')[1] || '').trim();
        return {
            servicePrefix,
            serviceName: `${servicePrefix}-service`,
        };
    }

    private methodNotAllowed(
        res: Response,
        req: Request,
        requestId?: string,
        serviceName?: string,
        allowed?: string[],
    ) {
        return res
            .status(HttpStatusCode.METHOD_NOT_ALLOWED)
            .json(
                this.buildError(
                    ERROR_METHOD_NOT_ALLOWED,
                    `Method ${req.method} not allowed for ${serviceName}`,
                    requestId,
                    allowed ? `Allowed methods: ${allowed.join(', ')}` : undefined,
                ),
            );
    }

    private buildBaseHeaders(req: Request, requestId?: string) {
        const headers: Record<string, string> = {};
        headers['Content-Type'] = (req.headers['content-type'] as string) || DEFAULT_CONTENT_TYPE;
        if (requestId) headers[HEADER_REQUEST_ID] = requestId;
        return headers;
    }

    private applyIdentityHeaders(
        req: Request,
        headers: Record<string, string>,
        isIdentityService: boolean,
    ) {
        if (!isIdentityService) return;
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
        if (req.headers['x-setup-code'])
            headers['x-setup-code'] = req.headers['x-setup-code'] as string;
    }

    private applyGenericForwardHeaders(
        req: Request,
        headers: Record<string, string>,
        isIdentityService: boolean,
    ) {
        if (!isIdentityService || !req.headers['x-setup-code']) {
            ['x-api-key'].forEach((h) => {
                if (req.headers[h]) headers[h] = req.headers[h] as string;
            });
        }
    }

    private applyUserHeaders(
        headers: Record<string, string>,
        authenticatedReq: AuthenticatedRequest,
        isIdentityService: boolean,
    ) {
        const user = authenticatedReq.user;
        if (!user || isIdentityService) return;

        const simpleMap: Record<string, string | undefined> = {
            'x-user-id': user.id,
            'x-user-email': user.email,
            'x-user-roles': user.roles?.join(','),
            'x-organization-id': user.organizationId,
            'x-employee-id': user.employeeId,
            'x-user-first-name': user.firstName,
            'x-user-last-name': user.lastName,
            'x-user-department': user.department,
            'x-user-position': user.position,
            'x-user-permissions': user.permissions?.join(','),
            'x-tenant-id': user.tenantId,
            'x-user-locale': user.locale,
            'x-user-timezone': user.timezone,
            'x-user-last-login': user.lastLogin,
            'x-user-is-active': user.isActive !== undefined ? String(user.isActive) : undefined,
        };
        Object.entries(simpleMap).forEach(([k, v]) => v !== undefined && (headers[k] = v));

        if (user.metadata) {
            headers['x-user-metadata'] = JSON.stringify(user.metadata);
        }
    }

    @CatchErrors({ rethrow: false })
    @Measure({ log: true, metricName: 'forwardRequest', logLevel: 'info' })
    public async forwardRequest(
        method: string,
        url: string,
        req: Request,
        headers: Record<string, string>,
    ) {
        const axiosConfig: AxiosRequestConfig = {
            validateStatus: () => true, // Don't throw errors for any status code
            timeout: 2000,
        };

        switch (method) {
            case 'GET':
                return axios.get(url, { headers, params: req.query, ...axiosConfig });
            case 'POST': {
                if (req.headers['content-type']?.includes(MEDIA_MULTIPART)) {
                    return axios.post(url, req, {
                        headers,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                        transformRequest: [(d) => d],
                        ...axiosConfig,
                    });
                }
                return axios.post(url, req.body, { headers, ...axiosConfig });
            }
            case 'PUT':
                return axios.put(url, req.body, { headers, ...axiosConfig });
            case 'PATCH':
                return axios.patch(url, req.body, { headers, ...axiosConfig });
            case 'DELETE':
                return axios.delete(url, { headers, data: req.body, ...axiosConfig });
            default:
                return null;
        }
    }

    private handleMultipartDirect(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction,
        serviceUrl: string,
    ) {
        if (!req.user) return;
        req.headers['x-user-id'] = req.user.id;
        req.headers['x-user-email'] = req.user.email;
        req.headers['x-user-roles'] = req.user.roles.join(',');
        if (req.user.organizationId) req.headers['x-organization-id'] = req.user.organizationId;
        if (req.user.employeeId) req.headers['x-employee-id'] = req.user.employeeId;

        const handler = createMultipartProxy(serviceUrl);
        handler(req as any, res as any, next);
    }

    @CatchErrors({ rethrow: false })
    @Measure({ log: true, metricName: 'handle', logLevel: 'info' })
    async handle(req: Request, res: Response, next: NextFunction) {
        const authenticatedReq = req as AuthenticatedRequest;
        const { servicePrefix, serviceName } = this.extractServiceName(req);

        const serviceConfig = await getServiceConfig(serviceName);
        if (!serviceConfig) {
            return res
                .status(HttpStatusCode.SERVICE_UNAVAILABLE)
                .json(
                    this.buildError(
                        ERROR_SERVICE_NOT_CONFIGURED,
                        `Service ${serviceName} is not configured`,
                        authenticatedReq.requestId,
                        'Please check the service configuration and try again later',
                    ),
                );
        }

        if (!serviceConfig.methods.includes(req.method)) {
            return this.methodNotAllowed(
                res,
                req,
                authenticatedReq.requestId,
                serviceName,
                serviceConfig.methods,
            );
        }

        // Multipart early path
        if (req.headers['content-type']?.includes(MEDIA_MULTIPART)) {
            this.handleMultipartDirect(authenticatedReq, res, next, serviceConfig.url);
            return;
        }

        const isIdentityService = servicePrefix === 'id';
        if (!isIdentityService) delete req.headers.authorization;

        const headers = this.buildBaseHeaders(req, authenticatedReq.requestId);
        this.applyIdentityHeaders(req, headers, isIdentityService);
        this.applyGenericForwardHeaders(req, headers, isIdentityService);
        this.applyUserHeaders(headers, authenticatedReq, isIdentityService);

        const targetUrl = `${serviceConfig.url}${req.path}`;
        const response = await this.forwardRequest(req.method, targetUrl, req, headers);

        if (!response) {
            return res
                .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                .json(
                    this.buildError(
                        HttpStatusCode.INTERNAL_SERVER_ERROR,
                        `Failed request at service ${serviceName}`,
                        authenticatedReq.requestId,
                    ),
                );
        }

        return res.status(response.status).json({
            success: true,
            timestamp: this.now(),
            requestId: authenticatedReq.requestId,
            data: response.data?.data || response.data,
        });
    }
}

const gatewayProxy = new GatewayProxy();
export const proxyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await gatewayProxy.handle(req, res, next);
    } catch (error) {
        next(error);
    }
};
