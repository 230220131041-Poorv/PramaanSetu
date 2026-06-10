// ==============================================
// OCR & Vision Service (Gemmini Integration)
// Handles OCR, image analysis, and embeddings
// ==============================================

import { ServiceResult, OCRResponse, EmbeddingResponse, EmbeddingRequest } from '@/types/llm-types';

// =============================================
// Configuration
// =============================================

const VISION_ENDPOINT = process.env.REACT_APP_VISION_ENDPOINT || 'http://localhost:3001/api/vision';
const VISION_MODEL = process.env.REACT_APP_VISION_MODEL || 'gemmini-vision-2024';

interface VisionServiceConfig {
  endpoint: string;
  apiKey?: string;
  model: string;
  timeout?: number;
}

let visionConfig: VisionServiceConfig = {
  endpoint: VISION_ENDPOINT,
  model: VISION_MODEL,
  timeout: 30000,
};

/**
 * Initialize vision service with custom configuration
 * Note: API keys should be set on backend environment, not frontend
 */
export function initializeVisionService(config: Partial<VisionServiceConfig>): void {
  visionConfig = { ...visionConfig, ...config };
}

// =============================================
// OCR Service
// =============================================

/**
 * Perform OCR on an image file or URL
 * @param fileOrUrl File or URL to process
 * @returns Promise with extracted text and confidence
 */
