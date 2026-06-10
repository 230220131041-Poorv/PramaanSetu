// ==============================================
// LLM & Vision Feature Types
// Extends database.ts with certificate and AI features
// ==============================================

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'flagged_for_review';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'closed';
export type VisibilityLevel = 'private' | 'students' | 'recruiters' | 'public';

// ==============================================
// CERTIFICATE TYPES
// ==============================================

export interface CertificateMetadata {
  issuer?: string;
  title?: string;
  course_name?: string;
  student_name?: string;
  issue_date?: string; // YYYY-MM-DD
  expiry_date?: string | null; // YYYY-MM-DD or null
  skills?: string[];
  [key: string]: any;
}

export interface Certificate {
  id: string;
  student_id: string;
  uploader_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  ocr_text?: string;
  ocr_confidence?: number;
  ocr_processing_time_ms?: number;
  metadata?: CertificateMetadata;
  extraction_confidence?: number;
  embedding_id?: string;
  embedding_vector?: number[]; // Vector(768)
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  is_duplicate: boolean;
  duplicate_of?: string;
  similarity_score?: number;
  created_at: string;
  updated_at: string;
}

export interface CertificateInsert {
  student_id: string;
  uploader_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  ocr_text?: string;
  ocr_confidence?: number;
  metadata?: CertificateMetadata;
  extraction_confidence?: number;
  verification_status?: VerificationStatus;
}

export interface CertificateEmbedding {
  id: string;
  certificate_id: string;
  embedding_text: string;
  embedding_vector: number[]; // Vector(768)
  model_name?: string;
  embedding_created_at: string;
  updated_at: string;
}

// ==============================================
// VALIDATION TASK TYPES
// ==============================================

export interface ValidationTask {
  id: string;
  certificate_id: string;
  status: TaskStatus;
  priority: number;
  reason: string;
  suggested_action?: string;
  assigned_to?: string;
  assigned_at?: string;
  completed_by?: string;
  completed_at?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationTaskInsert {
  certificate_id: string;
  status?: TaskStatus;
  priority?: number;
  reason: string;
  suggested_action?: string;
  assigned_to?: string;
}

// ==============================================
// VERIFICATION BADGE TYPES
// ==============================================

export interface VerificationBadge {
  id: string;
  certificate_id: string;
  badge_token: string;
  badge_hash: string;
  blockchain_tx_hash?: string;
  blockchain_network?: string;
  issued_at: string;
  expires_at?: string;
  is_revoked: boolean;
  revoked_at?: string;
  revocation_reason?: string;
}

// ==============================================
// PORTFOLIO TYPES
// ==============================================

export interface PortfolioAchievement {
  title: string;
  description: string;
  category?: string;
  date?: string;
}

export interface Portfolio {
  id: string;
  student_id: string;
  bio?: string;
  achievements?: PortfolioAchievement[];
  introductory_paragraph?: string;
  pdf_url?: string;
  share_token: string;
  public_link?: string;
  is_public: boolean;
  visibility_level: VisibilityLevel;
  generated_by_llm: boolean;
  llm_model?: string;
  last_regenerated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioInsert {
  student_id: string;
  bio?: string;
  achievements?: PortfolioAchievement[];
  introductory_paragraph?: string;
  visibility_level?: VisibilityLevel;
  generated_by_llm?: boolean;
  llm_model?: string;
}

// ==============================================
// CHAT MESSAGE TYPES
// ==============================================

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  referenced_activities?: string[]; // Array of activity IDs
  referenced_documents?: string[]; // Array of document IDs
  llm_model?: string;
  confidence_score?: number;
  is_complete: boolean;
  token_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageInsert {
  user_id: string;
  role: ChatRole;
  content: string;
  referenced_activities?: string[];
  referenced_documents?: string[];
  llm_model?: string;
  confidence_score?: number;
}

export interface ChatRequest {
  message: string;
  context?: {
    studentId?: string;
    activityIds?: string[];
    documentIds?: string[];
  };
}

export interface ChatStreamResponse {
  id: string;
  role: 'assistant';
  content: string;
  sources?: string[];
  actions?: string[];
  confidence: number;
}

// ==============================================
// AUDIT REPORT TYPES
// ==============================================

export interface AuditReportData {
  title: string;
  sections: {
    summary: string;
    statistics: Record<string, any>;
    departmentBreakdown: Record<string, any>;
    appendices: string[];
  };
  missingItems?: string[];
}

export interface AuditReport {
  id: string;
  requested_by: string;
  report_title: string;
  report_period_start: string; // YYYY-MM-DD
  report_period_end: string; // YYYY-MM-DD
  report_markdown?: string;
  report_json?: AuditReportData;
  pdf_url?: string;
  total_students?: number;
  total_verified_activities?: number;
  verification_rate?: number;
  status: 'generating' | 'generated' | 'exported';
  llm_model?: string;
  generated_at: string;
}

export interface AuditReportInsert {
  requested_by: string;
  report_title: string;
  report_period_start: string;
  report_period_end: string;
  report_markdown?: string;
  report_json?: AuditReportData;
  total_students?: number;
  total_verified_activities?: number;
  verification_rate?: number;
  status?: 'generating' | 'generated' | 'exported';
  llm_model?: string;
}

// ==============================================
// LLM API REQUEST/RESPONSE TYPES
// ==============================================

export interface OCRRequest {
  file_url: string;
  file_type?: string;
}

export interface OCRResponse {
  extracted_text: string;
  ocr_confidence: number;
  processing_time_ms: number;
  raw_response?: any;
}

export interface MetadataExtractionRequest {
  ocr_text: string;
  prompt_template?: string;
}

export interface MetadataExtractionResponse {
  metadata: CertificateMetadata;
  extraction_confidence: number;
  raw_response?: any;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding_vector: number[];
  model: string;
  token_count?: number;
}

export interface DuplicateCheckRequest {
  embedding_vector: number[];
  similarity_threshold?: number;
  limit?: number;
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  duplicate_of?: string;
  similarity_score?: number;
  similar_certificates?: Array<{
    id: string;
    similarity_score: number;
  }>;
}

export interface PortfolioGenerationRequest {
  student_id: string;
  activities: any[];
}

export interface PortfolioGenerationResponse {
  bio: string;
  achievements: PortfolioAchievement[];
  introductory_paragraph: string;
  pdf_url?: string;
  share_token: string;
}

export interface SearchQueryRequest {
  query: string;
  filters?: Record<string, any>;
  top_k?: number;
}

export interface SearchQueryResponse {
  results: Array<{
    student_id: string;
    score: number;
    summary: string;
    portfolio_link?: string;
  }>;
}

// ==============================================
// SERVICE ERROR TYPES
// ==============================================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}
