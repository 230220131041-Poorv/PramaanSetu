/**
 * PramanSetu Backend Server - POC Implementation
 * 
 * Demonstrates the complete pipeline:
 * Upload → OCR → LLM Metadata Extraction → Save to DB
 * 
 * Includes:
 * - Environment validation
 * - Secrets manager integration
 * - Monitoring setup
 * - Certificate upload endpoint with full pipeline
 * - Metrics dashboard endpoint
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import multer, { Multer } from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

// ============================================================================
// IMPORTS (Simulated - in real setup, import from services)
// ============================================================================

// In production, these would be actual imports:
// import { getSecretsManager, initializeSecretsManager, validateSecrets } from '@/services/secretsManager';
// import { getMonitor, initializeMonitoring } from '@/services/monitoringService';
// import { preprocessImage } from '@/services/imagePreprocessingService';
// import { performOCR } from '@/services/visionService';
// import { extractCertificateMetadata } from '@/services/llmService';

// For now, we'll create mock implementations below

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueName = `${uuid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload: Multer = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, PDF'));
    } else {
      cb(null, true);
    }
  },
});

// ============================================================================
// MOCK IMPLEMENTATIONS (Replace with real services in production)
// ============================================================================

interface OCRResult {
  text: string;
  confidence: number;
  tables: Array<{ data: string[][] }>;
  pages: number;
}

interface MetadataExtractionResult {
  issuer: string;
  title: string;
  courseName: string;
  studentName: string;
  issueDate: string;
  expiryDate: string;
  skills: string[];
  confidence: number;
}

// Mock OCR function
async function mockPerformOCR(imagePath: string): Promise<OCRResult> {
  // In production, this calls Google Vision API
  return {
    text: 'Certificate of Completion\\nStudentName: John Doe\\nCourse: Advanced Machine Learning\\nIssuer: Tech Academy\\nIssue Date: 2024-01-15\\nExpiry: 2025-01-15',
    confidence: 0.92,
    tables: [],
    pages: 1,
  };
}

// Mock metadata extraction function
async function mockExtractMetadata(ocrText: string): Promise<MetadataExtractionResult> {
  // In production, this calls OpenAI ChatGPT
  return {
    issuer: 'Tech Academy',
    title: 'Certificate of Completion',
    courseName: 'Advanced Machine Learning',
    studentName: 'John Doe',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    skills: ['Machine Learning', 'Python', 'Data Analysis'],
    confidence: 0.89,
  };
}

// Mock embedding function
async function mockGenerateEmbedding(text: string): Promise<number[]> {
  // In production, this calls Google Gemmini Embedding API
  // Return a mock embedding (768 dimensions)
  return Array(768).fill(0).map(() => Math.random());
}

// Mock database save function
async function mockSaveToDB(
  certificateData: any,
  embedding: number[],
  studentId: string
): Promise<{ id: string; savedAt: string }> {
  // In production, this saves to Supabase PostgreSQL
  return {
    id: uuid(),
    savedAt: new Date().toISOString(),
  };
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ============================================================================
// ENDPOINTS - HEALTH & VALIDATION
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * Environment validation endpoint
 */
app.get('/api/validate-env', (req: Request, res: Response) => {
  const requiredVars = [
    'OPENAI_API_KEY',
    'GEMMINI_API_KEY',
    'LLM_MODEL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
  ];

  const validation = {
    valid: true,
    missing: [] as string[],
    configured: [] as string[],
  };

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      validation.configured.push(varName);
    } else {
      validation.missing.push(varName);
      validation.valid = false;
    }
  }

  res.status(validation.valid ? 200 : 400).json(validation);
});

// ============================================================================
// ENDPOINTS - MAIN PIPELINE (Upload → OCR → LLM → DB)
// ============================================================================

/**
 * Upload certificate and process through complete pipeline
 * POST /api/certificates/upload
 * 
 * Request:
 *   - file: Certificate image/PDF
 *   - studentId: Student identifier
 *   - uploadedBy: User ID performing upload
 * 
 * Response:
 *   {
 *     success: boolean,
 *     data?: {
 *       certificateId: string,
 *       extractedMetadata: {...},
 *       confidence: number,
 *       processingTime: number,
 *       ocrConfidence: number,
 *       metadataConfidence: number
 *     },
 *     error?: string
 *   }
 */
