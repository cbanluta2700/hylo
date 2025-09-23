/**
 * Generate Itinerary API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Zod v    console.log('✅ [28] API Generate: Request validated successfully', {
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults || 0} adults, ${formData.children || 0} children`,
      dates: `${formData.departDate} to ${formData.returnDate}`
    });ion at API boundaries
 * - Structured error handling
 *
 * Task: T036 - Implement /api/itinerary/generate endpoint
 */
export declare const config: {
    runtime: string;
};
/**
 * POST /api/itinerary/generate
 * Initiates AI workflow for itinerary generation
 */
export default function handler(request: Request): Promise<Response>;
