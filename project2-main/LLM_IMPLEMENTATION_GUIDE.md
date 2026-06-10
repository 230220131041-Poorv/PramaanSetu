# PramanSetu - LLM & Vision AI Integration Guide

## Overview

This document provides comprehensive implementation details for integrating ChatGPT (OpenAI) and Gemmini (Google Vision) APIs into the PramanSetu student activity platform.

## ⚠️ Security Note

**CRITICAL**: Do NOT store API keys in source code or version control.

- `.env.local` is in `.gitignore` - never commit it
- Set API keys in your backend server environment variables
- Use environment variables or a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault)
- Rotate keys immediately if they are leaked

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Native/Expo)              │
├─────────────────────────────────────────────────────────────┤
│  - Image Upload Component                                    │
│  - Portfolio View Component                                  │
│  - Chat Copilot Component                                    │
│  - Search Interface Component                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Application Services Layer                       │
├─────────────────────────────────────────────────────────────┤
│  1. Image Preprocessing Service                              │
│  2. Certificate Service (Orchestrator)                       │
│  3. Portfolio Service                                        │
│  4. Chat & Search Service                                    │
│  5. Audit Report Service                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┬──────────────┐
         ↓                       ↓              ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Vision Service  │  │  LLM Service     │  │ Supabase DB  │
│  (Gemmini APIs)  │  │  (ChatGPT APIs)  │  │   Storage    │
└──────────────────┘  └──────────────────┘  └──────────────┘
         │                     │
    ┌────┴────┐           ┌────┴────┐
    ↓         ↓           ↓         ↓
   OCR  Embeddings  Extraction Completion
                    Validation   Streaming
```

## Service Architecture

### 1. Image Preprocessing Service (`imagePreprocessingService.ts`)

**Purpose**: Normalize, deskew, compress images before OCR

**Key Functions**:
- `preprocessImage()` - Main preprocessing pipeline
- `deskewImage()` - Auto-rotate skewed documents
- `compressImage()` - Reduce file size while maintaining quality
- `convertToGrayscale()` - Optional grayscale conversion
- `removeNoise()` - Reduce image noise

**Usage**:
```typescript
import { preprocessImage } from '@/services/imagePreprocessingService';

const result = await preprocessImage(file, {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
  deskew: true,
  removeNoise: true
});

