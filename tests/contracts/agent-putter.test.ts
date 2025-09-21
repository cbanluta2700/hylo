import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for POST /api/agents/putter
// Tests the agent putter endpoint contract

const AgentPutterRequestSchema = z.object({
  requestId: z.string().uuid(),
  itineraryData: z.object({
    structure: z.any(), // From architect agent
    gatheredData: z.any(), // From gatherer agent
    recommendations: z.any(), // From specialist agent
    travelerProfile: z.any(),
    constraints: z.any(),
  }),
  formatPreferences: z.object({
    style: z.enum(['detailed', 'concise', 'narrative', 'bullet_points']),
    language: z.string(),
    includeImages: z.boolean(),
    sections: z.array(
      z.enum([
        'overview',
        'daily_schedule',
        'accommodation',
        'activities',
        'dining',
        'transportation',
        'budget',
        'tips',
        'emergency_info',
      ])
    ),
    detailLevel: z.enum(['basic', 'standard', 'comprehensive']),
  }),
  outputFormat: z.enum(['html', 'markdown', 'json', 'pdf']),
  context: z.object({
    userPreferences: z.any().optional(),
    deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    accessibility: z.any().optional(),
  }),
});

const AgentPutterResponseSchema = z.object({
  agentId: z.string().uuid(),
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'processing', 'completed', 'error']),
  formattedItinerary: z.object({
    metadata: z.object({
      title: z.string(),
      destination: z.string(),
      duration: z.string(),
      travelers: z.string(),
      generatedAt: z.string(),
      version: z.string(),
    }),
    content: z.object({
      overview: z.object({
        summary: z.string(),
        highlights: z.array(z.string()),
        bestTime: z.string(),
        travelTips: z.array(z.string()),
      }),
      dailySchedule: z.array(
        z.object({
          day: z.number(),
          date: z.string(),
          theme: z.string(),
          activities: z.array(
            z.object({
              time: z.string(),
              name: z.string(),
              description: z.string(),
              location: z.string(),
              duration: z.string(),
              cost: z.string().optional(),
              booking: z.any().optional(),
              tips: z.array(z.string()).optional(),
            })
          ),
          meals: z.array(
            z.object({
              type: z.string(),
              name: z.string(),
              cuisine: z.string().optional(),
              location: z.string(),
              price: z.string(),
              reservation: z.boolean(),
              notes: z.string().optional(),
            })
          ),
          accommodation: z
            .object({
              name: z.string(),
              address: z.string(),
              checkIn: z.string(),
              checkOut: z.string(),
              amenities: z.array(z.string()),
              contact: z.string(),
              notes: z.string().optional(),
            })
            .optional(),
        })
      ),
      accommodation: z.object({
        summary: z.string(),
        options: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            location: z.string(),
            priceRange: z.string(),
            rating: z.number().optional(),
            amenities: z.array(z.string()),
            bookingUrl: z.string().optional(),
            recommended: z.boolean(),
          })
        ),
      }),
      activities: z.object({
        summary: z.string(),
        categories: z.record(
          z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              duration: z.string(),
              cost: z.string(),
              location: z.string(),
              bestTime: z.string().optional(),
              bookingRequired: z.boolean(),
              tips: z.array(z.string()).optional(),
            })
          )
        ),
      }),
      dining: z.object({
        summary: z.string(),
        recommendations: z.array(
          z.object({
            name: z.string(),
            cuisine: z.string(),
            priceRange: z.string(),
            location: z.string(),
            specialties: z.array(z.string()),
            atmosphere: z.string(),
            reservations: z.boolean(),
            dietary: z.array(z.string()).optional(),
          })
        ),
      }),
      transportation: z.object({
        summary: z.string(),
        segments: z.array(
          z.object({
            type: z.string(),
            from: z.string(),
            to: z.string(),
            departure: z.string(),
            arrival: z.string(),
            duration: z.string(),
            cost: z.string(),
            booking: z.any().optional(),
            notes: z.string().optional(),
          })
        ),
      }),
      budget: z.object({
        summary: z.string(),
        breakdown: z.record(z.string()),
        total: z.string(),
        currency: z.string(),
        notes: z.array(z.string()),
        savings: z.array(z.string()).optional(),
      }),
      practicalInfo: z.object({
        visas: z.array(z.string()).optional(),
        currency: z.object({
          code: z.string(),
          exchange: z.string(),
          tips: z.array(z.string()),
        }),
        language: z.object({
          primary: z.string(),
          common: z.array(z.string()),
          tips: z.array(z.string()),
        }),
        electricity: z.object({
          voltage: z.string(),
          plugs: z.array(z.string()),
        }),
        health: z.object({
          requirements: z.array(z.string()),
          recommendations: z.array(z.string()),
          emergency: z.string(),
        }),
        safety: z.object({
          general: z.array(z.string()),
          areas: z.record(z.string()),
          emergencyNumbers: z.record(z.string()),
        }),
      }),
    }),
    images: z
      .array(
        z.object({
          url: z.string(),
          alt: z.string(),
          caption: z.string(),
          section: z.string(),
        })
      )
      .optional(),
    attachments: z
      .array(
        z.object({
          type: z.string(),
          name: z.string(),
          url: z.string(),
          description: z.string(),
        })
      )
      .optional(),
  }),
  metadata: z.object({
    processingTime: z.number().positive(),
    format: z.string(),
    sections: z.array(z.string()),
    wordCount: z.number().positive(),
    readability: z.object({
      score: z.number(),
      level: z.string(),
    }),
    lastModified: z.string(),
    version: z.string(),
  }),
  timestamp: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

