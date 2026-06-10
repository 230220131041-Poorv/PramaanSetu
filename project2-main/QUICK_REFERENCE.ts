// ==============================================
// Quick Reference: All Exported Functions
// ==============================================

/**
 * This file documents all exported functions from the LLM/Vision integration.
 * Copy and use these imports in your components.
 */

// =====================================================
// IMAGE PREPROCESSING SERVICE
// =====================================================
import {
  preprocessImage,           // Main preprocessing pipeline
  preprocessPDF,             // PDF to images conversion
  preprocessFile,            // Universal file preprocessor
  preprocessImages,          // Batch image processing
  getImageInfo,              // Get image dimensions/type
} from '@/services/imagePreprocessingService';

// =====================================================
// VISION SERVICE (OCR, Embeddings, Search)
// =====================================================
import {
  performOCR,                // Extract text from images
  extractTables,             // Extract table data
  detectDocumentType,        // Classify document (certificate, invoice, etc.)
  verifyDocumentAuthenticity, // Detect tampering
  generateEmbedding,         // Create semantic vectors
  generateBatchEmbeddings,   // Batch embedding generation
  semanticSearch,            // Find similar embeddings
  cosineSimilarity,          // Calculate vector similarity
  findSimilarVectors,        // Find similar from list
  healthCheck,               // Check service status
  initializeVisionService,   // Configure vision service
} from '@/services/visionService';

// =====================================================
// LLM SERVICE (ChatGPT)
// =====================================================
import {
  extractCertificateMetadata,    // Parse OCR to structured data
  generateValidationSummary,     // Create faculty review notes
  generatePortfolioContent,      // Generate bio + achievements
  generateAuditReport,           // NAAC audit report
  streamCopilotResponse,         // Stream chat responses
  parseSearchQuery,              // NL to filters conversion
  initializeLLMService,          // Configure LLM service
  healthCheck as llmHealthCheck, // Check LLM status
} from '@/services/llmService';

// =====================================================
// CERTIFICATE SERVICE (Orchestrator)
// =====================================================
import {
  processCertificateUpload,  // Complete upload pipeline
  getCertificate,            // Fetch single certificate
  getStudentCertificates,    // Get all student certs
  verifyCertificate,         // Faculty approval
  rejectCertificate,         // Faculty rejection
} from '@/services/certificateService';

// =====================================================
// PORTFOLIO SERVICE
// =====================================================
import {
  generatePortfolio,              // Create portfolio from activities
  getPortfolio,                   // Fetch student portfolio
  getPublicPortfolio,             // Public portfolio access
  updatePortfolioVisibility,      // Set sharing permissions
  regeneratePortfolio,            // Regenerate from new activities
  exportPortfolioAsJSON,          // Export data
  getPortfolioStats,              // Get statistics
} from '@/services/portfolioService';

// =====================================================
// CHAT & SEARCH SERVICE
// =====================================================
import {
  sendChatMessage,                // Send to copilot + save
  getChatHistory,                 // Fetch message history
  clearChatHistory,               // Delete all messages
  deleteChatMessage,              // Delete single message
  semanticStudentSearch,          // Find students by NL query
  searchCertificates,             // Search certificates
  searchActivities,               // Search activities
} from '@/services/chatSearchService';

// =====================================================
// AUDIT REPORT SERVICE
// =====================================================
import {
  generateNAACAuditReport,        // Generate NAAC report
  getAuditReport,                 // Fetch report
  listAuditReports,               // List all reports
  getAuditInsights,               // Get statistics
  exportAuditReportAsMarkdown,    // Export to markdown
  exportAuditReportAsJSON,        // Export to JSON
  deleteAuditReport,              // Delete report
  getAuditReportSummary,          // Dashboard summary
} from '@/services/auditReportService';

