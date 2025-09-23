/**
 * Progress Stream API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Server-Sent Events (SSE) streaming
 * - Real-time progress updates
 *
 * Task: T038 - Implement /api/itinerary/progress-simple endpoint
 */
export declare const config: {
    runtime: string;
};
/**
 * GET /api/itinerary/progress-simple
 * Server-Sent Events stream for real-time progress updates
 */
export default function handler(request: Request): Promise<Response>;
