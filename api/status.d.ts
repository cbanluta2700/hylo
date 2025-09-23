/**
 * API Status Dashboard Endpoint
 *
 * Provides detailed status information for all API endpoints
 * Used for monitoring and debugging API health
 */
export declare const config: {
    runtime: string;
};
/**
 * Main status check handler
 */
export default function handler(req: Request): Promise<Response>;
export declare function GET(req: Request): Promise<Response>;
export declare function OPTIONS(req: Request): Promise<Response>;
