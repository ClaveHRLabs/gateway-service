import express from 'express';
import axios, { AxiosError } from 'axios';
import { Config } from '../config/config';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/request';
import { services } from '../config/services';

const router = express.Router();
const identityServiceUrl = Config.get('IDENTITY_SERVICE_URL', 'http://localhost:3001');

// Health endpoint
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${identityServiceUrl}/health`);

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            data: response.data
        });
    } catch (error: any) {
        logger.error('Error accessing identity service health:', error);

        return res.status(503).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Identity service is currently unavailable',
                details: Config.SHOW_ERROR_DETAILS ? (error instanceof Error ? error.message : 'Unknown error') : undefined
            }
        });
    }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
    try {
        const response = await axios.post(
            `${identityServiceUrl}/api/auth/refresh-token`,
            req.body,
            { headers: { 'Content-Type': 'application/json' } }
        );

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            data: response.data
        });
    } catch (error: any) {
        logger.error('Error refreshing token:', error);

        return res.status(error.response?.status || 503).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: 'AUTH_ERROR',
                message: error.response?.data?.message || 'Token refresh failed',
                details: Config.SHOW_ERROR_DETAILS ? (error instanceof Error ? error.message : 'Unknown error') : undefined
            }
        });
    }
});

// Current user (me) endpoint
router.get('/me', async (req, res) => {
    try {
        // Forward the authorization header
        const headers = {
            'Authorization': req.headers.authorization
        };

        const response = await axios.get(
            `${identityServiceUrl}/api/users/me`,
            { headers }
        );

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            data: response.data
        });
    } catch (error: any) {
        logger.error('Error retrieving current user:', error);

        // Get status code from error response if available
        const statusCode = error.response?.status || 503;

        return res.status(statusCode).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as AuthenticatedRequest).requestId,
            error: {
                code: statusCode === 401 ? 'UNAUTHORIZED' : 'USER_FETCH_ERROR',
                message: error.response?.data?.message || 'Failed to retrieve user information',
                details: Config.SHOW_ERROR_DETAILS ? (error instanceof Error ? error.message : 'Unknown error') : undefined
            }
        });
    }
});

// Add other identity service routes as needed

export default router;