# 🎯 PramanSetu Implementation Roadmap

Complete implementation guide based on design specification for Centralized Student Activity Platform with LLM/Vision AI integration.

---

## 📋 Project Overview

**Platform**: PramanSetu - Centralized Student Activity Platform  
**Core AI Integration**: OpenAI ChatGPT + Google Gemmini (Vision/Embeddings/OCR)  
**Main Features**: Activity upload, OCR extraction, AI verification, portfolio generation, semantic search, copilot chat, audit reports

---

## 🔄 Complete Event-Driven Workflows

### 1️⃣ **ON_UPLOAD Event** - Certificate/Activity Processing Pipeline

```
Student uploads certificate/activity document
    ↓
[Step 1] Preprocess Image
  ├─ Normalize (color, rotation, DPI)
  ├─ Deskew & enhance contrast
  ├─ Split multi-page PDFs
  └─ Service: imagePreprocessingService
    ↓
[Step 2] OCR Extraction (Gemmini)
  ├─ API: POST {{GEMMINI_BASE_URL}}/v1/vision/ocr
  ├─ Extract text with confidence
  ├─ Detect document type
  └─ Expected: ocr_text + confidence (0.0-1.0)
    ↓
[Step 3] Metadata Extraction (ChatGPT)
  ├─ API: POST {{OPENAI_BASE_URL}}/v1/chat/completions
  ├─ Temperature: 0.0 (deterministic)
  ├─ Max tokens: 800
  ├─ JSON output: issuer, title, student_name, skills, dates
  └─ Expected: structured_metadata + confidence
    ↓
[Step 4] Embedding Generation (Gemmini)
  ├─ API: POST {{GEMMINI_BASE_URL}}/v1/embeddings/text
  ├─ Text: "{{title}} {{course_name}} {{issuer}}"
  ├─ Model: text-embed-1
  └─ Expected: embedding_vector (768 dimensions)
    ↓
[Step 5] Duplicate Detection
  ├─ Query vector index for similar embeddings
  ├─ Cosine similarity > 0.92 = DUPLICATE
  └─ Flag for review if duplicate found
    ↓
[Step 6] Validation Task Creation (Conditional)
  ├─ IF: extraction_confidence < 0.85 OR duplicate_flag == true
  ├─ Generate faculty review task
  ├─ Create LLM-powered validation summary
  └─ Notify faculty member
    ↓
[Step 7] Store Everything
  ├─ OCR text + metadata + embedding_id
  ├─ File reference + audit trail
  ├─ Timestamp + uploader_id
  └─ Verification status: pending/verified/rejected
```

**Implementation Code Pattern**:
```typescript
// services/certificateService.ts - processCertificateUpload
async function processCertificateUpload(file: File, studentId: string) {
  try {
    // Step 1: Preprocess
    const processed = await preprocessImage(file);
    
    // Step 2: OCR
    const ocrResult = await performOCR(processed);
    if (ocrResult.confidence < 0.75) {
      // Will trigger validation task
    }
    
    // Step 3: Extract metadata
    const metadata = await extractCertificateMetadata(ocrResult.text);
    
    // Step 4: Generate embedding
    const embedding = await generateEmbedding(
      `${metadata.title} ${metadata.courseName} ${metadata.issuer}`
    );
    
    // Step 5: Check duplicates
    const isDuplicate = await findDuplicates(embedding, 0.92);
    
    // Step 6 & 7: Save with validation
    if (metadata.confidence < 0.85 || isDuplicate) {
      await createValidationTask(certificate);
    } else {
      await verifyCertificate(certificate);
    }
    
    return { certificateId, status: 'processed' };
  } catch (error) {
    monitor.trackError('upload_failed', error);
    throw error;
  }
}
```

---

### 2️⃣ **ON_VALIDATE Event** - Faculty Review & Verification

