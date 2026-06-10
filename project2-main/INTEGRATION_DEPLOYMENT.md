# 🚀 Complete Integration & Deployment Guide

End-to-end guide for integrating the security, secrets management, monitoring, and POC backend into your PramanSetu deployment.

## Quick Summary

You now have:
- ✅ Secrets Manager Service (AWS, Vault, Env)
- ✅ Monitoring Service (usage, errors, costs)
- ✅ POC Backend Server (certificate upload pipeline)
- ✅ Environment provisioning script
- ✅ Security & monitoring guides

---

## Phase 1: Local Development Setup (1-2 hours)

### Step 1.1: Provision Environment

```bash
# Make script executable
chmod +x provision-env.sh

# Run provisioning
./provision-env.sh

# Follow prompts to enter API keys:
# - OpenAI API Key (sk-...)
# - Google Gemmini API Key
# - Supabase URL and keys
```

**What it does:**
- ✓ Validates Node.js and npm
- ✓ Creates .env.local from template
- ✓ Prompts for sensitive values
- ✓ Adds .env.local to .gitignore
- ✓ Installs npm dependencies

### Step 1.2: Verify Environment

```bash
# Test environment configuration
npm run test:env

# Expected output:
# ✓ OPENAI_API_KEY: valid
# ✓ GEMMINI_API_KEY: valid
# ✓ SUPABASE_URL: valid
# ✓ All dependencies installed
```

### Step 1.3: Initialize Services

```typescript
// In your main app file or server startup
import {
  initializeSecretsManager,
  initializeMonitoring,
} from '@/services';

// Initialize secrets manager
const secretsManager = initializeSecretsManager({
  type: process.env.SECRETS_MANAGER || 'env',
  cacheSeconds: 3600,
});

// Initialize monitoring
const monitor = initializeMonitoring(100000);

// Validate all required secrets
const validation = await validateSecrets();
if (!validation.valid) {
  console.error('Missing secrets:', validation.missing);
  process.exit(1);
}

console.log('✓ All services initialized');
```

---

## Phase 2: POC Backend Setup (2-3 hours)

### Step 2.1: Install Backend Dependencies

```bash
# Create backend directory
mkdir -p server

# Copy POC server file
cp server/poc-server.ts server/index.ts

# Install required packages
npm install express multer uuid axios form-data
npm install -D @types/express @types/multer @types/node ts-node typescript
```

### Step 2.2: Configure Backend Environment

```bash
# Create backend .env
cat > server/.env.local << 'EOF'
# Backend Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# API Keys (from main .env.local)
OPENAI_API_KEY=${OPENAI_API_KEY}
GEMMINI_API_KEY=${GEMMINI_API_KEY}
LLM_MODEL=gpt-4o-mini

# Secrets Manager
SECRETS_MANAGER=env

# Supabase
SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# Features
ENABLE_REQUEST_LOGGING=true
ENABLE_USAGE_TRACKING=true
ENABLE_ERROR_TRACKING=true
EOF

# Load environment
source server/.env.local
```

### Step 2.3: Start POC Backend

```bash
# Development mode with hot reload
npm run dev:backend

# Or manually
cd server
npx ts-node --esm index.ts

# Expected output:
# ========================================
#   PramanSetu Backend Server - POC
# ========================================
# 
# [Startup] Validating environment variables...
# [Startup] All environment variables configured ✓
# 
# [Startup] Server running on port 3000
# 
# Endpoints:
#   POST /api/certificates/upload           - Upload single certificate
#   POST /api/certificates/upload-batch     - Upload multiple certificates
#   GET  /api/validate-env                  - Validate environment
#   GET  /api/metrics                       - System metrics
#   GET  /api/metrics/usage                 - Usage statistics
#   GET  /api/metrics/costs                 - Cost analysis
#   GET  /api/status                        - Service status
#   GET  /health                            - Health check
```

### Step 2.4: Test Backend Endpoints

```bash
# Test health
curl http://localhost:3000/health

# Test environment validation
curl http://localhost:3000/api/validate-env | jq

# Test metrics
curl http://localhost:3000/api/metrics | jq

# Test certificate upload (create test image first)
curl -X POST http://localhost:3000/api/certificates/upload \
  -F "file=@test-certificate.png" \
  -F "studentId=test-student-1" \
  -F "uploadedBy=admin-user"

# Response:
# {
#   "success": true,
#   "data": {
#     "certificateId": "550e8400-e29b-41d4-a716-446655440000",
#     "extractedMetadata": {
#       "issuer": "Tech Academy",
#       "title": "Certificate of Completion",
#       "courseName": "Advanced Machine Learning",
#       "studentName": "John Doe",
#       "issueDate": "2024-01-15",
#       "expiryDate": "2025-01-15",
#       "skills": ["Machine Learning", "Python", "Data Analysis"]
#     },
#     "confidence": 0.905,
#     "processingTime": 3245,
#     "ocrConfidence": 0.92,
#     "metadataConfidence": 0.89,
#     "status": "verified"
#   }
# }
```

