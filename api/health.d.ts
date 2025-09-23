/**
 * Health Check Endpoint for AI-Powered Itinerary Generation
 *
 * Verifies Edge Runtime compatibility and environment configuration
 * Constitutional requirement: All API endpoints must use Edge Runtime
 *
 * Compatible with Vercel Edge Runtime and Web APIs
 */
export declare const config: {
    runtime: string;
};
/**
 * GET /api/health - Health check endpoint
 * Web API compatible handler for Vercel Edge Runtime
 */
export default function handler(req: Request): Promise<Response>;
/**
 * Handle HTTP method routing
 */
export declare function GET(req: Request): Promise<Response>;
export declare function OPTIONS(req: Request): Promise<Response>;