```
Faculty reviews validation task
    ↓
[Step 1] Record Validation Decision
  ├─ Status: approve / request_clarification / reject
  ├─ Store validator_id, timestamp, notes
  └─ Update certificate status in DB
    ↓
[Step 2] Generate Verification Token
  ├─ Create UUID + HMAC signature (tamper-evident)
  ├─ Optional: Anchor to blockchain/institutional ledger
  ├─ Store token in verification_badges table
  └─ For audit trail: token = sha256(uuid + validator_id + timestamp)
    ↓
[Step 3] Notify Student
  ├─ LLM-generated short notification (20-40 words)
  ├─ Template: "Document '{{title}}' has been {{status}} by {{validator_name}}"
  ├─ If request_clarification: include required next steps
  └─ Send via in-app notification + email
```

**Implementation Code Pattern**:
```typescript
// services/certificateService.ts - verifyCertificate
async function verifyCertificate(
  certificateId: string,
  validatorId: string,
  status: 'approved' | 'rejected' | 'request_clarification',
  notes?: string
) {
  // Step 1: Record validation
  await supabase
    .from('certificates')
    .update({
      verification_status: status,
      validator_id: validatorId,
      validated_at: new Date(),
      validation_notes: notes,
    })
    .eq('id', certificateId);

  // Step 2: Generate token
  const badgeToken = crypto.randomUUID();
  const badgeHash = await hashString(badgeToken);
  
  await supabase.from('verification_badges').insert({
    certificate_id: certificateId,
    badge_token: badgeToken,
    badge_hash: badgeHash,
  });

  // Step 3: Notify student
  const cert = await supabase
    .from('certificates')
    .select('*, students(name)')
    .eq('id', certificateId)
    .single();
    
  const notificationText = await generateNotification(
    status,
    cert.metadata.document_title,
    cert.validator_name
  );
  
  await notificationService.sendNotification(
    cert.student_id,
    notificationText
  );
}
```

---

### 3️⃣ **ON_PORTFOLIO_GENERATE Event** - Auto-Generated Portfolios

```
Student requests "Generate Portfolio" or system auto-triggers
    ↓
[Step 1] Gather Verified Activities
  ├─ Query: SELECT * FROM certificates WHERE student_id=? AND status='verified'
  ├─ Include: course_name, skills, dates, issuer
  └─ Format: [{id, title, skills, date}, ...]
    ↓
[Step 2] LLM Generate Bio & Resume Bullets
  ├─ Prompt: "Given verified activities: {{activities}}, produce:"
  ├─ JSON output:
  │   {
  │     "bio_50_words": "Professional summary...",
  │     "resume_bullets": [
  │       {
  │         "bullet": "Led ML project achieving 95% accuracy",
  │         "skill_tags": ["ML", "Python"],
  │         "keywords": ["TensorFlow", "scikit-learn"]
  │       }
  │     ],
  │     "portfolio_intro": "Full intro paragraph...",
  │     "skill_tags": ["Python", "ML", "Statistics"]
  │   }
  ├─ Temperature: 0.2 (consistent)
  ├─ Max tokens: 1000
    ↓
[Step 3] Render PDF & Generate Shareable Link
  ├─ Merge with portfolio HTML template
  ├─ Embed verification badges
  ├─ Generate PDF via html2pdf or similar
  ├─ Create short shareable link (e.g., /portfolio/{{uuid}})
  ├─ Store portfolio record with share_token
    ↓
[Step 4] Response to Student
  ├─ Display portfolio preview
  ├─ Provide download link
  ├─ Provide share link with access controls
```

