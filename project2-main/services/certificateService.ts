// ==============================================
// Certificate Service
// Orchestrates OCR, metadata extraction, embeddings,
// and validation workflow
// ==============================================

import { supabase } from '@/lib/supabase';
import {
  Certificate,
  CertificateInsert,
  ValidationTask,
  VerificationBadge,
  ServiceResult,
} from '@/types/llm-types';
import { preprocessImage } from './imagePreprocessingService';
import { performOCR, generateEmbedding, findSimilarVectors, cosineSimilarity } from './visionService';
import { extractCertificateMetadata, generateValidationSummary } from './llmService';

// =============================================
// Constants
// =============================================

const OCR_CONFIDENCE_THRESHOLD = parseFloat(process.env.REACT_APP_OCR_CONFIDENCE_THRESHOLD || '0.75');
const EMBEDDING_SIMILARITY_THRESHOLD = parseFloat(
  process.env.REACT_APP_EMBEDDING_SIMILARITY_THRESHOLD || '0.92'
);
const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760'); // 10MB

// =============================================
// Main Certificate Upload & Processing
// =============================================

/**
 * Process uploaded certificate file through the entire pipeline
 * 1. Preprocess image
 * 2. Perform OCR
 * 3. Extract metadata using LLM
 * 4. Generate embeddings
 * 5. Check for duplicates
 * 6. Save to database
 * 7. Create validation task if needed
 */
export async function processCertificateUpload(
  file: File,
  studentId: string,
  uploaderId: string
): Promise<
  ServiceResult<{
    certificate: Certificate;
    validationTaskCreated: boolean;
    requiresReview: boolean;
  }>
> {
  try {
    // Step 1: Validate file
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum limit of ${MAX_FILE_SIZE} bytes`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const supportedFormats = (process.env.REACT_APP_SUPPORTED_FORMATS || 'pdf,jpg,jpeg,png,webp').split(',');
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: `File format not supported. Supported formats: ${supportedFormats.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Step 2: Preprocess image
    const preprocessResult = await preprocessImage(file, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85,
      deskew: true,
      removeNoise: true,
    });

    if (!preprocessResult.success) {
      return {
        success: false,
        error: preprocessResult.error,
      };
    }

    const preprocessedImage = preprocessResult.data!;

    // Upload preprocessed image to Supabase Storage
    const fileName = `certificates/${studentId}/${Date.now()}_${file.name}`;
    const uploadedFile = await uploadToStorage(fileName, preprocessedImage.data);
    if (!uploadedFile) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload certificate to storage',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Step 3: Perform OCR
    const ocrResult = await performOCR(preprocessedImage.data);
    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error,
      };
    }

    const ocrData = ocrResult.data!;

    // Step 4: Extract metadata using LLM
    const metadataResult = await extractCertificateMetadata(ocrData.extracted_text);
    if (!metadataResult.success) {
      return {
        success: false,
        error: metadataResult.error,
      };
    }

    const { metadata, extraction_confidence } = metadataResult.data!;

    // Step 5: Generate embedding for semantic search
    const embeddingText = `${metadata.title || ''} ${metadata.course_name || ''} ${metadata.issuer || ''} ${(metadata.skills || []).join(' ')}`;
    const embeddingResult = await generateEmbedding({ text: embeddingText });

    let embeddingId: string | undefined;
    if (embeddingResult.success) {
      // Save embedding to database
      const savedEmbedding = await saveEmbedding(embeddingResult.data!.embedding_vector, embeddingText);
      if (savedEmbedding) {
        embeddingId = savedEmbedding.id;
      }
    }

    // Step 6: Check for duplicates
    let isDuplicate = false;
    let duplicateOf: string | undefined;
    let similarityScore: number | undefined;
    let requiresReview = false;

    if (embeddingResult.success) {
      const similarCerts = await findDuplicateCertificates(embeddingResult.data!.embedding_vector);
      if (similarCerts.length > 0 && similarCerts[0].score > EMBEDDING_SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        duplicateOf = similarCerts[0].id;
        similarityScore = similarCerts[0].score;
        requiresReview = true;
      }
    }

    // Step 7: Save certificate to database
    const certificateData: CertificateInsert = {
      student_id: studentId,
      uploader_id: uploaderId,
      file_url: uploadedFile,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      ocr_text: ocrData.extracted_text,
      ocr_confidence: ocrData.ocr_confidence,
      metadata,
      extraction_confidence,
      verification_status: requiresReview ? 'flagged_for_review' : 'pending',
    };

    const certificate = await saveCertificate(certificateData, {
      embedding_id: embeddingId,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf,
      similarity_score: similarityScore,
    });

    if (!certificate) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save certificate to database',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Step 8: Create validation task if needed
    let validationTaskCreated = false;
    const reasons: string[] = [];

    if (extraction_confidence < OCR_CONFIDENCE_THRESHOLD) {
      reasons.push(`Low extraction confidence (${(extraction_confidence * 100).toFixed(0)}%)`);
    }

    if (isDuplicate) {
      reasons.push('Potential duplicate detected');
    }

    if (ocrData.ocr_confidence < OCR_CONFIDENCE_THRESHOLD) {
      reasons.push(`Low OCR confidence (${(ocrData.ocr_confidence * 100).toFixed(0)}%)`);
    }

    if (reasons.length > 0) {
      // Generate validation summary
      const summaryResult = await generateValidationSummary(metadata, ocrData.extracted_text);
      const suggestedAction = summaryResult.success ? summaryResult.data : undefined;

      const task = await createValidationTask({
        certificate_id: certificate.id,
        reason: reasons.join('; '),
        suggested_action: suggestedAction,
        priority: isDuplicate ? 3 : 2,
      });

      validationTaskCreated = !!task;
      requiresReview = true;
    }

    return {
      success: true,
      data: {
        certificate,
        validationTaskCreated,
        requiresReview,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'CERTIFICATE_PROCESSING_ERROR',
        message: err.message,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get certificate by ID
 */
export async function getCertificate(certificateId: string): Promise<Certificate | null> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (error) throw error;
    return data as Certificate;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return null;
  }
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Certificate[];
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    return [];
  }
}

