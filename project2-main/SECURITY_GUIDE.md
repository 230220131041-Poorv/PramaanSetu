# 🔐 Security & Secrets Management Guide

Complete guide for managing API keys, secrets, and implementing security best practices in PramanSetu.

## Table of Contents

1. [Overview](#overview)
2. [Secrets Manager Service](#secrets-manager-service)
3. [API Key Management](#api-key-management)
4. [Environment Configuration](#environment-configuration)
5. [Key Rotation](#key-rotation)
6. [Production Deployment](#production-deployment)
7. [Security Best Practices](#security-best-practices)
8. [Incident Response](#incident-response)

---

## Overview

### Security Architecture

```
Frontend (No API Keys)
    ↓
Backend Server (Secrets Manager)
    ├─ AWS Secrets Manager (Production)
    ├─ HashiCorp Vault (Enterprise)
    └─ Environment Variables (Development)
    ↓
External APIs (OpenAI, Google)
```

### Principles

1. **Never expose API keys to frontend**
2. **Never commit secrets to version control**
3. **Rotate keys regularly (90 days)**
4. **Use backend proxy for all API calls**
5. **Enable audit logging**
6. **Monitor unauthorized access attempts**

---

## Secrets Manager Service

### Backend Proxy Pattern

**Why**: Protects API keys and enables centralized security policies

```
Frontend Request
    ↓
Backend Endpoint (e.g., POST /api/llm/extract)
    ↓
Secrets Manager (retrieves OPENAI_API_KEY)
    ↓
OpenAI API
    ↓
Response → Frontend
```

### Implementation Example

```typescript
import { getSecretsManager } from '@/services/secretsManager';

// In backend server
app.post('/api/llm/extract', async (req, res) => {
  try {
    // Get API key from secrets manager (never from frontend)
    const secretsManager = getSecretsManager();
    const openaiKey = await secretsManager.getSecret('OPENAI_API_KEY');
    
    // Use key to call OpenAI
    const response = await openai.createCompletion({
      api_key: openaiKey,
      model: 'gpt-4o-mini',
      messages: req.body.messages,
    });
    
    // Return only the response, never the API key
    res.json({
      success: true,
      data: response.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Supported Backends

#### 1. AWS Secrets Manager (Recommended for Production)

```typescript
import { initializeSecretsManager } from '@/services/secretsManager';

// Initialize with AWS
const secretsManager = initializeSecretsManager({
  type: 'aws',
  region: 'us-east-1',
  cacheSeconds: 3600,
});

// Retrieve secret
const apiKey = await secretsManager.getSecret('openai_api_key');

// Set secret (rotate)
await secretsManager.setSecret('openai_api_key', 'sk-new-key-here');

// Rotate (invalidate cache + refetch)
const rotatedKey = await secretsManager.rotateSecret('openai_api_key');
```

**Setup**:
```bash
# Install AWS SDK
npm install @aws-sdk/client-secrets-manager

# Configure AWS credentials
aws configure

# Create secret in AWS
aws secretsmanager create-secret \
  --name openai_api_key \
  --secret-string "sk-your-key"
```

#### 2. HashiCorp Vault (Enterprise)

```typescript
const secretsManager = initializeSecretsManager({
  type: 'vault',
  vaultAddr: 'https://vault.example.com',
  vaultToken: 'hvs.your-token',
  cacheSeconds: 3600,
});

// Usage same as AWS
const apiKey = await secretsManager.getSecret('openai_api_key');
```

**Setup**:
```bash
# Install Vault CLI
brew install vault

# Authenticate
vault login -method=ldap username=admin

# Write secret
vault kv put secret/pramansetu/openai_api_key \
  value="sk-your-key"

# Read secret
vault kv get secret/pramansetu/openai_api_key
```

#### 3. Environment Variables (Development Only)

```typescript
const secretsManager = initializeSecretsManager({
  type: 'env',
  cacheSeconds: 3600,
});

// Environment variable names converted to UPPERCASE_SNAKE_CASE
// openai_api_key → OPENAI_API_KEY
const apiKey = await secretsManager.getSecret('openai_api_key');
```

---

## API Key Management

### Key Types & Secrets

```
┌─────────────────────────────────┬──────────┬─────────────────────┐
│ Key Name                        │ Provider │ Rotation Interval   │
├─────────────────────────────────┼──────────┼─────────────────────┤
│ OPENAI_API_KEY                  │ OpenAI   │ Every 90 days       │
│ GEMMINI_API_KEY                 │ Google   │ Every 90 days       │
│ SUPABASE_SERVICE_KEY            │ Supabase │ Every 90 days       │
│ JWT_SECRET                      │ Internal │ Every 180 days      │
│ DATABASE_PASSWORD               │ Database │ Every 90 days       │
└─────────────────────────────────┴──────────┴─────────────────────┘
```

### Creating OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Name it: `pramansetu-production`
4. Copy the key (shown only once)
5. Store in Secrets Manager

### Creating Google API Key

1. Go to https://console.cloud.google.com
2. Create new project: "pramansetu"
3. Enable Vision API and Generative AI API
4. Create service account
5. Download JSON key file
6. Store in Secrets Manager

### Verifying Keys

```typescript
// Test OpenAI key
async function testOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Test Google key
async function testGoogleKey(apiKey: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://vision.googleapis.com/v1/files?key=${apiKey}`
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

---

## Environment Configuration

### Development (.env.local)

```bash
# Frontend (safe - no keys)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_ENVIRONMENT=development

# Backend (keys only - never committed)
OPENAI_API_KEY=sk-your-development-key
GEMMINI_API_KEY=your-google-key
LLM_MODEL=gpt-4o-mini
SECRETS_MANAGER=env
```

### Production (.env.production)

```bash
# Frontend (public - no keys)
EXPO_PUBLIC_SUPABASE_URL=https://pramansetu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (rotating anon key)
EXPO_PUBLIC_BACKEND_URL=https://api.pramansetu.com
EXPO_PUBLIC_ENVIRONMENT=production

# Backend (keys from Secrets Manager - not in file)
SECRETS_MANAGER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${CI_AWS_KEY}
AWS_SECRET_ACCESS_KEY=${CI_AWS_SECRET}
NODE_ENV=production
LOG_LEVEL=warn
```

### GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  GEMMINI_API_KEY: ${{ secrets.GEMMINI_API_KEY }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

---

## Key Rotation

### Rotation Process

```
Step 1: Generate new key
  └─ OpenAI/Google generate new API key

Step 2: Update Secrets Manager
  └─ Store new key alongside old key

Step 3: Update services
  └─ Services automatically fetch new key (due to caching)

Step 4: Monitor transition
  └─ Watch for errors with old key

Step 5: Disable old key
  └─ Prevent accidental usage

Step 6: Document rotation
  └─ Update rotation log
```

### Automated Rotation Script

```bash
#!/bin/bash
# rotate-keys.sh

set -e

echo "[Key Rotation] Starting..."

# 1. Generate new OpenAI key
echo "[1/4] Generating new OpenAI key..."
NEW_OPENAI_KEY=$(curl -s -X POST https://api.openai.com/v1/keys \
  -H "Authorization: Bearer $OLD_OPENAI_KEY" | jq -r '.id')
echo "✓ New OpenAI key: ${NEW_OPENAI_KEY:0:10}..."

# 2. Store in AWS Secrets Manager
echo "[2/4] Updating AWS Secrets Manager..."
aws secretsmanager put-secret-value \
  --secret-id openai_api_key \
  --secret-string "$NEW_OPENAI_KEY"
echo "✓ Updated in Secrets Manager"

# 3. Clear cache to force fetch
echo "[3/4] Clearing service caches..."
curl -X POST http://localhost:3000/api/cache/clear
echo "✓ Cache cleared"

# 4. Disable old key
echo "[4/4] Disabling old key..."
curl -s -X POST https://api.openai.com/v1/keys/$OLD_OPENAI_KEY/disable \
  -H "Authorization: Bearer $NEW_OPENAI_KEY" > /dev/null
echo "✓ Old key disabled"

echo ""
echo "[Key Rotation] Complete!"
echo "├─ New key valid: $(date)"
echo "├─ Old key disabled: $(date)"
echo "└─ Update rotation log in documentation"
```

### Rotation Schedule

```
Monday  - OpenAI key
Wednesday - Google key
Friday  - Supabase key
Sunday  - JWT/Database secrets
```

### Monitoring During Rotation

```typescript
// Track errors after rotation
const monitor = getMonitor();

// Before rotation
const errorsBefore = monitor.getErrorStats().totalErrors;

// After rotation (wait 30 min)
setTimeout(() => {
  const errorsAfter = monitor.getErrorStats().totalErrors;
  const newErrors = errorsAfter - errorsBefore;
  
  if (newErrors > 10) {
    console.warn('⚠️ High errors after rotation, check key');
  } else {
    console.log('✓ Rotation successful');
  }
}, 30 * 60 * 1000);
```

---

## Production Deployment

### Pre-Deployment Checklist

```
Security Verification
[ ] All API keys removed from codebase
[ ] .env files in .gitignore
[ ] Secrets Manager configured
[ ] Keys tested and working
[ ] Audit logging enabled
[ ] Rate limiting configured
[ ] HTTPS enabled
[ ] CORS properly configured

Infrastructure
[ ] Backend server deployed
[ ] Database encrypted at rest
[ ] Database encrypted in transit
[ ] Backups configured
[ ] Monitoring enabled
[ ] Alerting configured
[ ] Log aggregation setup
```

### Deployment with Secrets

```bash
# 1. Set up infrastructure
terraform apply

# 2. Create secrets in AWS
aws secretsmanager create-secret \
  --name pramansetu/openai-api-key \
  --secret-string "sk-prod-key"

# 3. Deploy application
npm run build
npm run deploy

# 4. Verify health
curl https://api.pramansetu.com/health
```

### Docker Secrets

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node src ./src

USER node
EXPOSE 3000

# Don't expose API keys in build
# Use runtime secrets from Docker/Kubernetes
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    image: pramansetu-api:latest
    ports:
      - "3000:3000"
    environment:
      - SECRETS_MANAGER=aws
      - AWS_REGION=us-east-1
    secrets:
      - aws_access_key
      - aws_secret_key
    depends_on:
      - postgres

secrets:
  aws_access_key:
    external: true
  aws_secret_key:
    external: true
```

---

## Security Best Practices

### 1. Access Control

```typescript
// Only authorized services can access secrets
const secretsManager = getSecretsManager();

// Add permission checks
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Unauthorized' });
}

const apiKey = await secretsManager.getSecret('OPENAI_API_KEY');
```

### 2. Audit Logging

```typescript
// Log all secret access
secretsManager.on('secretAccessed', (secretName: string, user: string) => {
  console.log(`[AUDIT] ${user} accessed ${secretName} at ${new Date().toISOString()}`);
  
  // Log to database
  auditLog.create({
    action: 'SECRET_ACCESS',
    secretName,
    user,
    timestamp: new Date(),
  });
});
```

### 3. Rate Limiting

```typescript
// Prevent brute force attacks
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests
  message: 'Too many requests',
}));

// Stricter limits for auth endpoints
app.post('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 min
}));
```

### 4. HTTPS Only

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### 5. Input Validation

```typescript
// Validate all inputs before using with APIs
const { text } = req.body;

if (!text || text.length > 10000) {
  return res.status(400).json({ error: 'Invalid input' });
}

// Use validated input
const result = await llm.extract(text);
```

---

## Incident Response

### Key Compromise Protocol

**If key is exposed:**

1. **Immediate Actions (0-5 min)**
   - Revoke compromised key
   - Generate new key
   - Update in Secrets Manager
   - Notify team on Slack

2. **Short-term (5-30 min)**
   - Deploy new key to production
   - Monitor error rates
   - Check logs for suspicious activity
   - Review API usage

3. **Follow-up (same day)**
   - Root cause analysis
   - Security audit
   - Update documentation
   - Brief security team

### Example Incident Response

```bash
#!/bin/bash
# incident-response.sh

echo "🚨 KEY COMPROMISE INCIDENT RESPONSE"

# 1. Revoke old key
echo "1. Revoking compromised key..."
curl -X POST https://api.openai.com/v1/keys/sk-old/disable \
  -H "Authorization: Bearer $NEW_ADMIN_KEY"

# 2. Generate and store new key
echo "2. Generating new key..."
NEW_KEY=$(curl -s -X POST https://api.openai.com/v1/keys \
  -H "Authorization: Bearer $NEW_ADMIN_KEY" | jq -r '.id')

# 3. Update secrets manager
echo "3. Updating Secrets Manager..."
aws secretsmanager put-secret-value \
  --secret-id openai_api_key \
  --secret-string "$NEW_KEY"

# 4. Clear cache
echo "4. Clearing service caches..."
curl -X POST http://localhost:3000/api/cache/clear

# 5. Monitor
echo "5. Monitoring error rates..."
watch -n 1 'curl -s http://localhost:3000/api/metrics | jq .metrics.errorRate'

# 6. Notify
echo "6. Notifying team..."
curl -X POST $SLACK_WEBHOOK -d '{
  "text": "🚨 Key Compromise: Old key revoked, new key deployed"
}'
```

### Incident Checklist

- [ ] Key revoked in API provider
- [ ] New key generated
- [ ] New key stored in Secrets Manager
- [ ] Service cache cleared
- [ ] New key deployed to production
- [ ] Error rates monitored (30 min)
- [ ] API usage reviewed for suspicious activity
- [ ] Root cause analysis documented
- [ ] Team briefing completed
- [ ] Rotation schedule updated
- [ ] Incident report filed

---

## Useful Commands

```bash
# View environment variables (safe)
printenv | grep EXPO_PUBLIC

# Test secrets manager
npm run test:secrets

# Rotate all keys
npm run rotate-keys

# Check key validity
npm run verify-keys

# View audit log
npm run view-audit-log

# Emergency key revocation
npm run revoke-key -- OPENAI_API_KEY

# Extract secrets for backup (secure)
npm run backup-secrets -- --encrypted

# Check for exposed keys
npm run scan-exposure
```

---

## Summary

✅ **Always**:
- Store keys in Secrets Manager
- Use backend proxy pattern
- Rotate keys every 90 days
- Log all access
- Verify keys work before production
- Use HTTPS for all communication

❌ **Never**:
- Commit keys to git
- Expose keys to frontend
- Use same key across environments
- Share keys in chat/email
- Store keys in comments
- Log API keys

---

**Last Updated**: December 2024
**Version**: 1.0
