import { InngestMiddleware } from 'inngest';

/**
 * Simple debug middleware to track Inngest workflow
 * Based on Inngest middleware documentation patterns
 */
export const createDebugMiddleware = () => {
  return new InngestMiddleware({
    name: 'Hylo Debug Middleware',
    init() {
      console.log('🔧 [DEBUG-MIDDLEWARE] Middleware initialized');

      return {
        onFunctionRun({ ctx, fn }: any) {
          console.log('🚀 [DEBUG-MIDDLEWARE] Function triggered!', {
            functionId: fn.id,
            eventName: ctx.event.name,
          });

          return {
            beforeExecution() {
              console.log('⚡ [DEBUG-MIDDLEWARE] Function executing:', fn.id);
            },
          };
        },
      };
    },
  });
};