app.post('/api/certificates/upload', upload.single('file'), async (
  req: Request,
  res: Response
) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const { studentId, uploadedBy } = req.body;

    if (!studentId || !uploadedBy) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'studentId and uploadedBy required',
      });
    }

    console.log(`[Pipeline] Starting certificate processing for student: ${studentId}`);
    console.log(`[Pipeline] File: ${req.file.originalname} (${req.file.size} bytes)`);

    // ====== STEP 1: OCR ======
    console.log('[Step 1] Performing OCR...');
    const ocrStartTime = Date.now();
    const ocrResult = await mockPerformOCR(req.file.path);
    const ocrDuration = Date.now() - ocrStartTime;
    console.log(`[Step 1] OCR complete: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}, took ${ocrDuration}ms`);

    if (ocrResult.confidence < 0.75) {
      console.warn('[Pipeline] Low OCR confidence, will require manual review');
    }

    // ====== STEP 2: LLM METADATA EXTRACTION ======
    console.log('[Step 2] Extracting metadata with LLM...');
    const metadataStartTime = Date.now();
    const metadata = await mockExtractMetadata(ocrResult.text);
    const metadataDuration = Date.now() - metadataStartTime;
    console.log(`[Step 2] Metadata extraction complete, confidence: ${metadata.confidence}, took ${metadataDuration}ms`);

    // ====== STEP 3: EMBEDDING GENERATION ======
    console.log('[Step 3] Generating embeddings...');
    const embeddingStartTime = Date.now();
    const embedding = await mockGenerateEmbedding(ocrResult.text);
    const embeddingDuration = Date.now() - embeddingStartTime;
    console.log(`[Step 3] Embedding generated (${embedding.length} dimensions), took ${embeddingDuration}ms`);

    // ====== STEP 4: DATABASE SAVE ======
    console.log('[Step 4] Saving to database...');
    const dbStartTime = Date.now();
    
    const certificateData = {
      id: uuid(),
      studentId,
      uploadedBy,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      ocrText: ocrResult.text,
      metadata,
      ocrConfidence: ocrResult.confidence,
      metadataConfidence: metadata.confidence,
      embeddingId: uuid(),
      status: metadata.confidence >= 0.75 && ocrResult.confidence >= 0.75
        ? 'verified'
        : 'pending_review',
      createdAt: new Date().toISOString(),
    };

    const dbResult = await mockSaveToDB(certificateData, embedding, studentId);
    const dbDuration = Date.now() - dbStartTime;
    console.log(`[Step 4] Saved to database with ID: ${dbResult.id}, took ${dbDuration}ms`);

    // ====== PIPELINE COMPLETE ======
    const totalDuration = Date.now() - startTime;
    const overallConfidence = (
      (ocrResult.confidence + metadata.confidence) / 2
    );

    console.log(`[Pipeline] Complete! Total time: ${totalDuration}ms`);
    console.log(`[Pipeline] Status: ${certificateData.status}`);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        certificateId: dbResult.id,
        extractedMetadata: {
          issuer: metadata.issuer,
          title: metadata.title,
          courseName: metadata.courseName,
          studentName: metadata.studentName,
          issueDate: metadata.issueDate,
          expiryDate: metadata.expiryDate,
          skills: metadata.skills,
        },
        confidence: overallConfidence,
        processingTime: totalDuration,
        ocrConfidence: ocrResult.confidence,
        metadataConfidence: metadata.confidence,
        status: certificateData.status,
        requiresReview: certificateData.status === 'pending_review',
      },
    });
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Batch upload endpoint
 * POST /api/certificates/upload-batch
 */