/**
 * Verify certificate by faculty
 */
export async function verifyCertificate(
  certificateId: string,
  validatorId: string,
  notes?: string
): Promise<ServiceResult<Certificate>> {
  try {
    // Update certificate status
    const { data, error } = await supabase
      .from('certificates')
      .update({
        verification_status: 'verified',
        verified_by: validatorId,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', certificateId)
      .select()
      .single();

    if (error) throw error;

    const certificate = data as Certificate;

    // Generate verification badge
    const badge = await generateVerificationBadge(certificateId);
    if (!badge) {
      console.warn('Failed to generate verification badge');
    }

    // Close any validation tasks
    await closeValidationTasks(certificateId);

    return {
      success: true,
      data: certificate,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: `Failed to verify certificate: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Reject certificate by faculty
 */
export async function rejectCertificate(
  certificateId: string,
  validatorId: string,
  reason: string
): Promise<ServiceResult<Certificate>> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .update({
        verification_status: 'rejected',
        verified_by: validatorId,
        verified_at: new Date().toISOString(),
        verification_notes: reason,
      })
      .eq('id', certificateId)
      .select()
      .single();

    if (error) throw error;

    // Close any validation tasks
    await closeValidationTasks(certificateId);

    return {
      success: true,
      data: data as Certificate,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'REJECTION_ERROR',
        message: `Failed to reject certificate: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(fileName: string, base64Data: string): Promise<string | null> {
  try {
    const binaryString = atob(base64Data.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data, error } = await supabase.storage.from('certificates').upload(fileName, bytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    return null;
  }
}

/**
 * Save embedding to database
 */
async function saveEmbedding(vector: number[], text: string) {
  try {
    const { data, error } = await supabase
      .from('certificate_embeddings')
      .insert({
        embedding_text: text,
        embedding_vector: vector,
        model_name: 'gemmini-vision-2024',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving embedding:', error);
    return null;
  }
}

/**
 * Find duplicate certificates based on embedding similarity
 */
async function findDuplicateCertificates(
  embeddingVector: number[]
): Promise<Array<{ id: string; score: number }>> {
  try {
    const { data, error } = await supabase.rpc('find_similar_embeddings', {
      query_embedding: embeddingVector,
      similarity_threshold: EMBEDDING_SIMILARITY_THRESHOLD,
      match_count: 5,
    });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.certificate_id,
      score: item.similarity,
    }));
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return [];
  }
}

/**
 * Save certificate to database
 */
async function saveCertificate(
  data: CertificateInsert,
  extras?: { embedding_id?: string; is_duplicate?: boolean; duplicate_of?: string; similarity_score?: number }
) {
  try {
    const insertData = {
      ...data,
      embedding_id: extras?.embedding_id,
      is_duplicate: extras?.is_duplicate || false,
      duplicate_of: extras?.duplicate_of,
      similarity_score: extras?.similarity_score,
    };

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return certificate as Certificate;
  } catch (error) {
    console.error('Error saving certificate:', error);
    return null;
  }
}

/**
 * Create validation task for certificate
 */
async function createValidationTask(taskData: {
  certificate_id: string;
  reason: string;
  suggested_action?: string;
  priority?: number;
}): Promise<ValidationTask | null> {
  try {
    const { data, error } = await supabase
      .from('validation_tasks')
      .insert({
        certificate_id: taskData.certificate_id,
        reason: taskData.reason,
        suggested_action: taskData.suggested_action,
        priority: taskData.priority || 1,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as ValidationTask;
  } catch (error) {
    console.error('Error creating validation task:', error);
    return null;
  }
}

/**
 * Generate verification badge
 */
async function generateVerificationBadge(certificateId: string): Promise<VerificationBadge | null> {
  try {
    const badgeToken = crypto.randomUUID();
    const badgeHash = await hashString(badgeToken);

    const { data, error } = await supabase
      .from('verification_badges')
      .insert({
        certificate_id: certificateId,
        badge_token: badgeToken,
        badge_hash: badgeHash,
      })
      .select()
      .single();

    if (error) throw error;
    return data as VerificationBadge;
  } catch (error) {
    console.error('Error generating badge:', error);
    return null;
  }
}

/**
 * Close validation tasks for a certificate
 */
async function closeValidationTasks(certificateId: string): Promise<void> {
  try {
    await supabase
      .from('validation_tasks')
      .update({ status: 'closed' })
      .eq('certificate_id', certificateId)
      .neq('status', 'closed');
  } catch (error) {
    console.error('Error closing validation tasks:', error);
  }
}

/**
 * Hash string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