if (result.success) {
  console.log('Processed:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### 2. Vision Service (`visionService.ts`)

**Purpose**: Handle OCR, embeddings, and semantic search via Gemmini

**Key Functions**:
- `performOCR()` - Extract text from images
- `extractTables()` - Extract structured table data
- `detectDocumentType()` - Identify document type
- `verifyDocumentAuthenticity()` - Detect tampering
- `generateEmbedding()` - Create semantic vectors
- `generateBatchEmbeddings()` - Batch embedding generation
- `semanticSearch()` - Find similar embeddings
- `cosineSimilarity()` - Calculate vector similarity

**Backend Endpoint Expected**:
```
POST /api/vision/ocr
Body: { file_url: string, model: string }
Response: { extracted_text: string, ocr_confidence: float, processing_time_ms: int }

POST /api/vision/embeddings
Body: { text: string, model: string }
Response: { embedding_vector: number[], model: string, token_count: int }
```

**Usage**:
```typescript
import { performOCR, generateEmbedding } from '@/services/visionService';

// Extract text from image
const ocrResult = await performOCR(imageFile);
console.log('Text:', ocrResult.data?.extracted_text);

// Generate embedding for semantic search
const embeddingResult = await generateEmbedding({
  text: 'Python Developer with 5 years experience'
});
```

### 3. LLM Service (`llmService.ts`)

**Purpose**: Handle text generation, metadata extraction, and copilot chat

**Key Functions**:
- `extractCertificateMetadata()` - Parse OCR into JSON fields
- `generateValidationSummary()` - Create faculty review notes
- `generatePortfolioContent()` - Generate bio and achievements
- `generateAuditReport()` - Create NAAC audit reports
- `streamCopilotResponse()` - Stream chat responses
- `parseSearchQuery()` - Convert natural language to filters

**Backend Endpoint Expected**:
```
POST /api/llm/complete
Body: {
  model: string,
  messages: { role: string, content: string }[],
  temperature: float,
  max_tokens: int
}
Response: { choices: [{ message: { content: string } }] }

POST /api/llm/stream
Body: (same as above with stream: true)
Response: Server-Sent Events with { choices: [{ delta: { content: string } }] }
```

**Usage**:
```typescript
import { extractCertificateMetadata, streamCopilotResponse } from '@/services/llmService';

// Extract metadata from OCR text
const metadataResult = await extractCertificateMetadata(ocrText);
console.log('Metadata:', metadataResult.data?.metadata);

// Stream copilot response
await streamCopilotResponse(
  'How can I improve my portfolio?',
  { role: 'student' },
  (chunk) => console.log('Chunk:', chunk)
);
```

### 4. Certificate Service (`certificateService.ts`)

**Purpose**: Orchestrate complete certificate upload and processing pipeline

**Pipeline Steps**:
1. Validate file
2. Preprocess image
3. Upload to cloud storage
4. Perform OCR
5. Extract metadata with LLM
6. Generate embeddings
7. Check for duplicates
8. Save to database
9. Create validation tasks if needed

**Key Functions**:
- `processCertificateUpload()` - Complete pipeline
- `verifyCertificate()` - Faculty approval
- `rejectCertificate()` - Faculty rejection
- `getStudentCertificates()` - Fetch certificates

**Usage**:
```typescript
import { processCertificateUpload, verifyCertificate } from '@/services/certificateService';

// Process upload
const result = await processCertificateUpload(file, studentId, uploaderId);
if (result.success) {
  const { certificate, requiresReview } = result.data!;
  console.log('Certificate ID:', certificate.id);
  console.log('Requires review:', requiresReview);
}

// Faculty verification
const verifyResult = await verifyCertificate(certificateId, validatorId, notes);
```

### 5. Portfolio Service (`portfolioService.ts`)

**Purpose**: Generate and manage student portfolios

**Key Functions**:
- `generatePortfolio()` - Generate from verified activities
- `getPortfolio()` - Fetch student portfolio
- `getPublicPortfolio()` - Public portfolio access
- `updatePortfolioVisibility()` - Set sharing permissions
- `regeneratePortfolio()` - Regenerate after new activities
- `exportPortfolioAsJSON()` - Export data
- `getPortfolioStats()` - Get statistics

**Usage**:
```typescript
import { generatePortfolio, updatePortfolioVisibility } from '@/services/portfolioService';

// Generate portfolio
const result = await generatePortfolio(studentId, 'recruiters');

// Make public
await updatePortfolioVisibility(studentId, true, 'public');

// Get public share link
const portfolio = await getPortfolio(studentId);
console.log('Share link:', `https://pramansetu.com/portfolio/${portfolio.share_token}`);
```

### 6. Chat & Search Service (`chatSearchService.ts`)

**Purpose**: Copilot chat, semantic search, and activity search

**Key Functions**:
- `sendChatMessage()` - Send message to copilot
- `getChatHistory()` - Fetch message history
- `semanticStudentSearch()` - Find students by natural language
- `searchCertificates()` - Search certificates
- `searchActivities()` - Search activities

**Usage**:
```typescript
import { sendChatMessage, semanticStudentSearch } from '@/services/chatSearchService';

// Send chat message
await sendChatMessage(userId, 'How do I add a new activity?', {
  role: 'student'
}, (chunk) => console.log(chunk));

// Search for students
const results = await semanticStudentSearch(
  'Find Python developers with IoT experience',
  10
);
```

### 7. Audit Report Service (`auditReportService.ts`)

**Purpose**: Generate NAAC-compliant audit reports

**Key Functions**:
- `generateNAACAuditReport()` - Generate comprehensive audit
- `getAuditReport()` - Fetch report
- `listAuditReports()` - List all reports
- `getAuditInsights()` - Get statistics
- `exportAuditReportAsMarkdown()` - Export to markdown
- `getAuditReportSummary()` - Dashboard summary

**Usage**:
```typescript
import { generateNAACAuditReport, getAuditInsights } from '@/services/auditReportService';

// Generate report
const result = await generateNAACAuditReport(
  adminId,
  '2024-01-01',
  '2024-12-31',
  'Computer Science'
);

// Get insights
const insights = await getAuditInsights(result.data!.id);
console.log('Top skills:', insights.top_skills);
```

## Database Schema

See `supabase/certificates_schema.sql` for complete schema including:

- `certificates` - Certificate storage with OCR/metadata
- `certificate_embeddings` - Vector embeddings for semantic search
- `validation_tasks` - Faculty review queue
- `verification_badges` - Tamper-evident badges
- `portfolios` - Generated student portfolios
- `chat_messages` - Copilot conversation history
- `audit_reports` - Generated audit reports

**Key Tables**:

### Certificates Table
```sql
certificates (
  id UUID PRIMARY KEY,
  student_id UUID,
  file_url TEXT,
  ocr_text TEXT,
  metadata JSONB,
  embedding_id UUID,
  verification_status verification_status,
  is_duplicate BOOLEAN,
  similarity_score DECIMAL,
  created_at TIMESTAMPTZ
)
```

### Portfolios Table
```sql
portfolios (
  id UUID PRIMARY KEY,
  student_id UUID UNIQUE,
  bio TEXT,
  achievements JSONB,
  share_token UUID,
  is_public BOOLEAN,
  visibility_level TEXT
)
```

## Configuration

### Environment Variables (`.env.local`)

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend endpoints (frontend calls these)
REACT_APP_LLM_ENDPOINT=http://localhost:3001/api/llm
REACT_APP_VISION_ENDPOINT=http://localhost:3001/api/vision

# Model names
REACT_APP_LLM_MODEL=gpt-4o-mini
REACT_APP_VISION_MODEL=gemmini-vision-2024

# Thresholds
REACT_APP_OCR_CONFIDENCE_THRESHOLD=0.75
REACT_APP_EMBEDDING_SIMILARITY_THRESHOLD=0.92

# Limits
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_SUPPORTED_FORMATS=pdf,jpg,jpeg,png,webp
```

### Backend Setup

Create a backend server (Node.js/Express example):

```javascript
// server/routes/llm.js
const express = require('express');
const { Configuration, OpenAIApi } = require('openai');

const router = express.Router();
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

router.post('/complete', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens } = req.body;
    const response = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stream', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
```

```javascript
// server/routes/vision.js
const express = require('express');
const vision = require('@google-cloud/vision');

const router = express.Router();
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

router.post('/ocr', async (req, res) => {
  try {
    const { file_url } = req.body;
    const request = {
      image: { source: { imageUri: file_url } },
    };

    const [result] = await client.documentTextDetection(request);
    const fullTextAnnotation = result.fullTextAnnotation;

    res.json({
      extracted_text: fullTextAnnotation?.text || '',
      ocr_confidence: 0.95,
      processing_time_ms: 250,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/embeddings', async (req, res) => {
  try {
    const { text, model } = req.body;
    
    // Use Google's embedding API or similar
    const embedding = await generateEmbedding(text);
    
    res.json({
      embedding_vector: embedding,
      model: model || 'gemmini-vision-2024',
      token_count: text.split(' ').length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## API Contracts

### OpenAI ChatGPT

**Base URL**: `https://api.openai.com/v1`

**Authentication**: `Authorization: Bearer {OPENAI_API_KEY}`

**Supported Models**:
- `gpt-4o-mini` (Recommended for cost/performance)
- `gpt-4-turbo`
- `gpt-4`

**Example Request**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant"},
      {"role": "user", "content": "Extract metadata from this certificate OCR..."}
    ],
    "temperature": 0.3,
    "max_tokens": 1024
  }'