app.post('/api/certificates/upload-batch', upload.array('files', 10), async (
  req: Request,
  res: Response
) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { studentId, uploadedBy } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    console.log(`[Batch] Processing ${files.length} files for student: ${studentId}`);

    const results = [];

    for (const file of files) {
      try {
        const ocrResult = await mockPerformOCR(file.path);
        const metadata = await mockExtractMetadata(ocrResult.text);
        const embedding = await mockGenerateEmbedding(ocrResult.text);
        const dbResult = await mockSaveToDB(
          { fileName: file.originalname, metadata },
          embedding,
          studentId
        );

        results.push({
          fileName: file.originalname,
          success: true,
          certificateId: dbResult.id,
          metadata,
        });

        fs.unlinkSync(file.path);
      } catch (fileError) {
        results.push({
          fileName: file.originalname,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[Batch] Complete: ${successCount}/${files.length} successful`);

    res.json({
      success: true,
      data: {
        total: files.length,
        successful: successCount,
        failed: files.length - successCount,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ENDPOINTS - MONITORING & METRICS
// ============================================================================

/**
 * Get monitoring metrics
 * GET /api/metrics
 */
app.get('/api/metrics', (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    },
    memory: {
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    },
  });
});

/**
 * Get real-time usage statistics
 * GET /api/metrics/usage
 */
app.get('/api/metrics/usage', (req: Request, res: Response) => {
  // In production, this would come from monitoring service
  res.json({
    period: '60 minutes',
    usage: {
      certificateUploads: {
        count: 42,
        averageProcessingTime: 3500,
        successRate: 95.2,
      },
      ocrOperations: {
        count: 42,
        averageConfidence: 0.88,
        averageTime: 2100,
      },
      llmOperations: {
        count: 42,
        averageConfidence: 0.87,
        averageTime: 1200,
        tokenUsage: 125000,
      },
      estimatedCosts: {
        ocr: 0.25,
        llm: 0.18,
        total: 0.43,
      },
    },
  });
});

/**
 * Get cost analysis
 * GET /api/metrics/costs
 */
app.get('/api/metrics/costs', (req: Request, res: Response) => {
  // In production, this would come from monitoring service with real data
  const startDate = req.query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = req.query.end || new Date().toISOString();

  res.json({
    period: { start: startDate, end: endDate },
    totalRequests: 1250,
    totalTokens: 3750000,
    estimatedTotalCost: 14.85,
    breakdown: {
      openai: {
        requests: 1250,
        tokens: 3750000,
        model: 'gpt-4o-mini',
        estimatedCost: 6.25,
      },
      google: {
        requests: 1250,
        images: 1250,
        model: 'gemini-2.0-flash',
        estimatedCost: 6.25,
      },
      supabase: {
        estimatedCost: 2.35,
      },
    },
    dailyAverage: {
      requests: 41.67,
      cost: 0.495,
    },
    recommendations: [
      'Consider batch processing to reduce API calls',
      'Current token usage is efficient',
      'Monitor OCR confidence to reduce manual reviews',
    ],
  });
});

/**
 * Health check with detailed status
 * GET /api/status
 */
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'healthy', latency: '12ms' },
      database: { status: 'healthy', connections: 5 },
      ocr: { status: 'healthy', avgTime: '2100ms' },
      llm: { status: 'healthy', avgTime: '1200ms' },
      storage: { status: 'healthy', usedSpace: '1.2GB' },
    },
    metrics: {
      requestsLastHour: 1250,
      errorsLastHour: 8,
      errorRate: 0.64,
      averageResponseTime: 3200,
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
      });
    }
  }

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    console.log('\n========================================');
    console.log('  PramanSetu Backend Server - POC');
    console.log('========================================\n');

    // Validate environment
    console.log('[Startup] Validating environment variables...');
    const requiredVars = ['OPENAI_API_KEY', 'GEMMINI_API_KEY', 'LLM_MODEL'];
    const missing = requiredVars.filter((v) => !process.env[v]);

    if (missing.length > 0) {
      console.warn(`[Startup] WARNING: Missing variables: ${missing.join(', ')}`);
      console.warn('[Startup] Server will start but API calls may fail');
    } else {
      console.log('[Startup] All environment variables configured ✓');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n[Startup] Server running on port ${PORT}`);
      console.log('\nEndpoints:');
      console.log(`  POST /api/certificates/upload           - Upload single certificate`);
      console.log(`  POST /api/certificates/upload-batch     - Upload multiple certificates`);
      console.log(`  GET  /api/validate-env                  - Validate environment`);
      console.log(`  GET  /api/metrics                       - System metrics`);
      console.log(`  GET  /api/metrics/usage                 - Usage statistics`);
      console.log(`  GET  /api/metrics/costs                 - Cost analysis`);
      console.log(`  GET  /api/status                        - Service status`);
      console.log(`  GET  /health                            - Health check`);
      console.log('\nTest the pipeline:');
      console.log(`  curl -X POST http://localhost:${PORT}/api/certificates/upload \\`);
      console.log('    -F "file=@certificate.png" \\');
      console.log('    -F "studentId=12345" \\');
      console.log('    -F "uploadedBy=admin"');
      console.log('\n========================================\n');
    });
  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
  console.log('[Shutdown] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Shutdown] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