// =====================================================
// TYPE DEFINITIONS
// =====================================================
import type {
  // Certificates
  Certificate,
  CertificateInsert,
  CertificateMetadata,
  CertificateEmbedding,
  
  // Validation
  ValidationTask,
  ValidationTaskInsert,
  VerificationStatus,
  TaskStatus,
  
  // Verification
  VerificationBadge,
  
  // Portfolio
  Portfolio,
  PortfolioInsert,
  PortfolioAchievement,
  VisibilityLevel,
  
  // Chat
  ChatMessage,
  ChatMessageInsert,
  ChatRole,
  ChatRequest,
  ChatStreamResponse,
  
  // Audit
  AuditReport,
  AuditReportInsert,
  AuditReportData,
  
  // API Types
  OCRRequest,
  OCRResponse,
  MetadataExtractionRequest,
  MetadataExtractionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  PortfolioGenerationRequest,
  PortfolioGenerationResponse,
  SearchQueryRequest,
  SearchQueryResponse,
  
  // Utilities
  ServiceError,
  ServiceResult,
} from '@/types/llm-types';

// =====================================================
// EXAMPLE USAGE PATTERNS
// =====================================================

/**
 * Example 1: Complete Certificate Upload Workflow
 */
async function exampleCertificateUpload(file: File, studentId: string) {
  const result = await processCertificateUpload(file, studentId, studentId);
  
  if (result.success) {
    console.log('Certificate ID:', result.data?.certificate.id);
    console.log('Metadata:', result.data?.certificate.metadata);
    console.log('Requires review:', result.data?.requiresReview);
  } else {
    console.error('Error:', result.error?.message);
  }
}

/**
 * Example 2: Portfolio Generation
 */
async function examplePortfolioGeneration(studentId: string) {
  const result = await generatePortfolio(studentId, 'recruiters');
  
  if (result.success) {
    const portfolio = result.data!;
    console.log('Bio:', portfolio.bio);
    console.log('Share link:', `https://pramansetu.com/portfolio/${portfolio.share_token}`);
  }
}

/**
 * Example 3: Copilot Chat
 */
async function exampleCopilotChat(userId: string) {
  const result = await sendChatMessage(
    userId,
    'How do I upload a new activity?',
    { role: 'student' },
    (chunk) => console.log('Response:', chunk) // Streaming
  );
  
  if (result.success) {
    console.log('Full response saved as message:', result.data?.id);
  }
}

/**
 * Example 4: Semantic Student Search
 */
async function exampleSemanticSearch(query: string) {
  const result = await semanticStudentSearch(query, 10);
  
  if (result.success) {
    for (const student of result.data!) {
      console.log(`${student.name} (Match: ${student.score})`);
      if (student.portfolio_link) {
        console.log(`  Portfolio: ${student.portfolio_link}`);
      }
    }
  }
}

/**
 * Example 5: Audit Report Generation
 */
async function exampleAuditReport() {
  const result = await generateNAACAuditReport(
    adminId,
    '2024-01-01',
    '2024-12-31',
    'Computer Science'
  );
  
  if (result.success) {
    console.log('Report generated:', result.data?.id);
    console.log('Verification rate:', result.data?.verification_rate, '%');
    if (result.data?.pdf_url) {
      window.open(result.data.pdf_url);
    }
  }
}

/**
 * Example 6: Custom LLM Request
 */
async function exampleCustomLLMRequest() {
  const { streamCopilotResponse } = await import('@/services/llmService');
  
  const result = await streamCopilotResponse(
    'Explain how to verify a certificate',
    { role: 'faculty' },
    (chunk) => process.stdout.write(chunk) // Stream to console
  );
  
  if (result.success) {
    console.log('\nFull response:', result.data);
  }
}

/**
 * Example 7: Batch Image Processing
 */
async function exampleBatchProcessing(files: File[]) {
  const { preprocessImages } = await import('@/services/imagePreprocessingService');
  
  const result = await preprocessImages(files, {
    maxWidth: 2048,
    quality: 85,
    deskew: true
  });
  
  if (result.success) {
    console.log(`Processed ${result.data!.length} images`);
  }
}

// =====================================================
// COMMON PATTERNS
// =====================================================

/**
 * Pattern 1: Error Handling
 */