```

### Google Gemmini / Vision API

**Base URL**: `https://vision.googleapis.com/v1`

**Authentication**: API Key or Service Account

**Capabilities**:
- Document OCR (vision/ocr)
- Handwriting recognition
- Object detection
- Text detection
- Face detection
- Embeddings

**Example Request** (through your backend):
```bash
curl https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "image": {"source": {"imageUri": "gs://bucket/image.jpg"}},
        "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
      }
    ]
  }'
```

## Workflow Examples

### Complete Certificate Upload Workflow

```typescript
// Frontend
import { processCertificateUpload } from '@/services/certificateService';

export async function handleCertificateUpload(file: File) {
  const userId = getCurrentUserId();
  
  // Show loading
  setLoading(true);
  
  try {
    const result = await processCertificateUpload(
      file,
      userId,      // student_id
      userId       // uploader_id
    );
    
    if (result.success) {
      const { certificate, requiresReview } = result.data!;
      
      showSuccess(`Certificate uploaded! ID: ${certificate.id}`);
      
      if (requiresReview) {
        showWarning('Certificate requires faculty review due to low confidence');
      }
      
      // Refresh certificates list
      await fetchStudentCertificates();
    } else {
      showError(result.error?.message || 'Upload failed');
    }
  } finally {
    setLoading(false);
  }
}
```

