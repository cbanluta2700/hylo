// Performance monitoring stub
export const performanceMonitoring = {
  measureExecutionTime: <T>(fn: () => T): { result: T; executionTime: number } => {
    const start = performance.now();
    const result = fn();
    return { result, executionTime: performance.now() - start };
  },
};