export async function performOCR(fileOrUrl: File | string): Promise<ServiceResult<OCRResponse>> {
  try {
    let fileUrl: string;

    // If it's a File, upload it first or convert to base64
    if (fileOrUrl instanceof File) {
      // In production, upload file to cloud storage first
      // For now, use base64
      fileUrl = await fileToBase64(fileOrUrl);
    } else {
      fileUrl = fileOrUrl;
    }

    const startTime = performance.now();

    // Call backend OCR endpoint
    const response = await fetch(`${visionConfig.endpoint}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: fileUrl,
        model: visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = performance.now() - startTime;

    return {
      success: true,
      data: {
        extracted_text: data.extracted_text || '',
        ocr_confidence: data.ocr_confidence || 0.8,
        processing_time_ms: Math.round(processingTime),
        raw_response: data,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'OCR_FAILED',
        message: `Failed to perform OCR: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Extract tables from document using vision
 * @param fileOrUrl File or URL to process
 * @returns Promise with extracted tables
 */
export async function extractTables(fileOrUrl: File | string): Promise<
  ServiceResult<{
    tables: Array<Array<Array<string>>>;
    confidence: number;
  }>
> {
  try {
    let fileUrl: string;

    if (fileOrUrl instanceof File) {
      fileUrl = await fileToBase64(fileOrUrl);
    } else {
      fileUrl = fileOrUrl;
    }

    const response = await fetch(`${visionConfig.endpoint}/extract-tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: fileUrl,
        model: visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Table extraction API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        tables: data.tables || [],
        confidence: data.confidence || 0.8,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'TABLE_EXTRACTION_FAILED',
        message: `Failed to extract tables: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Detect document type (certificate, invoice, passport, etc.)
 * @param fileOrUrl File or URL to analyze
 * @returns Promise with detected document type and confidence
 */
export async function detectDocumentType(fileOrUrl: File | string): Promise<
  ServiceResult<{
    document_type: string;
    confidence: number;
    categories: Array<{ category: string; score: number }>;
  }>
> {
  try {
    let fileUrl: string;

    if (fileOrUrl instanceof File) {
      fileUrl = await fileToBase64(fileOrUrl);
    } else {
      fileUrl = fileOrUrl;
    }

    const response = await fetch(`${visionConfig.endpoint}/detect-document-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: fileUrl,
        model: visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Document detection API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        document_type: data.document_type || 'unknown',
        confidence: data.confidence || 0.5,
        categories: data.categories || [],
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'DOCUMENT_DETECTION_FAILED',
        message: `Failed to detect document type: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Verify document authenticity (tamper detection)
 * @param fileOrUrl File or URL to verify
 * @returns Promise with authenticity score
 */
export async function verifyDocumentAuthenticity(fileOrUrl: File | string): Promise<
  ServiceResult<{
    authenticity_score: number;
    is_authentic: boolean;
    issues: string[];
  }>
> {
  try {
    let fileUrl: string;

    if (fileOrUrl instanceof File) {
      fileUrl = await fileToBase64(fileOrUrl);
    } else {
      fileUrl = fileOrUrl;
    }

    const response = await fetch(`${visionConfig.endpoint}/verify-authenticity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: fileUrl,
        model: visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Authenticity verification API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        authenticity_score: data.authenticity_score || 0.5,
        is_authentic: (data.authenticity_score || 0) > 0.7,
        issues: data.issues || [],
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'AUTHENTICITY_VERIFICATION_FAILED',
        message: `Failed to verify authenticity: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Embeddings Service
// =============================================

/**
 * Generate text embeddings for semantic search
 * @param request Embedding request with text
 * @returns Promise with embedding vector
 */
export async function generateEmbedding(request: EmbeddingRequest): Promise<ServiceResult<EmbeddingResponse>> {
  try {
    const response = await fetch(`${visionConfig.endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: request.text,
        model: request.model || visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        embedding_vector: data.embedding_vector || [],
        model: data.model || request.model || visionConfig.model,
        token_count: data.token_count,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'EMBEDDING_FAILED',
        message: `Failed to generate embeddings: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Generate multiple embeddings in batch
 * @param texts Array of texts to embed
 * @param model Embedding model
 * @returns Promise with embeddings array
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model?: string
): Promise<ServiceResult<EmbeddingResponse[]>> {
  try {
    const response = await fetch(`${visionConfig.endpoint}/embeddings/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        model: model || visionConfig.model,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout * 2), // Longer timeout for batch
    });

    if (!response.ok) {
      throw new Error(`Batch embeddings API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.embeddings || [],
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'BATCH_EMBEDDING_FAILED',
        message: `Failed to generate batch embeddings: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Semantic search using embeddings
 * @param queryEmbedding Query embedding vector
 * @param topK Number of results to return
 * @returns Promise with search results
 */
export async function semanticSearch(
  queryEmbedding: number[],
  topK: number = 10
): Promise<
  ServiceResult<
    Array<{
      id: string;
      score: number;
      metadata?: any;
    }>
  >
> {
  try {
    const response = await fetch(`${visionConfig.endpoint}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        top_k: topK,
      }),
      signal: AbortSignal.timeout(visionConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`Semantic search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.results || [],
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'SEMANTIC_SEARCH_FAILED',
        message: `Failed to perform semantic search: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param vector1 First vector
 * @param vector2 Second vector
 * @returns Similarity score (0-1)
 */
export function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    norm1 += vector1[i] * vector1[i];
    norm2 += vector2[i] * vector2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Find similar vectors from a list
 * @param queryVector Query vector
 * @param vectors List of vectors with metadata
 * @param threshold Minimum similarity threshold
 * @param topK Number of results to return
 * @returns Array of similar vectors with scores
 */
export function findSimilarVectors(
  queryVector: number[],
  vectors: Array<{ id: string; vector: number[]; metadata?: any }>,
  threshold: number = 0.5,
  topK: number = 10
): Array<{ id: string; score: number; metadata?: any }> {
  const similarities = vectors.map((item) => ({
    id: item.id,
    score: cosineSimilarity(queryVector, item.vector),
    metadata: item.metadata,
  }));

  return similarities
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// =============================================
// Utility Functions
// =============================================

/**
 * Convert File to Base64 string
 * @param file File to convert
 * @returns Promise with base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if vision service is available
 * @returns Promise with service status
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${visionConfig.endpoint}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