### Portfolio Generation Workflow

```typescript
import { generatePortfolio, getPortfolio } from '@/services/portfolioService';

export async function handleGeneratePortfolio() {
  try {
    const result = await generatePortfolio(studentId, 'recruiters');
    
    if (result.success) {
      const portfolio = result.data!;
      
      // Show portfolio
      setPortfolio(portfolio);
      
      // Generate share link
      const shareLink = `https://pramansetu.com/portfolio/${portfolio.share_token}`;
      showSuccess(`Portfolio generated! Share: ${shareLink}`);
    }
  } catch (error) {
    showError('Failed to generate portfolio');
  }
}
```

### Copilot Chat Workflow

```typescript
import { sendChatMessage, getChatHistory } from '@/services/chatSearchService';

export async function handleSendMessage(message: string) {
  try {
    // Stream response
    setIsStreaming(true);
    let fullResponse = '';
    
    const result = await sendChatMessage(
      userId,
      message,
      { role: 'student' },
      (chunk) => {
        // Update UI with streamed chunks
        fullResponse += chunk;
        setChatResponse(fullResponse);
      }
    );
    
    setIsStreaming(false);
    
    if (result.success) {
      // Message saved, show in history
      const history = await getChatHistory(userId);
      setChatMessages(history);
    }
  } catch (error) {
    showError('Chat failed');
  }
}
```

### Semantic Search Workflow

```typescript
import { semanticStudentSearch } from '@/services/chatSearchService';

export async function searchStudents(query: string) {
  try {
    const result = await semanticStudentSearch(query, 10);
    
    if (result.success) {
      const students = result.data!;
      
      // Display results
      setSearchResults(students);
      
      // Students can now be contacted or portfolios viewed
      students.forEach(student => {
        console.log(`${student.name} - Match: ${student.score}`);
        if (student.portfolio_link) {
          console.log(`Portfolio: ${student.portfolio_link}`);
        }
      });
    }
  } catch (error) {
    showError('Search failed');
  }
}
```

### Audit Report Generation Workflow

```typescript
import { generateNAACAuditReport } from '@/services/auditReportService';

export async function handleGenerateAuditReport() {
  try {
    setGenerating(true);
    
    const result = await generateNAACAuditReport(
      adminId,
      '2024-01-01',
      '2024-12-31',
      'Computer Science' // Optional department filter
    );
    
    if (result.success) {
      const report = result.data!;
      
      showSuccess(`Report generated! Verification rate: ${report.verification_rate}%`);
      
      // Download report
      if (report.pdf_url) {
        window.open(report.pdf_url);
      }
    }
  } catch (error) {
    showError('Report generation failed');
  } finally {
    setGenerating(false);
  }
}
```

## Performance Optimization

### Caching Strategies

1. **Embedding Cache**: Store computed embeddings to avoid recalculation
2. **Certificate Cache**: Cache verified certificates locally
3. **Portfolio Cache**: Cache generated portfolios (regenerate on activity change)

### Batch Processing

```typescript
// Batch process multiple files
import { preprocessImages } from '@/services/imagePreprocessingService';

const files = [...selectedFiles];
const result = await preprocessImages(files, {
  maxWidth: 2048,
  quality: 85
});
```

### Async Processing

Use background jobs for heavy operations:

```typescript
// Long-running operations should use background workers
// Example: audit report generation > 60 seconds
const reportId = await queueBackgroundJob({
  type: 'generate_audit_report',
  params: { startDate, endDate, department }
});

