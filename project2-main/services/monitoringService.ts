/**
 * Monitoring & Analytics Service
 * 
 * Tracks API usage, errors, costs, and performance metrics.
 * Provides real-time monitoring and historical analytics.
 * 
 * Usage:
 *   const monitor = getMonitor();
 *   monitor.trackUsage('ocr', { tokens: 150, model: 'gpt-4o-mini' });
 *   monitor.trackError('ocr_failed', error, { studentId: '123' });
 *   const report = await monitor.generateCostReport('2024-01-01', '2024-01-31');
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UsageEvent {
  timestamp: number;
  operation: string;
  model?: string;
  tokens?: number;
  duration?: number;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  timestamp: number;
  operation: string;
  errorCode: string;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

export interface CostBreakdown {
  service: string;
  requests: number;
  totalTokens: number;
  estimatedCost: number;
  average: {
    tokensPerRequest: number;
    costPerRequest: number;
  };
}

export interface UsageReport {
  period: { start: string; end: string };
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  breakdown: CostBreakdown[];
  errorRate: number;
  topErrors: Array<{ code: string; count: number }>;
  performanceMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
}

interface MetricSnapshot {
  timestamp: number;
  value: number;
}

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

const PRICING_CONFIG = {
  openai: {
    'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }, // per 1K tokens
  },
  google: {
    'gemini-2.0-flash': { input: 0.001, output: 0.003 }, // per 1K tokens
    'vision-v1': { input: 0.001, output: 0.003 }, // per image
  },
};

// ============================================================================
// MONITORING SERVICE
// ============================================================================

class MonitoringService {
  private usageEvents: UsageEvent[] = [];
  private errorEvents: ErrorEvent[] = [];
  private responseTimes: MetricSnapshot[] = [];
  private maxEvents: number = 100000;

  constructor(maxEvents: number = 100000) {
    this.maxEvents = maxEvents;
  }

  // =========================================================================
  // USAGE TRACKING
  // =========================================================================

  /**
   * Track API usage (OpenAI, Google Vision, etc.)
   */
  trackUsage(operation: string, data: {
    model?: string;
    tokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    duration?: number;
    metadata?: Record<string, any>;
  }): void {
    const tokens = data.tokens || (data.inputTokens || 0) + (data.outputTokens || 0);
    const cost = this.calculateCost(operation, data.model, data.inputTokens, data.outputTokens);

    const event: UsageEvent = {
      timestamp: Date.now(),
      operation,
      model: data.model,
      tokens,
      duration: data.duration,
      cost,
      metadata: data.metadata,
    };

    this.usageEvents.push(event);
    this.pruneEvents();

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Monitor] ${operation}:`, {
        tokens,
        cost: cost ? `$${cost.toFixed(6)}` : 'N/A',
        duration: data.duration ? `${data.duration}ms` : 'N/A',
      });
    }
  }

  /**
   * Track response time
   */
  trackResponseTime(operation: string, durationMs: number): void {
    this.responseTimes.push({
      timestamp: Date.now(),
      value: durationMs,
    });

    // Keep last 10000 measurements
    if (this.responseTimes.length > 10000) {
      this.responseTimes.shift();
    }
  }

  // =========================================================================
  // ERROR TRACKING
  // =========================================================================

  /**
   * Track error event
   */
  trackError(
    operation: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const event: ErrorEvent = {
      timestamp: Date.now(),
      operation,
      errorCode: errorObj.name || 'UNKNOWN_ERROR',
      message: errorObj.message,
      context,
      stackTrace: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
    };

    this.errorEvents.push(event);
    this.pruneEvents();

    // Log error
    console.error(`[Monitor] Error in ${operation}:`, {
      code: event.errorCode,
      message: event.message,
      context,
    });
  }

  // =========================================================================
  // COST CALCULATION
  // =========================================================================

  /**
   * Calculate cost for API call
   */
  private calculateCost(
    operation: string,
    model?: string,
    inputTokens?: number,
    outputTokens?: number
  ): number {
    if (!model || (!inputTokens && !outputTokens)) {
      return 0;
    }

    let pricing: any;

    if (operation.includes('ocr') || operation.includes('vision')) {
      pricing = PRICING_CONFIG.google[model as keyof typeof PRICING_CONFIG.google];
    } else {
      pricing = PRICING_CONFIG.openai[model as keyof typeof PRICING_CONFIG.openai];
    }

    if (!pricing) {
      return 0;
    }

    const input = (inputTokens || 0) * (pricing.input / 1000);
    const output = (outputTokens || 0) * (pricing.output / 1000);

    return input + output;
  }

  // =========================================================================
  // COST REPORTING
  // =========================================================================

  /**
   * Generate cost report for date range
   */
  generateCostReport(startDate: string, endDate: string): UsageReport {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Filter events by date range
    const usageInRange = this.usageEvents.filter(
      (e) => e.timestamp >= start && e.timestamp <= end
    );
    const errorsInRange = this.errorEvents.filter(
      (e) => e.timestamp >= start && e.timestamp <= end
    );

    // Calculate breakdown by operation/model
    const breakdown = new Map<string, CostBreakdown>();

    for (const event of usageInRange) {
      const key = `${event.operation}:${event.model || 'unknown'}`;
      if (!breakdown.has(key)) {
        breakdown.set(key, {
          service: key,
          requests: 0,
          totalTokens: 0,
          estimatedCost: 0,
          average: { tokensPerRequest: 0, costPerRequest: 0 },
        });
      }

      const stats = breakdown.get(key)!;
      stats.requests++;
      stats.totalTokens += event.tokens || 0;
      stats.estimatedCost += event.cost || 0;
    }

    // Calculate averages
    const breakdownArray = Array.from(breakdown.values()).map((stats) => ({
      ...stats,
      average: {
        tokensPerRequest: stats.totalTokens / stats.requests,
        costPerRequest: stats.estimatedCost / stats.requests,
      },
    }));

    // Calculate totals
    const totalRequests = usageInRange.length;
    const totalTokens = usageInRange.reduce((sum, e) => sum + (e.tokens || 0), 0);
    const totalCost = usageInRange.reduce((sum, e) => sum + (e.cost || 0), 0);

    // Error analysis
    const errorCounts = new Map<string, number>();
    for (const error of errorsInRange) {
      const count = errorCounts.get(error.errorCode) || 0;
      errorCounts.set(error.errorCode, count + 1);
    }

    const topErrors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Performance metrics
    const times = this.responseTimes
      .filter((m) => m.timestamp >= start && m.timestamp <= end)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    const performanceMetrics = {
      avgResponseTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      p95ResponseTime: times[Math.floor(times.length * 0.95)] || 0,
      p99ResponseTime: times[Math.floor(times.length * 0.99)] || 0,
    };

    return {
      period: { start: startDate, end: endDate },
      totalRequests,
      totalTokens,
      totalCost,
      breakdown: breakdownArray,
      errorRate: totalRequests > 0 ? (errorsInRange.length / totalRequests) * 100 : 0,
      topErrors,
      performanceMetrics,
    };
  }

  /**
   * Get cost estimate for token usage
   */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    return this.calculateCost('estimation', model, inputTokens, outputTokens);
  }

  // =========================================================================
  // METRICS & STATISTICS
  // =========================================================================

  /**
   * Get usage statistics
   */
  getUsageStats(minutes: number = 60): {
    requestsPerMinute: number;
    tokensPerMinute: number;
    costsPerMinute: number;
  } {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recent = this.usageEvents.filter((e) => e.timestamp >= cutoff);

    if (recent.length === 0) {
      return { requestsPerMinute: 0, tokensPerMinute: 0, costsPerMinute: 0 };
    }

    const avgDuration = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 60000;

    return {
      requestsPerMinute: recent.length / avgDuration,
      tokensPerMinute: recent.reduce((sum, e) => sum + (e.tokens || 0), 0) / avgDuration,
      costsPerMinute: recent.reduce((sum, e) => sum + (e.cost || 0), 0) / avgDuration,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{ code: string; count: number; lastOccurrence: number }>;
  } {
    const errorCounts = new Map<string, { count: number; lastOccurrence: number }>();

    for (const error of this.errorEvents) {
      const stats = errorCounts.get(error.errorCode) || { count: 0, lastOccurrence: 0 };
      stats.count++;
      stats.lastOccurrence = error.timestamp;
      errorCounts.set(error.errorCode, stats);
    }

    const totalErrors = this.errorEvents.length;
    const totalRequests = this.usageEvents.length;

    return {
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      topErrors: Array.from(errorCounts.entries())
        .map(([code, stats]) => ({ code, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  } {
    const times = this.responseTimes.map((m) => m.value).sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      };
    }

    return {
      avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
      p95ResponseTime: times[Math.floor(times.length * 0.95)],
      p99ResponseTime: times[Math.floor(times.length * 0.99)],
      minResponseTime: times[0],
      maxResponseTime: times[times.length - 1],
    };
  }

  // =========================================================================
  // DATA MANAGEMENT
  // =========================================================================

  /**
   * Prune old events to prevent memory leak
   */
  private pruneEvents(): void {
    if (this.usageEvents.length > this.maxEvents) {
      this.usageEvents = this.usageEvents.slice(-this.maxEvents);
    }
    if (this.errorEvents.length > this.maxEvents) {
      this.errorEvents = this.errorEvents.slice(-this.maxEvents);
    }
  }

  /**
   * Export data for external storage
   */
  exportData(): {
    usageEvents: UsageEvent[];
    errorEvents: ErrorEvent[];
    exportedAt: string;
  } {
    return {
      usageEvents: [...this.usageEvents],
      errorEvents: [...this.errorEvents],
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.usageEvents = [];
    this.errorEvents = [];
    this.responseTimes = [];
    console.log('[Monitor] All data cleared');
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      recentErrorRate: number;
      recentAvgResponseTime: number;
      estimatedDailyApiCost: number;
    };
  } {
    const stats = this.getErrorStats();
    const perf = this.getPerformanceMetrics();
    const usage = this.getUsageStats(60);

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (stats.errorRate > 5) status = 'degraded';
    if (stats.errorRate > 15 || perf.avgResponseTime > 5000) status = 'unhealthy';

    return {
      status,
      metrics: {
        recentErrorRate: stats.errorRate,
        recentAvgResponseTime: perf.avgResponseTime,
        estimatedDailyApiCost: usage.costsPerMinute * 60 * 24,
      },
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let monitorInstance: MonitoringService;

/**
 * Get or create monitoring instance
 */
export function getMonitor(): MonitoringService {
  if (!monitorInstance) {
    monitorInstance = new MonitoringService();
  }
  return monitorInstance;
}

/**
 * Initialize monitoring with custom config
 */
export function initializeMonitoring(maxEvents?: number): MonitoringService {
  monitorInstance = new MonitoringService(maxEvents);
  return monitorInstance;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default MonitoringService;