**Implementation Code Pattern**:
```typescript
// services/portfolioService.ts - generatePortfolio
async function generatePortfolio(studentId: string) {
  // Step 1: Get verified activities
  const activities = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .eq('verification_status', 'verified');

  // Step 2: LLM generate content
  const portfolioContent = await llmService.generatePortfolioContent({
    activities: activities.data,
    temperature: 0.2,
    maxTokens: 1000,
  });

  // Step 3: Render & store
  const portfolioPDF = await renderPortfolioPDF(portfolioContent);
  const shareToken = crypto.randomUUID();
  
  const portfolio = await supabase
    .from('portfolios')
    .insert({
      student_id: studentId,
      bio: portfolioContent.bio_50_words,
      resume_bullets: portfolioContent.resume_bullets,
      intro: portfolioContent.portfolio_intro,
      share_token: shareToken,
      pdf_url: await uploadToStorage(portfolioPDF),
      generated_at: new Date(),
    });

  return {
    portfolioId: portfolio.id,
    shareLink: `/portfolio/${shareToken}`,
    pdfUrl: portfolio.pdf_url,
  };
}
```

---

### 4️⃣ **ON_SEARCH_QUERY Event** - Semantic Search & Recruitment

```
Recruiter/Admin submits natural language search query
    ↓
[Step 1] Parse Query to Structured Filters
  ├─ LLM converts: "Python developers with ML and IoT"
  ├─ To JSON: {
  │     "filters": {
  │       "skills": ["Python", "ML", "IoT"],
  │       "department": null,
  │       "verified_only": true
  │     },
  │     "search_text": "Python machine learning IoT"
  │   }
  ├─ Temperature: 0.0 (deterministic)
    ↓
[Step 2] Semantic Search (Gemmini)
  ├─ Generate embedding for search_text
  ├─ API: POST {{GEMMINI_BASE_URL}}/v1/search/knn
  ├─ Query vector index with top_k=50
  ├─ Get: [student_id, score, activity_data]
    ↓
[Step 3] LLM Rerank & Summarize
  ├─ Send top 50 results to ChatGPT
  ├─ Ask to rerank by relevance + produce 2-line summaries
  ├─ Output: [{student_id, score, summary, top_skills}]
    ↓
[Step 4] Return Ranked Results
  ├─ Top 10-20 with:
  │   - Student name (if recruiter role)
  │   - 2-line professional summary
  │   - Top 5 matching skills
  │   - Portfolio link (if available)
  │   - Verification status
```

**Implementation Code Pattern**:
```typescript
// services/chatSearchService.ts - semanticStudentSearch
async function semanticStudentSearch(query: string) {
  // Step 1: Parse query
  const parsed = await llmService.parseSearchQuery(query);
  
  // Step 2: Semantic search
  const embedding = await visionService.generateEmbedding(
    parsed.search_text
  );
  
  const results = await semanticSearch(embedding, 50);
  
  // Step 3: Rerank with LLM
  const reranked = await llmService.rerankAndSummarize(results);
  
  // Step 4: Return formatted
  return reranked.slice(0, 20).map(r => ({
    studentId: r.student_id,
    summary: r.summary,
    topSkills: r.top_skills,
    portfolioLink: `/portfolio/${r.share_token}`,
    verificationStatus: r.status,
  }));
}
```

---

### 5️⃣ **ON_CHAT_MESSAGE Event** - Copilot Chat

```
User interacts with in-app copilot chat
    ↓
[Step 1] Collect Context
  ├─ Recent activity records (last 5)
  ├─ User profile snippet (name, role, department)
  ├─ Last 6 chat messages (conversation history)
  ├─ Optional: Document being viewed/edited
    ↓
[Step 2] LLM Stream Response
  ├─ System prompt: Role-tailored (student/faculty/recruiter)
  ├─ User prompt: "{{user_message}}"
  ├─ Temperature: 0.5 (balanced creativity)
  ├─ Stream: true (real-time response)
  ├─ Include sources: [activity_ids] for claims
    ↓
[Step 3] Safety & Moderation
  ├─ Check response for policy violations
  ├─ Redact PII if needed (emails, phone numbers)
  ├─ Flag sensitive content for manual review
    ↓
[Step 4] Store Conversation
  ├─ Save message + response to chat_messages table
  ├─ Include: user_id, role, timestamp, operation_ids referenced
  ├─ For audit: store hashed payload identifiers
```

