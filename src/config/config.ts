import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export class Config {
    // Required variables
    public static readonly NODE_ENV: string = Config.getRequired('NODE_ENV');
    public static readonly PORT: number = Number(Config.getRequired('PORT'));
    public static readonly JWT_SECRET: string = Config.getRequired('JWT_SECRET');
    public static readonly LOG_LEVEL: string = Config.get('LOG_LEVEL', 'info');
    public static readonly SERVICE_NAME: string = Config.get('SERVICE_NAME', 'gateway-service');
    public static readonly API_PREFIX: string = Config.get('API_PREFIX', '');

    // Error handling configuration
    public static readonly SHOW_ERROR_STACK: boolean = Config.get('SHOW_ERROR_STACK', 'false').toLowerCase() === 'true';
    public static readonly SHOW_ERROR_DETAILS: boolean = Config.get('SHOW_ERROR_DETAILS', 'false').toLowerCase() === 'true';

    // Add more variables as needed

    private static getRequired(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    public static get(key: string, defaultValue?: string): string {
        return process.env[key] || defaultValue || '';
    }
} 