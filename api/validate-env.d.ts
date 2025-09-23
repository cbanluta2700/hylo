/**
 * Environment Variable Validation Endpoint
 *
 * Tests all required API keys and service connections for AI workflow
 * Constitutional requirement: All API endpoints must use Edge Runtime
 */
export declare const config: {
    runtime: string;
};
/**
 * GET /api/validate-env - Validate all environment variables and connections
 */
export default function handler(req: Request): Promise<Response>;
/**
 * Handle HTTP methods
 */
export declare function GET(req: Request): Promise<Response>;
export declare function OPTIONS(req: Request): Promise<Response>;