**Implementation Code Pattern**:
```typescript
// services/chatSearchService.ts - sendChatMessage
async function sendChatMessage(
  userId: string,
  message: string,
  onChunk?: (chunk: string) => void
) {
  // Step 1: Context
  const context = await getConversationContext(userId);
  
  // Step 2: Stream response
  const response = await llmService.streamCopilotResponse({
    systemPrompt: getCopilotSystemPrompt(context.userRole),
    userMessage: message,
    context: context,
    temperature: 0.5,
  }, onChunk);
  
  // Step 3: Moderation
  const moderated = await moderateResponse(response);
  
  // Step 4: Store
  await supabase.from('chat_messages').insert([
    { role: 'user', content: message, user_id: userId },
    { role: 'assistant', content: moderated, user_id: userId },
  ]);
  
  return moderated;
}
```

---

### 6️⃣ **ON_AUDIT_REQUEST Event** - Report Generation

```
Admin requests audit report (NAAC/NIRF format)
    ↓
[Step 1] Collect Data
  ├─ Fetch verified records for timeframe
  ├─ Group by: MOOCs, internships, publications, activities
  ├─ Count by department, year, category
  ├─ Identify missing certifications
    ↓
[Step 2] LLM Assemble Report
  ├─ Prompt: "Write NAAC-ready report from dataset: {{data}}"
  ├─ JSON output:
  │   {
  │     "report_markdown": "# Executive Summary\n...",
  │     "summary": "Top-line findings",
  │     "missing_items": ["Item 1", "Item 2"],
  │     "statistics_csv": "Category,Count\n..."
  │   }
  ├─ Temperature: 0.1 (minimal variation)
  ├─ Max tokens: 2000
    ↓
[Step 3] Render Outputs
  ├─ PDF from markdown
  ├─ Optional: PowerPoint slides
  ├─ Store in audit_reports table
    ↓
[Step 4] Return to Admin
  ├─ Download links
  ├─ Embed in dashboard
  ├─ Archive for compliance
```

**Implementation Code Pattern**:
```typescript
// services/auditReportService.ts - generateNAACAuditReport
async function generateNAACAuditReport(
  startDate: string,
  endDate: string,
  department?: string
) {
  // Step 1: Collect data
  const data = await supabase
    .from('certificates')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('verification_status', 'verified')
    .then(result =>
      department ? result.data.filter(r => r.department === department) : result.data
    );

  // Step 2: LLM assemble
  const reportContent = await llmService.generateAuditReport(data);
  
  // Step 3: Render
  const reportPDF = await renderMarkdownToPDF(reportContent.report_markdown);
  
  // Step 4: Store & return
  const audit = await supabase.from('audit_reports').insert({
    start_date: startDate,
    end_date: endDate,
    department: department,
    report_markdown: reportContent.report_markdown,
    report_json: reportContent,
    pdf_url: await uploadToStorage(reportPDF),
    generated_at: new Date(),
  });
  
  return {
    auditId: audit.id,
    pdfUrl: audit.pdf_url,
    summary: reportContent.summary,
  };
}
```

---

## 📚 LLM Prompts Library (Complete)

### 1. Metadata Extraction Prompt
```
SYSTEM:
You are a JSON extraction assistant for academic documents and certificates.
Output ONLY valid JSON, no extra text or explanations.

USER:
Parse the OCR text below into JSON with these fields:
- issuer: Organization that issued the document
- document_title: Title of the document (e.g., "Certificate of Completion")
- student_name: Full name of the student/recipient
- roll_number_or_id: Student roll number or ID (if present, else null)
- course_name: Name of the course or program
- issue_date: Date issued in YYYY-MM-DD format (if present, else null)
- expiry_date: Date of expiry in YYYY-MM-DD format (nullable)
- skills: Array of skills learned or demonstrated
- brief_description: One-line summary of the achievement
- confidence_estimate: Your confidence in the extraction (0.0-1.0)

OCR_TEXT:
{{ocr_text}}

RESPONSE: JSON only
```