---

## Phase 3: Integration with Frontend (2-3 hours)

### Step 3.1: Update Backend URL

```bash
# In .env.local
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_LLM_ENDPOINT=http://localhost:3000/api/llm
EXPO_PUBLIC_VISION_ENDPOINT=http://localhost:3000/api/vision
```

### Step 3.2: Create Frontend Service Layer

```typescript
// services/certificateUploadService.ts
import axios from 'axios';
import { preprocessImage } from './imagePreprocessingService';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function uploadCertificate(
  file: File,
  studentId: string,
  uploaderId: string
) {
  try {
    // Preprocess image on frontend
    const processed = await preprocessImage(file);
    
    // Send to backend
    const formData = new FormData();
    formData.append('file', processed);
    formData.append('studentId', studentId);
    formData.append('uploadedBy', uploaderId);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/certificates/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

### Step 3.3: Create Upload UI Component

```typescript
// components/CertificateUploadModal.tsx
import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadCertificate } from '@/services/certificateUploadService';
import { getMonitor } from '@/services/monitoringService';

export function CertificateUploadModal() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const monitor = getMonitor();

  const handleUpload = async () => {
    try {
      setLoading(true);
      const start = Date.now();
      
      // Pick file
      const document = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });
      
      if (!document.assets[0]) return;
      
      // Upload
      const response = await uploadCertificate(
        document.assets[0],
        'student-123',
        'user-456'
      );
      
      const duration = Date.now() - start;
      
      // Track metrics
      monitor.trackUsage('certificate_upload', {
        duration,
        tokens: 1500, // estimated
        metadata: { status: response.data.status },
      });
      
      setResult(response.data);
    } catch (error) {
      monitor.trackError('upload_failed', error, {
        studentId: 'student-123',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? 'Uploading...' : 'Upload Certificate'}
        onPress={handleUpload}
        disabled={loading}
      />
      
      {loading && <ActivityIndicator />}
      
      {result && (
        <View>
          <Text>✓ Uploaded Successfully</Text>
          <Text>Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
          <Text>Issuer: {result.extractedMetadata.issuer}</Text>
          <Text>Skills: {result.extractedMetadata.skills.join(', ')}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## Phase 4: Database Setup (1-2 hours)

### Step 4.1: Create Database Tables

```sql
-- Execute in Supabase SQL Editor
-- From supabase/certificates_schema.sql

-- Run all migration scripts
-- This creates:
-- - certificates table
-- - certificate_embeddings table
-- - validation_tasks table
-- - verification_badges table
-- - portfolios table
-- - chat_messages table
-- - audit_reports table
```

### Step 4.2: Enable Row-Level Security

```sql
-- RLS policies are included in schema.sql
-- Verify they're enabled:

SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%certificate%'
AND rowsecurity = true;

-- Should return all tables with rowsecurity = true
```

---

## Phase 5: Production Deployment (1-2 days)

### Step 5.1: Prepare for Production

```bash
# Create production build
npm run build

# Create production env file (don't commit!)
cp .env.example .env.production.local

# Edit with production values
nano .env.production.local

# Validate
npm run validate:env -- --production

# Run tests
npm run test
npm run test:integration
```

### Step 5.2: Deploy Backend to Cloud

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - OPENAI_API_KEY
# - GEMMINI_API_KEY
# - LLM_MODEL
# - SECRETS_MANAGER=aws (or env)
# - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

#### Option B: Railway.app

```bash
# Install Railway CLI
curl -i https://railway.app/install.sh | bash

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set OPENAI_API_KEY=sk-...
railway variables set GEMMINI_API_KEY=...
railway variables set SECRETS_MANAGER=aws
```

#### Option C: AWS Lambda + API Gateway

```bash
# Install serverless framework
npm i -g serverless

# Deploy
serverless deploy

# Configure API Gateway to trigger Lambda
# Set up CloudWatch logging
# Enable X-Ray tracing
```

### Step 5.3: Set Up Secrets in Production

```bash
# Create secrets in AWS
aws secretsmanager create-secret \
  --name pramansetu/openai-api-key \
  --secret-string "sk-prod-key"

aws secretsmanager create-secret \
  --name pramansetu/gemmini-api-key \
  --secret-string "your-google-key"

# Or in HashiCorp Vault
vault kv put secret/pramansetu/openai_api_key \
  value="sk-prod-key"
```

### Step 5.4: Enable Monitoring & Logging

```typescript
// Enable production monitoring
if (process.env.NODE_ENV === 'production') {
  // Initialize Sentry for error tracking
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });

  // Initialize DataDog for metrics
  const datadog = require('dd-trace');
  datadog.init();
}
```

### Step 5.5: Create Deployment Checklist

```bash
# Pre-deployment
[ ] All tests passing
[ ] Environment variables validated
[ ] Database migrations run
[ ] Backend API responding
[ ] Secrets configured
[ ] HTTPS enabled
[ ] CORS configured
[ ] Rate limiting enabled
[ ] Monitoring enabled
[ ] Alerting configured

# Post-deployment
[ ] Health check passing
[ ] Endpoints responding
[ ] Metrics being collected
[ ] Errors logged correctly
[ ] Cost tracking working
[ ] Team notified
[ ] Documentation updated
[ ] Incident runbook created
```

---

## Phase 6: Monitoring & Optimization (Ongoing)

### Daily Tasks

```bash
# Check service health
curl https://api.pramansetu.com/api/status

# Review error logs
npm run logs:errors

# Monitor cost
npm run metrics:costs

# Check performance
npm run metrics:performance
```

### Weekly Tasks

```bash
# Generate usage report
npm run report:usage -- --period week

# Analyze performance trends
npm run analyze:performance

# Review and optimize expensive operations
npm run analyze:costs -- --top-operations

# Check for security issues
npm run scan:security
```

### Monthly Tasks

```bash
# Full system review
npm run report:full-month

# Capacity planning
npm run capacity:forecast

# Cost analysis and optimization
npm run analyze:costs-detailed

# Security audit
npm run audit:security

# Rotate API keys
npm run rotate-keys
```

---

## Complete File Structure

```
project2-main/
├── .env.example                  # Template for environment variables
├── .env.local                    # Development (in .gitignore)
├── .gitignore                    # Includes .env files
├── provision-env.sh              # Environment provisioning script
├── package.json                  # Added npm scripts
├── SECURITY_GUIDE.md             # Security & secrets management
├── MONITORING_GUIDE.md           # Monitoring & observability
├── INTEGRATION_DEPLOYMENT.md     # This file
├── server/
│   ├── poc-server.ts             # POC backend with pipeline
│   ├── package.json              # Backend dependencies
│   └── .env.local                # Backend config (in .gitignore)
├── services/
│   ├── index.ts                  # Updated exports
│   ├── secretsManager.ts          # NEW: Secrets management
│   ├── monitoringService.ts       # NEW: Monitoring & analytics
│   ├── certificateService.ts      # Existing: Certificate orchestration
│   ├── visionService.ts           # Existing: OCR & embeddings
│   ├── llmService.ts              # Existing: LLM integration
│   └── ... (other services)
├── types/
│   └── llm-types.ts              # Type definitions
├── supabase/
│   └── certificates_schema.sql   # Database schema
└── components/
    └── CertificateUploadModal.tsx # NEW: UI component
```

---

## Troubleshooting

### "Module not found" errors

```bash
# Install missing dependencies
npm install @aws-sdk/client-secrets-manager axios form-data

# Rebuild
npm run build

# Clear cache
rm -rf .next node_modules
npm install
```

### "Cannot read secrets" errors

```bash
# Check environment variables
npm run test:env

# Verify secrets manager type
echo $SECRETS_MANAGER

# Test directly
node -e "console.log(process.env.OPENAI_API_KEY ? '✓' : '✗')"
```

### Backend not responding

```bash
# Check if server is running
lsof -i :3000

# Check logs
tail -f server/logs/error.log

# Restart server
pkill -f "node.*server"
npm run dev:backend
```

### High error rates

```bash
# Check error stats
curl http://localhost:3000/api/metrics | jq .metrics.errorRate

# Review error log
npm run logs:errors -- --tail 50

# Analyze most common errors
npm run analyze:errors
```

---

## Success Criteria

✅ **Backend Server**:
- Running on port 3000 (or configured port)
- All endpoints responding
- Health check passing
- Metrics being collected

✅ **Secrets Management**:
- All API keys loaded from secrets manager
- Keys cached appropriately
- No keys exposed in logs
- Rotation working

✅ **Monitoring**:
- Usage events tracked
- Errors captured with context
- Costs calculated correctly
- Performance metrics collected

✅ **Frontend Integration**:
- Certificate upload working
- Metadata extraction working
- Results displayed in UI
- Metrics tracked client-side

✅ **Database**:
- All tables created
- RLS policies enabled
- Data inserting successfully
- Queries responding fast

---

## Next Steps

1. **Complete Phase 1-2**: Get local development working
2. **Test Phase 3**: Verify frontend integration
3. **Setup Phase 4**: Configure database
4. **Deploy Phase 5**: Push to production
5. **Monitor Phase 6**: Ongoing optimization

---

**Documentation Version**: 1.0
**Last Updated**: December 2024
**Contact**: Your team email or support channel
