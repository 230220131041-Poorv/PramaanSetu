// ==============================================
// Chat Service
// Handles copilot chat, message storage, and context
// ==============================================

import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatMessageInsert, ChatRole, ServiceResult } from '@/types/llm-types';
import { streamCopilotResponse } from './llmService';

// =============================================
// Chat Message Management
// =============================================

/**
 * Send a chat message and get copilot response
 * @param userId User ID
 * @param message User message
 * @param context Context (activities, documents)
 * @param onChunk Streaming callback
 * @returns Promise with full response and saved message
 */
export async function sendChatMessage(
  userId: string,
  message: string,
  context?: {
    studentId?: string;
    activityIds?: string[];
    documentIds?: string[];
    role?: string;
  },
  onChunk?: (chunk: string) => void
): Promise<ServiceResult<ChatMessage>> {
  try {
    // Save user message
    const userMessage = await saveChatMessage({
      user_id: userId,
      role: 'user',
      content: message,
      referenced_activities: context?.activityIds,
      referenced_documents: context?.documentIds,
    });

    if (!userMessage) {
      return {
        success: false,
        error: {
          code: 'MESSAGE_SAVE_ERROR',
          message: 'Failed to save user message',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Get copilot response
    const responseResult = await streamCopilotResponse(message, context, onChunk);

    if (!responseResult.success) {
      return {
        success: false,
        error: responseResult.error,
      };
    }

    // Save assistant message
    const assistantMessage = await saveChatMessage({
      user_id: userId,
      role: 'assistant',
      content: responseResult.data!,
      referenced_activities: context?.activityIds,
      referenced_documents: context?.documentIds,
      llm_model: 'gpt-4o-mini',
    });

    if (!assistantMessage) {
      return {
        success: false,
        error: {
          code: 'RESPONSE_SAVE_ERROR',
          message: 'Failed to save assistant response',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: assistantMessage,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: `Failed to process chat message: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get chat history for a user
 * @param userId User ID
 * @param limit Number of messages to retrieve
 * @returns Promise with chat messages
 */
export async function getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Reverse to get chronological order
    return ((data || []) as ChatMessage[]).reverse();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

/**
 * Clear chat history for a user
 * @param userId User ID
 * @returns Promise with result
 */
export async function clearChatHistory(userId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'CLEAR_HISTORY_ERROR',
        message: `Failed to clear chat history: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Delete a specific chat message
 * @param messageId Message ID
 * @param userId User ID (for security)
 * @returns Promise with result
 */
export async function deleteChatMessage(messageId: string, userId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'DELETE_MESSAGE_ERROR',
        message: `Failed to delete message: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Save chat message to database
 */
async function saveChatMessage(data: ChatMessageInsert): Promise<ChatMessage | null> {
  try {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        ...data,
        is_complete: data.role === 'user' ? true : false,
      })
      .select()
      .single();

    if (error) throw error;
    return (message || null) as ChatMessage | null;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
}

// ==============================================
// Semantic Search Service
// ==============================================

import { generateEmbedding, semanticSearch } from './visionService';
import { parseSearchQuery } from './llmService';

/**
 * Search for students based on natural language query
 * Used by recruiters to find candidates
 * @param query Natural language search query
 * @param topK Number of results to return
 * @returns Promise with search results
 */
export async function semanticStudentSearch(
  query: string,
  topK: number = 10
): Promise<
  ServiceResult<
    Array<{
      student_id: string;
      name: string;
      email: string;
      score: number;
      summary: string;
      portfolio_link?: string;
    }>
  >
> {
  try {
    // Parse natural language query
    const parseResult = await parseSearchQuery(query);

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
      };
    }

    const { search_vector_text, filters } = parseResult.data!;

    // Generate embedding for search
    const embeddingResult = await generateEmbedding({ text: search_vector_text });

    if (!embeddingResult.success) {
      return {
        success: false,
        error: embeddingResult.error,
      };
    }

    // Perform semantic search
    const searchResult = await semanticSearch(embeddingResult.data!.embedding_vector, topK);

    if (!searchResult.success) {
      return {
        success: false,
        error: searchResult.error,
      };
    }

    // Fetch student details and enrich results
    const enrichedResults = await enrichSearchResults(searchResult.data || [], filters);

    return {
      success: true,
      data: enrichedResults,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'SEMANTIC_SEARCH_ERROR',
        message: `Failed to perform search: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Search certificates by skills or metadata
 * @param query Search query
 * @param topK Number of results to return
 * @returns Promise with matching certificates
 */
export async function searchCertificates(
  query: string,
  topK: number = 10
): Promise<
  ServiceResult<
    Array<{
      certificate_id: string;
      student_id: string;
      title: string;
      issuer: string;
      score: number;
    }>
  >
> {
  try {
    // Generate embedding for search
    const embeddingResult = await generateEmbedding({ text: query });

    if (!embeddingResult.success) {
      return {
        success: false,
        error: embeddingResult.error,
      };
    }

    // Perform semantic search in certificate embeddings
    const { data, error } = await supabase.rpc('search_certificates', {
      query_embedding: embeddingResult.data!.embedding_vector,
      match_count: topK,
      match_threshold: 0.5,
    });

    if (error) throw error;

    return {
      success: true,
      data: (data || []).map((item: any) => ({
        certificate_id: item.id,
        student_id: item.student_id,
        title: item.metadata?.title || 'Unknown',
        issuer: item.metadata?.issuer || 'Unknown',
        score: item.similarity,
      })),
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'CERTIFICATE_SEARCH_ERROR',
        message: `Failed to search certificates: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Search activities by description or category
 * @param query Search query
 * @param filters Additional filters (category, date range, etc.)
 * @param topK Number of results
 * @returns Promise with matching activities
 */
export async function searchActivities(
  query: string,
  filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  },
  topK: number = 20
): Promise<
  ServiceResult<
    Array<{
      activity_id: string;
      student_id: string;
      title: string;
      description: string;
      score: number;
    }>
  >
> {
  try {
    // Build query with filters
    let dbQuery = supabase.from('activities').select('*');

    // Full-text search on title and description
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply filters
    if (filters?.category) {
      dbQuery = dbQuery.eq('category', filters.category);
    }

    if (filters?.status) {
      dbQuery = dbQuery.eq('status', filters.status);
    }

    if (filters?.startDate) {
      dbQuery = dbQuery.gte('activity_date', filters.startDate);
    }

    if (filters?.endDate) {
      dbQuery = dbQuery.lte('activity_date', filters.endDate);
    }

    const { data, error } = await dbQuery.limit(topK);

    if (error) throw error;

    return {
      success: true,
      data: (data || []).map((activity: any) => ({
        activity_id: activity.id,
        student_id: activity.user_id,
        title: activity.title,
        description: activity.description,
        score: 1.0, // Full-text search doesn't return scores
      })),
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'ACTIVITY_SEARCH_ERROR',
        message: `Failed to search activities: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Enrich search results with student details and portfolio links
 */
async function enrichSearchResults(
  results: Array<{ id: string; score: number; metadata?: any }>,
  filters?: Record<string, any>
): Promise<
  Array<{
    student_id: string;
    name: string;
    email: string;
    score: number;
    summary: string;
    portfolio_link?: string;
  }>
> {
  try {
    const enrichedResults = [];

    for (const result of results) {
      // Fetch student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', result.id)
        .single();

      if (profile) {
        // Fetch student portfolio
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('share_token')
          .eq('student_id', result.id)
          .single();

        enrichedResults.push({
          student_id: result.id,
          name: profile.full_name,
          email: profile.email,
          score: result.score,
          summary: result.metadata?.summary || 'Student profile available',
          portfolio_link: portfolio ? `/portfolio/${portfolio.share_token}` : undefined,
        });
      }
    }

    return enrichedResults;
  } catch (error) {
    console.error('Error enriching search results:', error);
    return [];
  }
}