**Parameters**: `temperature: 0.0`, `max_tokens: 800`

---

### 2. Validation Summary Prompt
```
SYSTEM:
You are an assistant that writes short, actionable validation summaries for faculty reviewers.
Be concise and specific. Output only JSON.

USER:
Create a validation summary for this document upload with:
- Key metadata fields: {{metadata_json}}
- OCR excerpt (first 300 chars): {{ocr_excerpt}}
- Confidence scores: OCR={{ocr_confidence}}, Extraction={{extraction_confidence}}

Produce JSON with:
- summary: 2-3 sentence overview
- suggested_status: one of "approve", "request_clarification", "reject"
- suggested_checks: array of specific things to verify (e.g., "Check expiry date against policy")
- risk_level: "high", "medium", or "low"

RESPONSE: JSON only
```

**Parameters**: `temperature: 0.2`, `max_tokens: 250`

---

### 3. Portfolio Generation Prompt
```
SYSTEM:
You are a professional resume writer and portfolio generator.
Output only JSON. Be specific and use action verbs.

USER:
Given the student's verified activities below, produce a professional portfolio:
{{activities_json}}

Generate JSON with:
- bio_50_words: Professional summary (exactly 50 words)
- resume_bullets: Array of 6-8 achievement bullets with:
  * bullet: Action-oriented statement (e.g., "Led ML project...")
  * skill_tags: Array of 1-3 relevant skills
  * keywords: Array of 2-3 technical keywords (for ATS)
- portfolio_intro: Full paragraph introducing the student (100-150 words)
- skill_tags: Array of top 5-7 skills across all activities

RESPONSE: JSON only
```

**Parameters**: `temperature: 0.2`, `max_tokens: 1200`

---

### 4. Query Parser Prompt
```
SYSTEM:
You are a query parser. Convert natural language searches into structured JSON.
Be precise. Output only JSON.

USER:
Convert this recruiter/admin search query into structured filters and search text:
"{{user_query}}"

Produce JSON with:
- filters: {
    "skills": [array of extracted skills],
    "department": "name or null",
    "year_range": [start_year, end_year] or null,
    "verified_only": boolean,
    "min_gpa": number or null
  }
- search_text: A concise text string optimized for semantic embedding (30-50 words)

RESPONSE: JSON only
```

**Parameters**: `temperature: 0.0`, `max_tokens: 300`

---

### 5. Audit Report Prompt
```
SYSTEM:
You are an institutional audit report writer. Output only JSON.
Focus on compliance, missing items, and statistics suitable for NAAC/NIRF.

USER:
Assemble a NAAC-ready audit report from this dataset:
{{dataset_json}}

Produce JSON with:
- report_markdown: Full markdown report with:
  * Executive Summary (100-150 words)
  * Activity Breakdown (by category: MOOCs, internships, publications, etc.)
  * Department-wise statistics
  * Missing certifications or gaps
  * Recommendations for improvement
- summary: One-paragraph key findings
- missing_items: Array of missing or incomplete documentation
- statistics_table: CSV-ready string (Category,Count,Status)

RESPONSE: JSON only
```

**Parameters**: `temperature: 0.1`, `max_tokens: 2500`

---

### 6. Copilot Chat System Prompt (Role-Tailored)
```
STUDENT VERSION:
You are PramanSetu Copilot, a helpful assistant for students. 
- Help them understand activity verification process
- Suggest ways to improve portfolio
- Answer questions about their achievements
- Be encouraging and supportive
- Always cite specific activities when making claims (use activity IDs)

FACULTY VERSION:
You are PramanSetu Copilot for faculty. 
- Help review and validate student documents
- Provide context on verification policies
- Draft feedback and notifications
- Suggest improvements to validation procedures
- Reference specific records when advising

RECRUITER VERSION:
You are PramanSetu Copilot for recruiters. 
- Help search for candidates with specific skills
- Summarize candidate achievements
- Suggest interview questions
- Highlight top candidates
- Always maintain candidate privacy

Base behavior for all:
- Be concise (1-3 sentences)
- If asked to generate action (email, feedback), output JSON: {"action":"type", "payload": {...}}
- Cite sources: [activity_id: "...", document_id: "..."]
- Flag sensitive info for manual review
```

