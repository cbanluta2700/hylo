/**
 * Error Reporting Endpoint for Production Monitoring
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Secure error logging without exposing sensitive data
 * - Integration with existing enhanced error handling system
 *
 * Receives error reports from the enhanced error handling system
 */

export const runtime = 'edge';

interface ErrorReport {
  type: string;
  workflowId: string;
  stage: string;
  message: string;
  timestamp: string;
  errorType?: string;
  retryable?: boolean;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json(
      {
        error: 'Method not allowed',
        message: 'Use POST to report errors',
      },
      { status: 405 }
    );
  }

  console.log('📝 [ERROR-REPORTING] Received error report');

  try {
    const errorReport: ErrorReport = await request.json();

    // Validate required fields
    const requiredFields = ['type', 'message', 'timestamp'];
    const missingFields = requiredFields.filter((field) => !(field in errorReport));

    if (missingFields.length > 0) {
      return Response.json(
        {
          error: 'Invalid error report',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          required: requiredFields,
        },
        { status: 400 }
      );
    }

    // Sanitize error report (remove sensitive data)
    const sanitizedReport = sanitizeErrorReport(errorReport);

    console.log('🚨 [ERROR-REPORTING] Processing error report:', {
      type: sanitizedReport.type,
      workflowId: sanitizedReport.workflowId?.substring(0, 15) + '...' || 'unknown',
      stage: sanitizedReport.stage,
      errorType: sanitizedReport.errorType,
      retryable: sanitizedReport.retryable,
    });

    // Store error report (in production, would use proper storage/analytics)
    await storeErrorReport(sanitizedReport);

    // Check if error meets alert criteria
    const shouldAlert = await checkAlertCriteria(sanitizedReport);

    if (shouldAlert) {
      console.log('🚨 [ERROR-REPORTING] Error meets alert criteria, triggering notifications');
      await triggerAlert(sanitizedReport);
    }

    // Update error metrics (in production, would update monitoring dashboard)
    await updateErrorMetrics(sanitizedReport);

    return Response.json({
      status: 'Error report received',
      reportId: generateReportId(sanitizedReport),
      timestamp: new Date().toISOString(),
      alertTriggered: shouldAlert,
      message: 'Error logged and processed successfully',
    });
  } catch (error) {
    console.error('💥 [ERROR-REPORTING] Failed to process error report:', error);

    return Response.json(
      {
        status: 'Error reporting failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Sanitize error report to remove sensitive information
 */
function sanitizeErrorReport(report: ErrorReport): ErrorReport {
  const sanitized = { ...report };

  // Remove or mask sensitive data
  if (sanitized.message) {
    // Remove API keys and tokens from error messages
    sanitized.message = sanitized.message
      .replace(/xai-[a-zA-Z0-9]+/g, 'XAI_API_KEY_***')
      .replace(/gsk_[a-zA-Z0-9]+/g, 'GROQ_API_KEY_***')
      .replace(/signkey_[a-zA-Z0-9]+/g, 'SIGNING_KEY_***')
      .replace(/Bearer [a-zA-Z0-9\-_.]+/g, 'Bearer ***');
  }

  // Sanitize context data
  if (sanitized.context) {
    const cleanContext = { ...sanitized.context };

    // Remove sensitive context fields
    delete cleanContext.apiKey;
    delete cleanContext.token;
    delete cleanContext.password;
    delete cleanContext.secret;

    sanitized.context = cleanContext;
  }

  // Limit URL to origin only (remove query parameters that might contain sensitive data)
  if (sanitized.url) {
    try {
      const url = new URL(sanitized.url);
      sanitized.url = `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
      sanitized.url = 'invalid_url';
    }
  }

  return sanitized;
}

/**
 * Store error report (in production, would use proper storage)
 */
async function storeErrorReport(report: ErrorReport): Promise<void> {
  // In production, this would:
  // 1. Store in Redis with TTL for recent errors
  // 2. Send to analytics service (PostHog, Mixpanel, etc.)
  // 3. Store in long-term database for trend analysis
  // 4. Update real-time metrics

  console.log('💾 [ERROR-STORAGE] Error report stored (mock)', {
    type: report.type,
    stage: report.stage,
    timestamp: report.timestamp,
  });

  // Mock implementation - in production would store to Redis/database
  try {
    if (process.env['KV_REST_API_URL'] && process.env['KV_REST_API_TOKEN']) {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env['KV_REST_API_URL']!,
        token: process.env['KV_REST_API_TOKEN']!,
      });

      const errorKey = `error:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await redis.setex(errorKey, 86400, JSON.stringify(report)); // 24 hour TTL

      console.log('💾 [ERROR-STORAGE] Error report stored in Redis');
    }
  } catch (storageError) {
    console.error('💥 [ERROR-STORAGE] Failed to store error report:', storageError);
    // Don't throw - error reporting should not fail if storage fails
  }
}

/**
 * Check if error meets alert criteria
 */
async function checkAlertCriteria(report: ErrorReport): Promise<boolean> {
  // Alert criteria:
  // 1. Critical system errors (AI provider failures)
  // 2. High frequency of errors in short time period
  // 3. Non-retryable errors that affect user experience
  // 4. Infrastructure failures (Redis, Inngest)

  const criticalErrorTypes = ['ai_provider', 'system', 'network'];
  const criticalStages = ['main-workflow', 'architect', 'gatherer'];

  // Alert on critical error types
  if (report.errorType && criticalErrorTypes.includes(report.errorType)) {
    return true;
  }

  // Alert on critical workflow stages
  if (report.stage && criticalStages.includes(report.stage)) {
    return true;
  }

  // Alert on non-retryable errors
  if (report.retryable === false) {
    return true;
  }

  // Check error frequency (in production, would check recent error count)
  const shouldAlertOnFrequency = await checkErrorFrequency(report);
  if (shouldAlertOnFrequency) {
    return true;
  }

  return false;
}

/**
 * Check error frequency for alert threshold
 */
async function checkErrorFrequency(report: ErrorReport): Promise<boolean> {
  // In production, would:
  // 1. Count similar errors in last 15 minutes
  // 2. Check if count exceeds threshold (e.g., >5 similar errors)
  // 3. Consider error rate vs. total workflow count

  // Mock implementation
  console.log('📊 [ERROR-FREQUENCY] Checking error frequency (mock)');
  return false; // Don't alert on frequency in this mock implementation
}

/**
 * Trigger alert notifications
 */
async function triggerAlert(report: ErrorReport): Promise<void> {
  console.log('🚨 [ALERT-TRIGGER] Triggering alert for critical error');

  // In production, would:
  // 1. Send to alerting service (PagerDuty, Opsgenie, etc.)
  // 2. Post to Slack channel
  // 3. Send email notifications
  // 4. Create incident ticket
  // 5. Update status page if needed

  const alertMessage = {
    title: 'Hylo AI Workflow Error',
    severity: 'critical',
    description: `Error in ${report.stage}: ${report.message}`,
    workflowId: report.workflowId,
    timestamp: report.timestamp,
    errorType: report.errorType,
    retryable: report.retryable,
  };

  console.log('🚨 [ALERT-TRIGGER] Alert details:', alertMessage);

  // Mock alert implementation
  // In production, replace with actual alert service calls
}

/**
 * Update error metrics for monitoring dashboard
 */
async function updateErrorMetrics(report: ErrorReport): Promise<void> {
  console.log('📈 [METRICS-UPDATE] Updating error metrics');

  // In production, would:
  // 1. Increment error counters by type and stage
  // 2. Update error rate calculations
  // 3. Track error trends over time
  // 4. Update real-time dashboard data
  // 5. Calculate success/failure rates

  // Mock implementation
  console.log('📈 [METRICS-UPDATE] Error metrics updated (mock)', {
    type: report.type,
    stage: report.stage,
    errorType: report.errorType,
  });
}

/**
 * Generate unique report ID
 */
function generateReportId(report: ErrorReport): string {
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substr(2, 9);
  return `err_${timestamp}_${hash}`;
}