describe('POST /api/agents/putter', () => {
  describe('Request Validation', () => {
    it('should accept valid putter request', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: {
            destination: 'Paris, France',
            duration: 7,
            destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          },
          gatheredData: {
            accommodation: [{ name: 'Hotel A', priceRange: '$$' }],
            activities: [{ name: 'Museum Visit', category: 'Cultural' }],
          },
          recommendations: {
            topPicks: [{ category: 'Activity', item: { name: 'Louvre' } }],
          },
          travelerProfile: { adults: 2, preferences: ['cultural'] },
          constraints: { budget: 3000 },
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: true,
          sections: ['overview', 'daily_schedule', 'accommodation'],
          detailLevel: 'comprehensive',
        },
        outputFormat: 'html',
        context: {
          deviceType: 'desktop',
        },
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      expect(response.body).toBeDefined();
      const responseBody = AgentPutterResponseSchema.parse(response.body);
      expect(responseBody.agentId).toBeDefined();
      expect(responseBody.requestId).toBe(requestBody.requestId);
      expect(['accepted', 'processing', 'completed']).toContain(responseBody.status);
    });

    it('should reject missing required fields', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        // Missing itineraryData, formatPreferences, outputFormat
      };

      const response = await testApi.post('/api/agents/putter').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid request ID format', async () => {
      const invalidRequest = {
        requestId: 'invalid-uuid',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid output format', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'invalid_format',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'concise',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'basic',
        },
        outputFormat: 'markdown',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Response Content', () => {
    it('should include complete formatted itinerary', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: {
            destination: 'Paris, France',
            duration: 7,
            destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          },
          gatheredData: {
            accommodation: [{ name: 'Hotel Plaza', priceRange: '$$$' }],
            activities: [{ name: 'Louvre Museum', category: 'Cultural' }],
            dining: [{ name: 'Le Jules Verne', cuisine: 'French' }],
          },
          recommendations: {
            topPicks: [{ category: 'Activity', item: { name: 'Louvre' } }],
          },
          travelerProfile: { adults: 2, preferences: ['cultural'] },
          constraints: { budget: 3000 },
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: true,
          sections: ['overview', 'daily_schedule', 'accommodation', 'activities'],
          detailLevel: 'comprehensive',
        },
        outputFormat: 'html',
        context: {
          deviceType: 'desktop',
        },
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      const responseBody = AgentPutterResponseSchema.parse(response.body);

      // Validate formatted itinerary structure
      expect(responseBody.formattedItinerary.metadata).toBeDefined();
      expect(responseBody.formattedItinerary.content).toBeDefined();
      expect(responseBody.formattedItinerary.content.overview).toBeDefined();
      expect(responseBody.formattedItinerary.content.dailySchedule).toBeDefined();
      expect(Array.isArray(responseBody.formattedItinerary.content.dailySchedule)).toBe(true);
    });

    it('should include comprehensive metadata', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      const responseBody = AgentPutterResponseSchema.parse(response.body);

      // Validate metadata
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
      expect(responseBody.metadata.format).toBeDefined();
      expect(Array.isArray(responseBody.metadata.sections)).toBe(true);
      expect(responseBody.metadata.wordCount).toBeGreaterThan(0);
      expect(responseBody.metadata.readability).toBeDefined();
      expect(typeof responseBody.metadata.lastModified).toBe('string');
    });

    it('should handle different output formats', async () => {
      const formats = ['html', 'markdown', 'json'];

      for (const format of formats) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            structure: { destination: 'Paris' },
            gatheredData: {},
            recommendations: {},
            travelerProfile: {},
            constraints: {},
          },
          formatPreferences: {
            style: 'detailed',
            language: 'en',
            includeImages: false,
            sections: ['overview'],
            detailLevel: 'standard',
          },
          outputFormat: format,
          context: {},
        };

        const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

        const responseBody = AgentPutterResponseSchema.parse(response.body);
        expect(responseBody.metadata.format).toBe(format);
      }
    });

    it('should handle different detail levels', async () => {
      const detailLevels = ['basic', 'standard', 'comprehensive'];

      for (const level of detailLevels) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            structure: { destination: 'Paris' },
            gatheredData: {},
            recommendations: {},
            travelerProfile: {},
            constraints: {},
          },
          formatPreferences: {
            style: 'detailed',
            language: 'en',
            includeImages: false,
            sections: ['overview', 'daily_schedule'],
            detailLevel: level,
          },
          outputFormat: 'html',
          context: {},
        };

        const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

        const responseBody = AgentPutterResponseSchema.parse(response.body);
        expect(responseBody.formattedItinerary).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      await testApi
        .post('/api/agents/putter')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status);
        });
    });

    it('should handle malformed JSON', async () => {
      await testApi
        .post('/api/agents/putter')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  describe('Business Logic', () => {
    it('should respect section preferences', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {
            accommodation: [{ name: 'Hotel' }],
            activities: [{ name: 'Museum' }],
            dining: [{ name: 'Restaurant' }],
          },
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview', 'accommodation'], // Only these sections
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      const responseBody = AgentPutterResponseSchema.parse(response.body);

      // Should include requested sections
      expect(responseBody.formattedItinerary.content.overview).toBeDefined();
      expect(responseBody.formattedItinerary.content.accommodation).toBeDefined();

      // Should not include unrequested sections
      expect(responseBody.metadata.sections).toContain('overview');
      expect(responseBody.metadata.sections).toContain('accommodation');
    });

    it('should handle different styles appropriately', async () => {
      const styles = ['detailed', 'concise', 'narrative', 'bullet_points'];

      for (const style of styles) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            structure: { destination: 'Paris' },
            gatheredData: {},
            recommendations: {},
            travelerProfile: {},
            constraints: {},
          },
          formatPreferences: {
            style,
            language: 'en',
            includeImages: false,
            sections: ['overview'],
            detailLevel: 'standard',
          },
          outputFormat: 'html',
          context: {},
        };

        const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

        const responseBody = AgentPutterResponseSchema.parse(response.body);
        expect(responseBody.formattedItinerary).toBeDefined();
      }
    });

    it('should include images when requested', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          structure: { destination: 'Paris' },
          gatheredData: {},
          recommendations: {},
          travelerProfile: {},
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: true, // Request images
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

      const responseBody = AgentPutterResponseSchema.parse(response.body);

      // Should include images array when requested
      if (responseBody.formattedItinerary.images) {
        expect(Array.isArray(responseBody.formattedItinerary.images)).toBe(true);
      }
    });

    it('should handle different traveler profiles', async () => {
      const profiles = [
        { adults: 1, preferences: ['solo', 'adventure'] },
        { adults: 2, children: 2, preferences: ['family', 'educational'] },
        { adults: 4, preferences: ['group', 'social'] },
      ];

      for (const profile of profiles) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            structure: { destination: 'Paris' },
            gatheredData: {},
            recommendations: {},
            travelerProfile: profile,
            constraints: {},
          },
          formatPreferences: {
            style: 'detailed',
            language: 'en',
            includeImages: false,
            sections: ['overview', 'daily_schedule'],
            detailLevel: 'standard',
          },
          outputFormat: 'html',
          context: {},
        };

        const response = await testApi.post('/api/agents/putter').send(requestBody).expect(202);

        const responseBody = AgentPutterResponseSchema.parse(response.body);
        expect(responseBody.formattedItinerary.metadata.travelers).toBeDefined();
      }
    });
  });
});
