// ==============================================
// Portfolio Service
// Handles portfolio generation, PDF rendering,
// and sharing functionality
// ==============================================

import { supabase } from '@/lib/supabase';
import { Portfolio, PortfolioInsert, ServiceResult } from '@/types/llm-types';
import { generatePortfolioContent } from './llmService';
import { getStudentActivities } from './activityService';

// =============================================
// Portfolio Generation
// =============================================

/**
 * Generate portfolio for a student from verified activities
 * @param studentId Student ID
 * @param visibilityLevel Portfolio visibility setting
 * @returns Promise with generated portfolio
 */
export async function generatePortfolio(
  studentId: string,
  visibilityLevel: 'private' | 'students' | 'recruiters' | 'public' = 'private'
): Promise<ServiceResult<Portfolio>> {
  try {
    // Get verified activities
    const activities = await getVerifiedActivitiesForStudent(studentId);

    if (activities.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_VERIFIED_ACTIVITIES',
          message: 'Student has no verified activities to generate portfolio',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Generate portfolio content using LLM
    const contentResult = await generatePortfolioContent(activities);

    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
      };
    }

    const { bio, achievements, introductory_paragraph } = contentResult.data!;

    // Generate share token and public link
    const shareToken = crypto.randomUUID();
    const publicLink = `${window.location.origin}/portfolio/${shareToken}`;

    // Save portfolio to database
    const portfolio = await savePortfolio({
      student_id: studentId,
      bio,
      achievements,
      introductory_paragraph,
      visibility_level: visibilityLevel,
      generated_by_llm: true,
      llm_model: 'gpt-4o-mini',
    });

    if (!portfolio) {
      return {
        success: false,
        error: {
          code: 'PORTFOLIO_SAVE_ERROR',
          message: 'Failed to save portfolio to database',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Generate PDF
    const pdfUrl = await generatePortfolioPDF(portfolio);
    if (pdfUrl) {
      // Update portfolio with PDF URL
      const updated = await updatePortfolio(portfolio.id, { pdf_url: pdfUrl });
      if (updated) {
        portfolio.pdf_url = pdfUrl;
      }
    }

    return {
      success: true,
      data: portfolio,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'PORTFOLIO_GENERATION_ERROR',
        message: `Failed to generate portfolio: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get portfolio for a student
 * @param studentId Student ID
 * @returns Promise with portfolio or null
 */
export async function getPortfolio(studentId: string): Promise<Portfolio | null> {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;
    return (data || null) as Portfolio | null;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
}

/**
 * Get portfolio by share token (public view)
 * @param shareToken Portfolio share token
 * @returns Promise with portfolio or null
 */
export async function getPublicPortfolio(shareToken: string): Promise<Portfolio | null> {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (error) throw error;

    const portfolio = data as Portfolio;

    // Check visibility
    if (!portfolio.is_public && portfolio.visibility_level === 'private') {
      return null; // Not publicly accessible
    }

    return portfolio;
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    return null;
  }
}

/**
 * Update portfolio visibility
 * @param studentId Student ID
 * @param isPublic Whether portfolio is public
 * @param visibilityLevel Visibility level
 * @returns Promise with updated portfolio
 */
export async function updatePortfolioVisibility(
  studentId: string,
  isPublic: boolean,
  visibilityLevel: 'private' | 'students' | 'recruiters' | 'public'
): Promise<ServiceResult<Portfolio>> {
  try {
    const portfolio = await getPortfolio(studentId);

    if (!portfolio) {
      return {
        success: false,
        error: {
          code: 'PORTFOLIO_NOT_FOUND',
          message: 'Portfolio not found for student',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const updated = await updatePortfolio(portfolio.id, {
      is_public: isPublic,
      visibility_level: visibilityLevel,
    });

    if (!updated) {
      return {
        success: false,
        error: {
          code: 'PORTFOLIO_UPDATE_ERROR',
          message: 'Failed to update portfolio',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'UPDATE_VISIBILITY_ERROR',
        message: `Failed to update visibility: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Regenerate portfolio from updated activities
 * @param studentId Student ID
 * @returns Promise with regenerated portfolio
 */
export async function regeneratePortfolio(studentId: string): Promise<ServiceResult<Portfolio>> {
  try {
    // Get existing portfolio to preserve visibility settings
    const existingPortfolio = await getPortfolio(studentId);

    if (!existingPortfolio) {
      return {
        success: false,
        error: {
          code: 'PORTFOLIO_NOT_FOUND',
          message: 'Portfolio not found for student',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Generate new portfolio
    const result = await generatePortfolio(studentId, existingPortfolio.visibility_level as any);

    if (!result.success) {
      return result;
    }

    // Update last regenerated timestamp
    await updatePortfolio(result.data!.id, {
      last_regenerated_at: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'REGENERATION_ERROR',
        message: `Failed to regenerate portfolio: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Get verified activities for a student
 */
async function getVerifiedActivitiesForStudent(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', studentId)
      .eq('status', 'approved')
      .order('activity_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching verified activities:', error);
    return [];
  }
}

/**
 * Save portfolio to database
 */
async function savePortfolio(data: PortfolioInsert): Promise<Portfolio | null> {
  try {
    const insertData = {
      ...data,
      share_token: crypto.randomUUID(),
      public_link: null,
      is_public: false,
    };

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return (portfolio || null) as Portfolio | null;
  } catch (error) {
    console.error('Error saving portfolio:', error);
    return null;
  }
}

/**
 * Update portfolio in database
 */
async function updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) throw error;
    return (data || null) as Portfolio | null;
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return null;
  }
}

/**
 * Generate PDF from portfolio
 * Uses html2pdf or similar library
 * Note: Requires html2pdf.js dependency
 */
async function generatePortfolioPDF(portfolio: Portfolio): Promise<string | null> {
  try {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Portfolio - ${portfolio.student_id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 3px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #34495e;
              margin-top: 30px;
            }
            .achievement {
              margin-bottom: 20px;
              padding-left: 20px;
              border-left: 3px solid #3498db;
            }
            .achievement-title {
              font-weight: bold;
              color: #2c3e50;
            }
            .achievement-description {
              color: #555;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #ccc;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Professional Portfolio</h1>
          
          <h2>About Me</h2>
          <p>${portfolio.bio || 'Professional profile coming soon.'}</p>
          
          ${portfolio.introductory_paragraph ? `
            <h2>Introduction</h2>
            <p>${portfolio.introductory_paragraph}</p>
          ` : ''}
          
          ${
            portfolio.achievements && portfolio.achievements.length > 0
              ? `
            <h2>Key Achievements & Skills</h2>
            ${portfolio.achievements
              .map(
                (achievement) => `
              <div class="achievement">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${achievement.category ? `<div style="font-size: 12px; color: #999;">Category: ${achievement.category}</div>` : ''}
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>PramanSetu Student Activity Platform</p>
          </div>
        </body>
      </html>
    `;

    // In production, use html2pdf or similar library
    // For now, return a placeholder
    // const { jsPDF } = window.jsPDF;
    // const pdf = new jsPDF();
    // pdf.html(htmlContent);
    // const pdfUrl = pdf.output('datauristring');

    // For now, return null as PDF generation requires additional setup
    console.log('PDF generation not implemented. Requires html2pdf.js library.');
    return null;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

/**
 * Export portfolio as JSON
 */
export async function exportPortfolioAsJSON(studentId: string): Promise<string | null> {
  try {
    const portfolio = await getPortfolio(studentId);

    if (!portfolio) {
      return null;
    }

    return JSON.stringify(portfolio, null, 2);
  } catch (error) {
    console.error('Error exporting portfolio:', error);
    return null;
  }
}

/**
 * Get portfolio statistics
 */
export async function getPortfolioStats(studentId: string): Promise<{
  activities: number;
  skills: number;
  achievements: number;
  lastUpdated: string | null;
} | null> {
  try {
    const portfolio = await getPortfolio(studentId);

    if (!portfolio) {
      return null;
    }

    const activities = await getVerifiedActivitiesForStudent(studentId);
    const skills = new Set(
      activities
        .flatMap((a: any) => a.skills || [])
        .concat(portfolio.achievements?.flatMap((a) => a.category || []) || [])
    );

    return {
      activities: activities.length,
      skills: skills.size,
      achievements: portfolio.achievements?.length || 0,
      lastUpdated: portfolio.last_regenerated_at || portfolio.updated_at,
    };
  } catch (error) {
    console.error('Error getting portfolio stats:', error);
    return null;
  }
}