function handleServiceError(error: ServiceError) {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      return 'Please select a file smaller than 10MB';
    case 'OCR_FAILED':
      return 'Could not read certificate. Try a clearer image.';
    case 'METADATA_EXTRACTION_FAILED':
      return 'Could not extract certificate details. Please verify manually.';
    case 'NO_VERIFIED_ACTIVITIES':
      return 'You need verified activities to generate a portfolio.';
    default:
      return `Error: ${error.message}`;
  }
}

/**
 * Pattern 2: Loading State Management
 */
async function processCertificateWithLoading(file: File, studentId: string) {
  let isLoading = true;
  let progress = 0;
  
  try {
    // Preprocessing
    progress = 25;
    const preResult = await preprocessImage(file, { deskew: true });
    if (!preResult.success) throw preResult.error;
    
    // OCR
    progress = 50;
    const ocrResult = await performOCR(preResult.data!.data);
    if (!ocrResult.success) throw ocrResult.error;
    
    // Full pipeline
    progress = 75;
    const result = await processCertificateUpload(file, studentId, studentId);
    
    progress = 100;
    return result;
  } finally {
    isLoading = false;
  }
}

/**
 * Pattern 3: Caching Results
 */
const certificateCache = new Map<string, Certificate>();

async function getCertificateWithCache(id: string): Promise<Certificate | null> {
  // Check cache
  if (certificateCache.has(id)) {
    return certificateCache.get(id) || null;
  }
  
  // Fetch from DB
  const cert = await getCertificate(id);
  
  // Cache result
  if (cert) {
    certificateCache.set(id, cert);
  }
  
  return cert;
}

/**
 * Pattern 4: Retry Logic
 */
async function withRetry<T>(
  fn: () => Promise<ServiceResult<T>>,
  maxRetries = 3,
  delayMs = 1000
): Promise<ServiceResult<T>> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    
    if (result.success) {
      return result;
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  
  return {
    success: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: 'Operation failed after maximum retries',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Pattern 5: Streaming Response Handler
 */
async function handleStreamingResponse(
  message: string,
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void
) {
  let fullText = '';
  
  const result = await sendChatMessage(
    currentUserId,
    message,
    { role: 'student' },
    (chunk) => {
      fullText += chunk;
      onChunk(chunk); // Update UI progressively
    }
  );
  
  if (result.success) {
    onComplete(fullText);
  }
  
  return result;
}

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorCode?: string;
}

const metrics: PerformanceMetrics[] = [];

async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    
    metrics.push({
      operation,
      startTime,
      endTime: performance.now(),
      duration: performance.now() - startTime,
      success: result.success,
      errorCode: result.error?.code,
    });
    
    return result;
  } catch (error) {
    metrics.push({
      operation,
      startTime,
      endTime: performance.now(),
      duration: performance.now() - startTime,
      success: false,
      errorCode: 'EXCEPTION',
    });
    
    throw error;
  }
}

// =====================================================
// EXPORT SUMMARY
// =====================================================

export const PramanetuAI = {
  // Image Processing
  preprocessImage,
  preprocessImages,
  
  // Vision & OCR
  performOCR,
  generateEmbedding,
  semanticSearch,
  
  // LLM
  extractCertificateMetadata,
  streamCopilotResponse,
  
  // Certificates
  processCertificateUpload,
  verifyCertificate,
  
  // Portfolio
  generatePortfolio,
  
  // Chat & Search
  sendChatMessage,
  semanticStudentSearch,
  
  // Audit
  generateNAACAuditReport,
  
  // Utilities
  trackPerformance,
  withRetry,
  handleServiceError,
};

export default PramanetuAI;

/**
 * USAGE IN COMPONENTS:
 *
 * import { processCertificateUpload, type Certificate } from '@/services';
 *
 * export default function UploadCertificate() {
 *   const [certificate, setCertificate] = useState<Certificate | null>(null);
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   async function handleUpload(file: File) {
 *     setLoading(true);
 *     setError(null);
 *
 *     const result = await processCertificateUpload(file, studentId, studentId);
 *
 *     if (result.success) {
 *       setCertificate(result.data?.certificate || null);
 *     } else {
 *       setError(result.error?.message || 'Upload failed');
 *     }
 *
 *     setLoading(false);
 *   }
 *
 *   return (
 *     // Your JSX here
 *   );
 * }
 */