**Parameters**: `temperature: 0.5`, `max_tokens: 500` (streaming)

---

## 🔧 API Integration Examples

### Gemmini OCR Call
```typescript
async function callGemminiOCR(fileUrl: string): Promise<{
  ocr_text: string;
  ocr_confidence: number;
  pages: number;
}> {
  const response = await axios.post(
    `${process.env.GEMMINI_BASE_URL}/v1/vision/ocr`,
    {
      file_url: fileUrl,
      pages: [0, 1], // First 2 pages
      language: 'en',
    },
    {
      headers: {
        'Authorization': `ApiKey ${process.env.GEMMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return {
    ocr_text: response.data.text,
    ocr_confidence: response.data.confidence,
    pages: response.data.page_count,
  };
}
```

### OpenAI ChatGPT Call
```typescript
async function callOpenAIMetadataExtraction(
  ocrText: string
): Promise<{
  metadata: any;
  extraction_confidence: number;
}> {
  const response = await axios.post(
    `${process.env.OPENAI_BASE_URL}/v1/chat/completions`,
    {
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON extraction assistant. Output only JSON.',
        },
        {
          role: 'user',
          content: `Parse OCR text into JSON:\n\n${ocrText}`,
        },
      ],
      temperature: 0.0,
      max_tokens: 800,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const content = response.data.choices[0].message.content;
  const metadata = JSON.parse(content);
  
  return {
    metadata,
    extraction_confidence: metadata.confidence_estimate,
  };
}
```

### Gemmini Text Embedding Call
```typescript
async function callGemminiEmbedding(
  text: string
): Promise<{
  embedding_vector: number[];
  embedding_id: string;
}> {
  const response = await axios.post(
    `${process.env.GEMMINI_BASE_URL}/v1/embeddings/text`,
    {
      text: text,
      model: 'text-embed-1',
    },
    {
      headers: {
        'Authorization': `ApiKey ${process.env.GEMMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return {
    embedding_vector: response.data.embedding,
    embedding_id: response.data.embedding_id,
  };
}
```

### Vector Semantic Search Call
```typescript
async function semanticSearchVectorIndex(
  embedding: number[],
  topK: number = 50
): Promise<Array<{ student_id: string; score: number }>> {
  const response = await axios.post(
    `${process.env.GEMMINI_BASE_URL}/v1/search/knn`,
    {
      vector: embedding,
      top_k: topK,
    },
    {
      headers: {
        'Authorization': `ApiKey ${process.env.GEMMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data.results.map((r: any) => ({
    student_id: r.id,
    score: r.similarity_score,
  }));
}
```

---

## 🛡️ Error Handling & Observability

### LLM Error Handling (ChatGPT)
```typescript
async function callLLMWithRetry(
  prompt: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${process.env.OPENAI_BASE_URL}/v1/chat/completions`,
        prompt,
        {
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      
      monitor.trackUsage('llm_call', {
        model: prompt.model,
        tokens: response.data.usage.total_tokens,
        duration: Date.now() - startTime,
      });
      
      return response.data;
    } catch (error) {
      lastError = error;
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      
      monitor.trackError('llm_retry', error, {
        attempt: attempt + 1,
        delay,
      });
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Fallback: return minimal response and queue for retry
  monitor.trackError('llm_failed_all_retries', lastError);
  return {
    error: true,
    message: 'LLM service unavailable, queued for background retry',
  };
}
```

### Vision/Gemmini Error Handling
```typescript
async function callGemminiWithRetry(
  endpoint: string,
  payload: any,
  maxRetries: number = 2
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${process.env.GEMMINI_BASE_URL}${endpoint}`,
        payload,
        {
          timeout: 30000,
          headers: {
            'Authorization': `ApiKey ${process.env.GEMMINI_API_KEY}`,
          },
        }
      );
      
      monitor.trackUsage('gemmini_call', {
        endpoint,
        duration: Date.now() - startTime,
      });
      
      return response.data;
    } catch (error) {
      monitor.trackError('gemmini_call_failed', error, {
        endpoint,
        attempt: attempt + 1,
      });
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 + Math.random() * 2000) // Jitter
        );
      }
    }
  }
  
  // Fallback: mark task as degraded
  throw new Error(`Gemmini service failed after ${maxRetries} retries`);
}
```

### Monitoring & Metrics
```typescript
// Track key metrics
interface APIMetrics {
  llm_calls_count: number;
  gemmini_calls_count: number;
  avg_latency_ms: number;
  error_rate: number;
  cost_estimate_daily: number;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  error_rate: 0.05, // 5%
  latency_ms: 3000, // 3 seconds
  daily_cost: 500, // $500
};

