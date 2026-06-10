# 🔍 Monitoring & Observability Guide

Complete guide for monitoring the PramanSetu LLM/Vision AI integration including usage tracking, error monitoring, cost analysis, and performance metrics.

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Service](#monitoring-service)
3. [Metrics & KPIs](#metrics--kpis)
4. [Error Tracking](#error-tracking)
5. [Cost Monitoring](#cost-monitoring)
6. [Performance Optimization](#performance-optimization)
7. [Alerting & Notifications](#alerting--notifications)
8. [Dashboard Setup](#dashboard-setup)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The monitoring system tracks:
- **API Usage**: Requests, tokens, duration
- **Costs**: Real-time cost calculation per API call
- **Errors**: Error codes, frequency, context
- **Performance**: Response times, latencies, throughput
- **Health**: Service availability, degradation detection

### Architecture

```
Frontend Services
      ↓
Monitoring Service (track usage/errors)
      ↓
Database (metrics storage)
      ↓
Dashboard & Alerts
```

### Quick Start

```typescript
import { getMonitor } from '@/services/monitoringService';

const monitor = getMonitor();

// Track API call
monitor.trackUsage('ocr', {
  model: 'gemini-2.0-flash',
  inputTokens: 500,
  outputTokens: 150,
  duration: 2100,
});

// Track error
monitor.trackError('ocr_failed', error, { studentId: '123' });

// Get metrics
const stats = monitor.getUsageStats(60); // Last 60 minutes
console.log(stats);
// {
//   requestsPerMinute: 20.5,
//   tokensPerMinute: 12500,
//   costsPerMinute: 0.045
// }
```

---

## Monitoring Service

### Core Functions

#### Track Usage

```typescript
monitor.trackUsage(operation: string, data: {
  model?: string;
  tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  duration?: number;
  metadata?: Record<string, any>;
}): void
```

**Example:**
```typescript
// OpenAI call
monitor.trackUsage('metadata_extraction', {
  model: 'gpt-4o-mini',
  inputTokens: 800,
  outputTokens: 200,
  duration: 1200,
  metadata: { certificateId: 'cert-123' },
});

// Google Vision call
monitor.trackUsage('ocr', {
  model: 'gemini-2.0-flash',
  inputTokens: 500,
  outputTokens: 150,
  duration: 2100,
});
```

#### Track Response Time

```typescript
monitor.trackResponseTime(operation: string, durationMs: number): void
```

**Example:**
```typescript
const start = Date.now();
// ... API call ...
const duration = Date.now() - start;
monitor.trackResponseTime('certificate_upload', duration);
```

#### Track Errors

```typescript
monitor.trackError(
  operation: string,
  error: Error | string,
  context?: Record<string, any>
): void
```

**Example:**
```typescript
try {
  await performOCR(image);
} catch (error) {
  monitor.trackError('ocr_failed', error, {
    imageSize: image.size,
    format: image.type,
    studentId: '123',
  });
}
```

---

## Metrics & KPIs

### Usage Metrics

Get real-time usage statistics:

```typescript
// Last 60 minutes
const stats = monitor.getUsageStats(60);
console.log(stats);
// {
//   requestsPerMinute: 20.5,
//   tokensPerMinute: 12500,
//   costsPerMinute: 0.045
// }
```

### Cost Metrics

Calculate estimated costs:

```typescript
// Estimate cost for specific call
const estimatedCost = monitor.estimateCost(
  'gpt-4o-mini',
  800,    // input tokens
  200     // output tokens
);
// Returns: 0.00042 (approximately)

// Generate cost report
const report = monitor.generateCostReport(
  '2024-01-01',
  '2024-01-31'
);
console.log(report);
// {
//   period: { start: '2024-01-01', end: '2024-01-31' },
//   totalRequests: 15000,
//   totalTokens: 45000000,
//   totalCost: 185.50,
//   breakdown: [
//     {
//       service: 'ocr:gemini-2.0-flash',
//       requests: 5000,
//       totalTokens: 15000000,
//       estimatedCost: 75.00,
//       average: {
//         tokensPerRequest: 3000,
//         costPerRequest: 0.015
//       }
//     },
//     // ...
//   ],
//   errorRate: 0.8,
//   topErrors: [
//     { code: 'TIMEOUT', count: 85 },
//     // ...
//   ],
//   performanceMetrics: {
//     avgResponseTime: 2400,
//     p95ResponseTime: 4200,
//     p99ResponseTime: 5800
//   }
// }
```

### Pricing Configuration

Current pricing:

```
OpenAI (gpt-4o-mini):
  Input:  $0.00015 per 1K tokens
  Output: $0.0006 per 1K tokens

Google (gemini-2.0-flash):
  Input:  $0.001 per 1K tokens
  Output: $0.003 per 1K tokens

Examples:
  - 1000 tokens OCR: ~$0.003
  - 500 input + 200 output metadata: ~$0.00042
  - 1M tokens/day: ~$3-5 daily cost
```

---

## Error Tracking

### Error Statistics

```typescript
const errorStats = monitor.getErrorStats();
console.log(errorStats);
// {
//   totalErrors: 127,
//   errorRate: 0.85,  // percent
//   topErrors: [
//     {
//       code: 'TIMEOUT',
//       count: 45,
//       lastOccurrence: 1704067200000
//     },
//     {
//       code: 'RATE_LIMIT',
//       count: 32,
//       lastOccurrence: 1704066900000
//     },
//     // ...
//   ]
// }
```

### Common Error Codes

| Code | Cause | Solution |
|------|-------|----------|
| `TIMEOUT` | API response too slow | Increase timeout, optimize requests |
| `RATE_LIMIT` | Too many requests | Implement backoff, use batch processing |
| `INVALID_FORMAT` | Wrong file type | Validate file types, check preprocessing |
| `OCR_FAILED` | Text extraction error | Improve image quality, check confidence |
| `EXTRACTION_FAILED` | LLM parsing error | Review OCR text, adjust prompts |
| `DB_ERROR` | Database operation failed | Check DB connection, review queries |
| `FILE_TOO_LARGE` | File size exceeds limit | Increase limit or compress file |
| `INVALID_API_KEY` | Authentication failed | Verify and rotate keys |

---

## Cost Monitoring

### Daily Cost Estimation

```typescript
// Estimate daily cost based on last hour
const usage = monitor.getUsageStats(60);
const estimatedDailyCost = usage.costsPerMinute * 60 * 24;

console.log(`Estimated daily cost: $${estimatedDailyCost.toFixed(2)}`);
```

### Cost Breakdown Example

```
Period: January 2024 (30 days)
Total Requests: 15,000
Total Cost: $185.50

Breakdown:
├── OCR Operations (5,000)
│   ├── Model: gemini-2.0-flash
│   ├── Tokens: 15M
│   └── Cost: $75.00
├── Metadata Extraction (5,000)
│   ├── Model: gpt-4o-mini
│   ├── Tokens: 12.5M
│   └── Cost: $52.50
├── Chat Messages (4,000)
│   ├── Model: gpt-4o-mini
│   ├── Tokens: 8M
│   └── Cost: $35.00
└── Embeddings (1,000)
    ├── Model: gemini-2.0-flash
    ├── Tokens: 3.5M
    └── Cost: $23.00

Daily Average: $6.18
Hourly Average: $0.26
```

### Cost Optimization Strategies

1. **Batch Processing**
   ```typescript
   // Process multiple images together
   const images = [img1, img2, img3, img4, img5];
   const results = await Promise.all(
     images.map(img => performOCR(img))
   );
   // Reduces overhead by ~30%
   ```

2. **Token Optimization**
   ```typescript
   // Use shorter prompts
   const prompt = "Extract: issuer, date, skills from certificate";
   // vs.
   const prompt = "Please analyze this OCR text and extract...";
   // Saves ~200 tokens per request = ~$0.0001 per request
   ```

3. **Caching**
   ```typescript
   // Cache results to avoid re-processing
   const cachedResult = await cache.get(certificateHash);
   if (cachedResult) return cachedResult;
   
   const result = await extractMetadata(text);
   await cache.set(certificateHash, result, 24 * 60 * 60);
   ```

4. **Error Rate Reduction**
   ```typescript
   // Better preprocessing = better OCR = fewer retries
   const processed = await preprocessImage(image);
   const ocr = await performOCR(processed);
   // Improves confidence by ~15% = fewer manual reviews
   ```

---

## Performance Optimization

### Response Time Metrics

```typescript
const perf = monitor.getPerformanceMetrics();
console.log(perf);
// {
//   avgResponseTime: 2450,      // ms
//   p95ResponseTime: 4200,      // 95% of requests faster than this
//   p99ResponseTime: 5800,      // 99% of requests faster than this
//   minResponseTime: 850,
//   maxResponseTime: 12500
// }
```

### Performance Targets

| Operation | Target (p95) | Current | Status |
|-----------|--------------|---------|--------|
| OCR | 3000ms | 2100ms | ✅ Good |
| Metadata Extraction | 2000ms | 1200ms | ✅ Good |
| Embedding | 1500ms | 1000ms | ✅ Good |
| Portfolio Generation | 5000ms | 3200ms | ✅ Good |
| Search | 1000ms | 650ms | ✅ Excellent |

### Optimization Techniques

1. **Async Processing**
   ```typescript
   // Don't wait for embedding to finish before returning
   res.json({ certificateId });
   
   // Process in background
   generateEmbedding(text).then(embedding => {
     saveEmbedding(certificateId, embedding);
   });
   ```

2. **Connection Pooling**
   ```typescript
   // Reuse connections
   const dbPool = new Pool({
     max: 20,
     min: 5,
     idleTimeoutMillis: 30000,
   });
   ```

3. **Request Optimization**
   ```typescript
   // Compress large payloads
   app.use(compression());
   
   // Select only needed fields
   select(['id', 'text', 'confidence'])
   ```

---

## Alerting & Notifications

### Health Status

```typescript
const health = monitor.getHealthStatus();
console.log(health);
// {
//   status: 'healthy',  // healthy | degraded | unhealthy
//   metrics: {
//     recentErrorRate: 0.8,
//     recentAvgResponseTime: 2450,
//     estimatedDailyApiCost: 6.18
//   }
// }
```

### Alert Thresholds

Configure alerts for:

```typescript
const ALERT_THRESHOLDS = {
  errorRate: 5,           // Alert if error rate > 5%
  responseTime: 5000,     // Alert if response time > 5s
  dailyCost: 50,         // Alert if daily cost > $50
  tokenUsage: 10000000,   // Alert if daily tokens > 10M
  rateLimitHits: 10,      // Alert if rate limits exceeded
  serviceDowntime: 60000, // Alert if service down > 1 min
};
```

### Slack Integration Example

```typescript
async function sendSlackAlert(message: string, severity: 'warning' | 'error') {
  await axios.post(process.env.SLACK_WEBHOOK, {
    text: message,
    attachments: [{
      color: severity === 'error' ? 'danger' : 'warning',
      fields: [
        { title: 'Service', value: 'PramanSetu AI', short: true },
        { title: 'Severity', value: severity, short: true },
        { title: 'Time', value: new Date().toISOString(), short: true },
      ],
    }],
  });
}

// Usage
if (errorRate > 5) {
  await sendSlackAlert(`⚠️ High error rate: ${errorRate.toFixed(2)}%`, 'warning');
}

if (dailyCost > 50) {
  await sendSlackAlert(`💰 Daily cost: $${dailyCost.toFixed(2)}`, 'warning');
}
```

---

## Dashboard Setup

### Metrics Dashboard (Example)

```html
<!-- Real-time monitoring dashboard -->
<div class="dashboard">
  <div class="card">
    <h3>Usage (Last Hour)</h3>
    <div>Requests: <span>1,250</span></div>
    <div>Tokens: <span>3.75M</span></div>
    <div>Cost: <span>$0.43</span></div>
  </div>

  <div class="card">
    <h3>Performance</h3>
    <div>Avg Response: <span>2.4s</span></div>
    <div>P95: <span>4.2s</span></div>
    <div>Error Rate: <span>0.8%</span></div>
  </div>

  <div class="card">
    <h3>Health</h3>
    <div>Status: <span class="healthy">Operational</span></div>
    <div>Services: <span>5/5 healthy</span></div>
    <div>Uptime: <span>99.8%</span></div>
  </div>

  <div class="card">
    <h3>Costs (Today)</h3>
    <div>OCR: <span>$1.25</span></div>
    <div>LLM: <span>$0.85</span></div>
    <div>Total: <span>$2.10</span></div>
  </div>
</div>
```

### Grafana Integration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'pramansetu-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 5s
```

---

## Troubleshooting

### High Error Rate

**Symptoms**: Error rate > 5%

**Diagnosis**:
```typescript
const errors = monitor.getErrorStats();
console.log(errors.topErrors);
// Identify most common error type
```

**Solutions**:
1. Check API key validity
2. Verify rate limits not exceeded
3. Review error messages in logs
4. Check service health endpoints

### High Response Time

**Symptoms**: p95 response time > 5000ms

**Diagnosis**:
```typescript
const perf = monitor.getPerformanceMetrics();
if (perf.p95ResponseTime > 5000) {
  // Check which operations are slow
  const ops = monitor.exportData().usageEvents
    .filter(e => e.duration > 5000);
}
```

**Solutions**:
1. Increase API timeouts
2. Implement request queuing
3. Optimize prompts (fewer tokens)
4. Check database query performance
5. Scale API endpoints horizontally

### High Daily Costs

**Symptoms**: Daily cost > budget

**Diagnosis**:
```typescript
const report = monitor.generateCostReport(
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString()
);
console.log(report.breakdown);
// Identify most expensive operations
```

**Solutions**:
1. Implement result caching
2. Batch process requests
3. Use cheaper models for low-importance tasks
4. Reduce token usage with better prompts
5. Set rate limits

### Out of Memory

**Symptoms**: Process crashes, heap exceeded

**Diagnosis**:
```typescript
const memory = process.memoryUsage();
console.log(memory);
// Check if events cache is too large
```

**Solutions**:
1. Reduce `maxEvents` in monitoring service
2. Export and clear old data regularly
3. Implement data archival
4. Monitor heap usage continuously

---

## Best Practices

1. **Track Everything Important**
   - Every API call
   - All errors with context
   - Response times for performance analysis

2. **Regular Analysis**
   - Weekly cost reports
   - Monthly performance reviews
   - Quarterly capacity planning

3. **Alerts & Escalation**
   - High error rates
   - Service degradation
   - Cost threshold breaches

4. **Data Retention**
   - Keep detailed logs for 30 days
   - Archive old metrics
   - Anonymize user data

5. **Optimization Loop**
   - Monitor → Analyze → Optimize → Repeat
   - Measure impact of changes
   - Document improvements

---

**Last Updated**: December 2024
**Version**: 1.0