// Poll for completion
const pollStatus = setInterval(async () => {
  const report = await getAuditReport(reportId);
  if (report.status === 'generated') {
    clearInterval(pollStatus);
    showSuccess('Report ready!');
  }
}, 2000);
```

## Error Handling

All services return `ServiceResult<T>` type:

```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
```

**Best Practices**:

```typescript
const result = await someService();

if (result.success) {
  // Use result.data!
} else {
  // Handle result.error
  console.error(`[${result.error!.code}] ${result.error!.message}`);
  
  // Show user-friendly message
  switch(result.error!.code) {
    case 'FILE_TOO_LARGE':
      showError('File is too large. Max 10MB.');
      break;
    case 'OCR_FAILED':
      showError('Could not read certificate. Try a clearer image.');
      break;
    default:
      showError('An error occurred. Please try again.');
  }
}
```

## Monitoring & Logging

### Key Metrics to Track

1. **OCR Performance**: Success rate, avg confidence, processing time
2. **LLM Performance**: Token usage, latency, error rate
3. **Embedding Performance**: Generation time, search latency
4. **User Workflow**: Certificate upload completion, portfolio generation success

### Logging Template

```typescript
const logger = {
  ocrProcessed: (certificateId, confidence, timeMs) => {
    console.log(`[OCR] Certificate ${certificateId}: ${confidence}% confidence in ${timeMs}ms`);
  },
  
  llmCalled: (operation, tokens, timeMs) => {
    console.log(`[LLM] ${operation}: ${tokens} tokens, ${timeMs}ms`);
  },
  
  embeddingGenerated: (itemId, timeMs) => {
    console.log(`[EMBEDDING] Generated for ${itemId} in ${timeMs}ms`);
  },
  
  error: (code, message, details) => {
    console.error(`[ERROR] ${code}: ${message}`, details);
  }
};
```

## Deployment Checklist

- [ ] Update `.env.local` with actual API endpoints
- [ ] Set backend API keys in production environment variables
- [ ] Run Supabase migration: `supabase/certificates_schema.sql`
- [ ] Test certificate upload end-to-end
- [ ] Test portfolio generation
- [ ] Test copilot chat
- [ ] Implement monitoring/logging
- [ ] Set up error alerting
- [ ] Configure CORS for API endpoints
- [ ] Set rate limits on API endpoints
- [ ] Encrypt sensitive data in transit (use HTTPS)
- [ ] Test with real certificate images

## Troubleshooting

### OCR confidence too low

**Symptoms**: Certificates marked for review despite valid content

**Solutions**:
1. Check image quality - ensure clear, well-lit photos
2. Adjust `OCR_CONFIDENCE_THRESHOLD` (currently 0.75)
3. Try preprocessing with deskew enabled
4. Use `detectDocumentType()` to validate input

### Duplicate detection false positives

**Symptoms**: Valid unique certificates marked as duplicates

**Solutions**:
1. Increase `EMBEDDING_SIMILARITY_THRESHOLD` (currently 0.92)
2. Ensure embeddings use diverse text fields
3. Check embedding model is working correctly
4. Review manually and reject false positives

### Chat responses too long or off-topic

**Solutions**:
1. Adjust LLM temperature (lower = more consistent, 0.0-0.3 recommended)
2. Add more specific system prompts
3. Reduce `max_tokens` limit per response
4. Use few-shot examples in prompts

## Future Enhancements

1. **Blockchain Integration**: Immutable certificate verification
2. **Multi-language Support**: OCR and LLM in regional languages
3. **Custom Model Training**: Fine-tuned models for institution-specific certificates
4. **Real-time Collaboration**: Multiple faculty reviewing certificates
5. **Advanced Analytics**: Skill trending, student success prediction
6. **Integration APIs**: Third-party integrations with LinkedIn, GitHub

## Support & Maintenance

- Monitor API usage and costs (OpenAI + Google)
- Update model versions regularly
- Review and improve confidence thresholds
- Collect feedback from faculty and students
- Regular security audits of API integrations