// Implementation
monitor.on('metric_updated', (metric: APIMetrics) => {
  if (metric.error_rate > ALERT_THRESHOLDS.error_rate) {
    sendAlert('High error rate detected', 'warning');
  }
  
  if (metric.cost_estimate_daily > ALERT_THRESHOLDS.daily_cost) {
    sendAlert('Daily cost exceeding budget', 'warning');
  }
  
  // Store audit logs
  auditLog.create({
    timestamp: new Date(),
    operation: 'metric_collection',
    metrics: metric,
    user_id: null, // System operation
  });
});
```

---

## 🚀 Deployment Architecture

### Recommended Components
```
┌─────────────────────────────────────────────┐
│         API Gateway (Express/FastAPI)       │
│  - Auth, rate limiting, request routing     │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
   ┌────────┐ ┌────────┐ ┌──────────┐
   │  LLM   │ │Vision  │ │Database  │
   │Worker  │ │Worker  │ │(Postgres)│
   │(ChatGPT)│(Gemmini)│ └──────────┘
   └────────┘ └────────┘      ↓
       ↑           ↑      ┌──────────┐
       └───────────┼──────→│Vector DB │
               Queue     │(Pinecone/│
           (BullMQ/      │  Vespa)  │
            RabbitMQ)    └──────────┘
                              ↓
                        ┌─────────────┐
                        │CDN (Assets) │
                        │ + Storage   │
                        └─────────────┘
```

### Async Worker Pattern
```typescript
// Add job to queue
const certificateJob = await certificateQueue.add(
  'process_upload',
  {
    file_url: uploadedFile.url,
    student_id: studentId,
    uploader_id: uploaderId,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    priority: 5,
  }
);

// Worker processes in background
certificateQueue.process('process_upload', async (job) => {
  try {
    await processCertificateUpload(job.data);
    job.progress(100);
  } catch (error) {
    job.attempts--;
    if (job.attempts > 0) {
      throw error; // Retry
    } else {
      await handleFailedCertificate(job.data);
    }
  }
});

// Listen to completion
certificateJob.on('completed', () => {
  notificationService.sendToStudent(
    studentId,
    'Certificate processed successfully'
  );
});
```

---

## 📊 Scaling & Cost Control

### Caching Strategy
```typescript
// Cache embeddings to avoid recomputation
const embeddingCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

