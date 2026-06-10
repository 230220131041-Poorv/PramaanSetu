// ==============================================
// LLM Service (OpenAI ChatGPT Integration)
// Handles metadata extraction, portfolio generation,
// audit reports, and copilot chat
// ==============================================

import {
  ServiceResult,
  CertificateMetadata,
  MetadataExtractionResponse,
  PortfolioAchievement,
  AuditReportData,
} from '@/types/llm-types';

// =============================================
// Configuration
// =============================================

const LLM_ENDPOINT = process.env.REACT_APP_LLM_ENDPOINT || 'http://localhost:3001/api/llm';
const LLM_MODEL = process.env.REACT_APP_LLM_MODEL || 'gpt-4o-mini';

interface LLMServiceConfig {
  endpoint: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

let llmConfig: LLMServiceConfig = {
  endpoint: LLM_ENDPOINT,
  model: LLM_MODEL,
  temperature: 0.3,
  maxTokens: 2048,
  timeout: 30000,
};

/**
 * Initialize LLM service with custom configuration
 * Note: API keys should be set on backend environment
 */
export function initializeLLMService(config: Partial<LLMServiceConfig>): void {
  llmConfig = { ...llmConfig, ...config };
}

// =============================================
// Metadata Extraction Service
// =============================================

/**
 * Extract structured metadata from OCR text
 * Parses certificate details like issuer, date, skills, etc.
 * @param ocrText Raw text from OCR
 * @returns Promise with structured metadata
 */
export async function extractCertificateMetadata(
  ocrText: string
): Promise<ServiceResult<MetadataExtractionResponse>> {
  try {
    const prompt = `You are an expert at extracting structured data from certificate OCR text.
    
Parse the following OCR text and extract metadata into a JSON object with these fields:
- issuer: Organization that issued the certificate (string)
- title: Certificate title or name (string)
- course_name: Course or program name if applicable (string)
- student_name: Student's full name (string)
- issue_date: Date certificate was issued in YYYY-MM-DD format (string)
- expiry_date: Expiration date in YYYY-MM-DD format or null if no expiry (string|null)
- skills: Array of skills mentioned in the certificate (array of strings)
- duration: Duration of program/course if mentioned (string)
- grade: Grade/score achieved if mentioned (string)
- other_tags: Any other relevant tags or metadata (array of strings)

Return ONLY valid JSON, no markdown formatting or extra text.

OCR TEXT:
${ocrText}`;

    const response = await fetch(`${llmConfig.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured metadata from documents. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.0,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const metadata: CertificateMetadata = JSON.parse(jsonMatch[0]);

    // Calculate confidence based on OCR coverage
    const extractionConfidence = calculateExtractionConfidence(metadata, ocrText);

    return {
      success: true,
      data: {
        metadata,
        extraction_confidence: extractionConfidence,
        raw_response: data,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'METADATA_EXTRACTION_FAILED',
        message: `Failed to extract metadata: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Generate validation summary for faculty review
 * Creates a concise summary for the review task
 * @param metadata Extracted metadata
 * @param ocrText OCR text excerpt
 * @returns Promise with validation summary
 */
export async function generateValidationSummary(
  metadata: CertificateMetadata,
  ocrText: string
): Promise<ServiceResult<string>> {
  try {
    const prompt = `Based on the following certificate metadata and OCR text, generate a brief validation summary (2-3 lines) that a faculty member can use to quickly understand what this certificate is about and what might need verification.

Metadata:
${JSON.stringify(metadata, null, 2)}

OCR Excerpt:
${ocrText.substring(0, 300)}...

Generate a concise summary that highlights key points and any potential concerns.`;

    const response = await fetch(`${llmConfig.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are helping faculty validate student certificates. Be concise and highlight key information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'SUMMARY_GENERATION_FAILED',
        message: `Failed to generate summary: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Portfolio Generation Service
// =============================================

/**
 * Generate professional portfolio content from activities
 * Creates bio, achievements, and introductory paragraph
 * @param activities Array of verified activities
 * @returns Promise with portfolio content
 */
export async function generatePortfolioContent(
  activities: any[]
): Promise<
  ServiceResult<{
    bio: string;
    achievements: PortfolioAchievement[];
    introductory_paragraph: string;
  }>
> {
  try {
    const activitiesJson = JSON.stringify(activities, null, 2);

    const prompt = `You are an expert career coach and resume writer. Given the following verified student activities, generate professional portfolio content in JSON format with:

1. "bio": A 50-word professional biography highlighting skills and achievements
2. "achievements": An array of 6 resume-ready bullet points grouped by skill category
3. "introductory_paragraph": A compelling 100-word paragraph for the public portfolio introduction

Each achievement should be an object with "title", "description", and "category" fields.

Activities:
${activitiesJson}

Return ONLY valid JSON, no markdown formatting.`;

    const response = await fetch(`${llmConfig.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing professional portfolios and resumes. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const portfolioContent = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        bio: portfolioContent.bio || '',
        achievements: portfolioContent.achievements || [],
        introductory_paragraph: portfolioContent.introductory_paragraph || '',
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'PORTFOLIO_GENERATION_FAILED',
        message: `Failed to generate portfolio content: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Audit Report Generation Service
// =============================================

/**
 * Generate NAAC-ready audit report
 * Creates comprehensive audit report with statistics and analysis
 * @param data Report data with activities and statistics
 * @returns Promise with audit report
 */
export async function generateAuditReport(data: {
  department: string;
  period_start: string;
  period_end: string;
  total_students: number;
  verified_activities: any[];
  departmentBreakdown?: Record<string, any>;
}): Promise<ServiceResult<string>> {
  try {
    const prompt = `You are an expert in NAAC (National Accreditation and Assessment Council) audit report generation for educational institutions in India.

Generate a professional NAAC-ready audit report with the following structure:

**AUDIT REPORT - STUDENT ACTIVITIES AND ACHIEVEMENTS**

Department: ${data.department}
Period: ${data.period_start} to ${data.period_end}
Total Students Reported: ${data.total_students}
Total Verified Activities: ${data.verified_activities?.length || 0}

Include these sections:
1. Executive Summary
2. Activities Overview (categorized breakdown)
3. Achievement Analysis (skills, competencies gained)
4. Verification Status (percentage of verified vs pending)
5. Department Performance Metrics
6. Recommendations for Improvement
7. Appendices (list of activity categories and skills matrix)

Use data from:
${JSON.stringify(data.verified_activities?.slice(0, 10), null, 2)}

Format the report in markdown with appropriate headings and tables where applicable.`;

    const response = await fetch(`${llmConfig.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing NAAC audit reports for Indian educational institutions. Be comprehensive and professional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout * 2), // Longer timeout for reports
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data_response = await response.json();
    const reportMarkdown = data_response.choices?.[0]?.message?.content || '';

    return {
      success: true,
      data: reportMarkdown,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'AUDIT_REPORT_GENERATION_FAILED',
        message: `Failed to generate audit report: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Copilot Chat Service
// =============================================

/**
 * Stream chat response from LLM copilot
 * Handles student and faculty questions about activities and certificates
 * @param message User message
 * @param context Context data (activities, documents, etc.)
 * @param onChunk Callback for streaming chunks
 * @returns Promise with complete response
 */
export async function streamCopilotResponse(
  message: string,
  context?: {
    studentId?: string;
    activities?: any[];
    documents?: any[];
    role?: string;
  },
  onChunk?: (chunk: string) => void
): Promise<ServiceResult<string>> {
  try {
    const systemPrompt = `You are PramanSetu Copilot, an intelligent assistant helping students and faculty with the student activity platform.

Your responsibilities:
- Help students understand their activities and progress
- Assist faculty with validation and verification tasks
- Provide guidance on certificate uploads and portfolio generation
- Answer questions about skills, achievements, and competencies
- Suggest improvements based on student performance

Be helpful, professional, and concise. Provide actionable advice.
${context?.role === 'faculty' ? 'You are speaking to a faculty member. Focus on validation and oversight aspects.' : 'You are speaking to a student. Focus on personal growth and achievement.'}`;

    const contextText =
      context && context.activities
        ? `\n\nContext - Student Activities:\n${JSON.stringify(context.activities.slice(0, 3), null, 2)}`
        : '';

    const response = await fetch(`${llmConfig.endpoint}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: message + contextText,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
        stream: true,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout * 2),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    let fullResponse = '';

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    }

    return {
      success: true,
      data: fullResponse,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'COPILOT_RESPONSE_FAILED',
        message: `Failed to generate copilot response: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Parse natural language query into structured filters
 * Helps with semantic search and filtering
 * @param query Natural language query
 * @returns Promise with parsed filters and search vector text
 */
export async function parseSearchQuery(
  query: string
): Promise<
  ServiceResult<{
    filters: Record<string, any>;
    search_vector_text: string;
  }>
> {
  try {
    const prompt = `Parse this recruiter/admin query into structured filters and a semantic search query.

Query: "${query}"

Return JSON with:
{
  "filters": {
    "skills": ["skill1", "skill2"],
    "department": "dept_name",
    "semester": number,
    "cgpa_min": number,
    "activity_category": "category",
    "verification_status": "verified"
  },
  "search_vector_text": "natural language text optimized for semantic search"
}

Return ONLY valid JSON.`;

    const response = await fetch(`${llmConfig.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You parse natural language queries into structured filters. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.0,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(llmConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '{}';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        filters: parsed.filters || {},
        search_vector_text: parsed.search_vector_text || query,
      },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'QUERY_PARSING_FAILED',
        message: `Failed to parse query: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Utility Functions
// =============================================

/**
 * Calculate confidence score based on metadata completeness
 * @param metadata Extracted metadata
 * @param ocrText Original OCR text
 * @returns Confidence score (0-1)
 */
function calculateExtractionConfidence(metadata: CertificateMetadata, ocrText: string): number {
  let score = 0;
  let maxScore = 0;

  // Define required fields and their weights
  const weights: Record<string, number> = {
    issuer: 0.2,
    title: 0.2,
    issue_date: 0.15,
    student_name: 0.2,
    skills: 0.15,
    expiry_date: 0.1,
  };

  for (const [field, weight] of Object.entries(weights)) {
    maxScore += weight;
    if (metadata[field] && (Array.isArray(metadata[field]) ? metadata[field].length > 0 : metadata[field])) {
      score += weight;
    }
  }

  // Boost confidence if metadata appears in OCR text
  const metadataString = JSON.stringify(metadata).toLowerCase();
  const ocrLower = ocrText.toLowerCase();
  const matches = metadataString.split(' ').filter((word) => word.length > 3 && ocrLower.includes(word)).length;
  const boost = Math.min(matches / 20, 0.1); // Max 0.1 boost

  const confidence = Math.min((score / maxScore + boost) * 1.2, 1.0);
  return Math.round(confidence * 100) / 100;
}

/**
 * Check if LLM service is available
 * @returns Promise with service status
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${llmConfig.endpoint}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