async function getOrGenerateEmbedding(
  text: string,
  cacheKey?: string
): Promise<number[]> {
  const key = cacheKey || hashString(text);
  
  // Check cache first
  const cached = embeddingCache.get(key);
  if (cached) {
    monitor.trackUsage('embedding_cache_hit', {});
    return cached;
  }
  
  // Generate and cache
  const embedding = await callGemminiEmbedding(text);
  embeddingCache.set(key, embedding.embedding_vector);
  
  return embedding.embedding_vector;
}
```

### Batch Processing
```typescript
// Batch OCR for bulk uploads
async function processFilesInBatch(files: File[], batchSize: number = 10) {
  const batches = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(file => performOCR(file))
    );
    batches.push(results);
  }
  
  return batches.flat();
}
```

### Quota Management Per Tenant
```typescript
// Track and limit usage per institution
async function checkQuota(
  institutionId: string,
  operation: 'ocr' | 'llm' | 'embedding'
): Promise<boolean> {
  const usage = await getUsageForInstitution(institutionId);
  const quota = await getQuotaForInstitution(institutionId);
  
  const currentUsage = usage[operation] || 0;
  const limit = quota[operation] || 0;
  
  if (currentUsage >= limit) {
    monitor.trackError('quota_exceeded', new Error(
      `${operation} quota exceeded for ${institutionId}`
    ));
    return false;
  }
  
  return true;
}
```

---

## ✅ Implementation Milestones

### Milestone 1: Core Upload & OCR (Week 1-2)
- [ ] File upload UI + preprocessing service
- [ ] Gemmini OCR integration
- [ ] Store OCR output in database
- [ ] Basic validation task creation

### Milestone 2: LLM & Embeddings (Week 2-3)
- [ ] ChatGPT metadata extraction service
- [ ] Gemmini embedding generation
- [ ] Vector index setup (Pinecone/Vespa)
- [ ] Duplicate detection

### Milestone 3: Faculty Review & Portfolios (Week 3-4)
- [ ] Faculty validation UI
- [ ] Verification token generation
- [ ] Portfolio auto-generation
- [ ] Share link & PDF export

### Milestone 4: Search, Chat & Audit (Week 4-5)
- [ ] Semantic search API
- [ ] Copilot chat integration
- [ ] Audit report generator
- [ ] Monitoring & cost tracking

---

## 🎯 Success Metrics

✅ **Functionality**:
- OCR confidence > 85%
- Metadata extraction accuracy > 90%
- Duplicate detection precision > 95%
- Search relevance > 80%

✅ **Performance**:
- Upload → OCR → Metadata: < 5 seconds
- Search results: < 1 second
- Copilot response: < 2 seconds (streaming)
- Portfolio generation: < 10 seconds

✅ **Cost**:
- OCR per document: < $0.01
- LLM call per certificate: < $0.005
- Embedding per document: < $0.001
- Total per certificate: < $0.02

✅ **Reliability**:
- Service uptime > 99.5%
- Error rate < 5%
- Successful retry rate > 95%
- No data loss

---

## 🔐 Privacy & Compliance

✅ **Data Handling**:
- Mask direct identifiers when sending to external APIs
- Use hashed student IDs for external calls
- Store raw data in secure, encrypted database
- Implement data retention policies

✅ **Audit Trail**:
- Log all API calls (timestamp, user, operation, result)
- Store LLM-generated reasons for decisions
- Track validation decisions with validator name
- Maintain version history of documents

✅ **Consent**:
- Show consent screen before OCR processing
- Explain what data is sent to external services
- Allow opt-out of AI features
- Provide data deletion options

---

## 📝 Next Steps

1. **Setup Development Environment**
   - Clone repo and install dependencies
   - Configure `.env` with API keys
   - Run provisioning script

2. **Create POC for Milestone 1**
   - Implement file upload UI
   - Test Gemmini OCR integration
   - Store results in database

3. **Add Monitoring**
   - Instrument metrics tracking
   - Set up cost tracking
   - Create monitoring dashboard

4. **Iterate & Refine**
   - Test with real documents
   - Adjust confidence thresholds
   - Optimize prompts based on results

---

**Status**: Ready for Implementation  
**Last Updated**: December 2024  
**Version**: 1.0

This roadmap provides a complete guide to implementing PramanSetu with AI/LLM integration following your detailed specification. Follow the milestones sequentially and use the code patterns as templates for your actual implementation.
