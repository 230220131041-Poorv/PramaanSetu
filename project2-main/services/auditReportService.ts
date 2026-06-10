// ==============================================
// Audit Report Service
// Handles NAAC audit report generation and export
// ==============================================

import { supabase } from '@/lib/supabase';
import { AuditReport, AuditReportInsert, ServiceResult } from '@/types/llm-types';
import { generateAuditReport } from './llmService';

// =============================================
// Audit Report Generation
// =============================================

/**
 * Generate NAAC audit report for a period and department
 * @param requestedBy User ID requesting the report
 * @param department Department name (optional filter)
 * @param periodStart Start date (YYYY-MM-DD)
 * @param periodEnd End date (YYYY-MM-DD)
 * @returns Promise with generated audit report
 */
export async function generateNAACAuditReport(
  requestedBy: string,
  periodStart: string,
  periodEnd: string,
  department?: string
): Promise<ServiceResult<AuditReport>> {
  try {
    // Fetch verified activities for the period
    let query = supabase
      .from('activities')
      .select('*, user_id(*)')
      .eq('status', 'approved')
      .gte('created_at', `${periodStart}T00:00:00Z`)
      .lte('created_at', `${periodEnd}T23:59:59Z`);

    if (department) {
      query = query.eq('user_id.department', department);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) throw activitiesError;

    if (!activities || activities.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_DATA',
          message: `No verified activities found for the period ${periodStart} to ${periodEnd}`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Fetch department breakdown
    const departmentBreakdown = await getDepartmentBreakdown(activities);
    const totalStudents = new Set(activities.map((a: any) => a.user_id?.id)).size;

    // Generate report using LLM
    const reportResult = await generateAuditReport({
      department: department || 'All Departments',
      period_start: periodStart,
      period_end: periodEnd,
      total_students: totalStudents,
      verified_activities: activities,
      departmentBreakdown,
    });

    if (!reportResult.success) {
      return {
        success: false,
        error: reportResult.error,
      };
    }

    // Calculate statistics
    const verificationRate = (activities.length / (totalStudents * 10)) * 100; // Assuming ~10 activities per student on average

    // Save report to database
    const report = await saveAuditReport({
      requested_by: requestedBy,
      report_title: `NAAC Audit Report - ${department || 'All Departments'} (${periodStart} to ${periodEnd})`,
      report_period_start: periodStart,
      report_period_end: periodEnd,
      report_markdown: reportResult.data!,
      total_students: totalStudents,
      total_verified_activities: activities.length,
      verification_rate: Math.round(verificationRate * 100) / 100,
      status: 'generated',
      llm_model: 'gpt-4o-mini',
    });

    if (!report) {
      return {
        success: false,
        error: {
          code: 'REPORT_SAVE_ERROR',
          message: 'Failed to save audit report',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Generate PDF (optional)
    const pdfUrl = await generateReportPDF(report);
    if (pdfUrl) {
      await updateAuditReport(report.id, { pdf_url: pdfUrl });
      report.pdf_url = pdfUrl;
    }

    return {
      success: true,
      data: report,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: `Failed to generate audit report: ${err.message}`,
        details: err.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get audit report by ID
 */
export async function getAuditReport(reportId: string): Promise<AuditReport | null> {
  try {
    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;
    return (data || null) as AuditReport | null;
  } catch (error) {
    console.error('Error fetching audit report:', error);
    return null;
  }
}

/**
 * Get all audit reports (admin only)
 */
export async function listAuditReports(limit: number = 50): Promise<AuditReport[]> {
  try {
    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AuditReport[];
  } catch (error) {
    console.error('Error fetching audit reports:', error);
    return [];
  }
}

/**
 * Export audit report as markdown file
 */
export async function exportAuditReportAsMarkdown(reportId: string): Promise<string | null> {
  try {
    const report = await getAuditReport(reportId);

    if (!report || !report.report_markdown) {
      return null;
    }

    return report.report_markdown;
  } catch (error) {
    console.error('Error exporting report:', error);
    return null;
  }
}

/**
 * Export audit report as JSON
 */
export async function exportAuditReportAsJSON(reportId: string): Promise<string | null> {
  try {
    const report = await getAuditReport(reportId);

    if (!report || !report.report_json) {
      return null;
    }

    return JSON.stringify(report.report_json, null, 2);
  } catch (error) {
    console.error('Error exporting report:', error);
    return null;
  }
}

/**
 * Get audit report statistics and insights
 */
export async function getAuditInsights(reportId: string): Promise<{
  total_students: number;
  total_activities: number;
  verification_rate: number;
  top_categories: Array<{ category: string; count: number }>;
  top_skills: Array<{ skill: string; count: number }>;
  average_verification_time?: number;
} | null> {
  try {
    const report = await getAuditReport(reportId);

    if (!report) {
      return null;
    }

    // Fetch detailed statistics
    const { data: activities } = await supabase
      .from('activities')
      .select('category, skills')
      .gte('created_at', `${report.report_period_start}T00:00:00Z`)
      .lte('created_at', `${report.report_period_end}T23:59:59Z`)
      .eq('status', 'approved');

    const categoryStats = new Map<string, number>();
    const skillStats = new Map<string, number>();

    if (activities) {
      for (const activity of activities) {
        // Count categories
        categoryStats.set(activity.category, (categoryStats.get(activity.category) || 0) + 1);

        // Count skills
        if (activity.skills && Array.isArray(activity.skills)) {
          for (const skill of activity.skills) {
            skillStats.set(skill, (skillStats.get(skill) || 0) + 1);
          }
        }
      }
    }

    return {
      total_students: report.total_students || 0,
      total_activities: report.total_verified_activities || 0,
      verification_rate: report.verification_rate || 0,
      top_categories: Array.from(categoryStats.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      top_skills: Array.from(skillStats.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  } catch (error) {
    console.error('Error fetching audit insights:', error);
    return null;
  }
}

/**
 * Delete audit report (admin only)
 */
export async function deleteAuditReport(reportId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.from('audit_reports').delete().eq('id', reportId);

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
        code: 'DELETE_ERROR',
        message: `Failed to delete audit report: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Get department-wise breakdown of activities
 */
async function getDepartmentBreakdown(activities: any[]): Promise<Record<string, any>> {
  const breakdown: Record<string, any> = {};

  for (const activity of activities) {
    const dept = activity.user_id?.department || 'Unknown';

    if (!breakdown[dept]) {
      breakdown[dept] = {
        total_activities: 0,
        students: new Set(),
        categories: {},
      };
    }

    breakdown[dept].total_activities++;
    breakdown[dept].students.add(activity.user_id?.id);

    const category = activity.category || 'other';
    breakdown[dept].categories[category] = (breakdown[dept].categories[category] || 0) + 1;
  }

  // Convert Sets to counts
  for (const dept of Object.keys(breakdown)) {
    breakdown[dept].total_students = breakdown[dept].students.size;
    delete breakdown[dept].students;
  }

  return breakdown;
}

/**
 * Save audit report to database
 */
async function saveAuditReport(data: AuditReportInsert): Promise<AuditReport | null> {
  try {
    const { data: report, error } = await supabase
      .from('audit_reports')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return (report || null) as AuditReport | null;
  } catch (error) {
    console.error('Error saving audit report:', error);
    return null;
  }
}

/**
 * Update audit report
 */
async function updateAuditReport(reportId: string, updates: Partial<AuditReport>): Promise<AuditReport | null> {
  try {
    const { data, error } = await supabase
      .from('audit_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return (data || null) as AuditReport | null;
  } catch (error) {
    console.error('Error updating audit report:', error);
    return null;
  }
}

/**
 * Generate PDF from markdown report
 * Note: Requires markdown-to-pdf or similar library
 */
async function generateReportPDF(report: AuditReport): Promise<string | null> {
  try {
    // In production, use markdown-pdf or similar library
    // const pdf = await markdownToPdf.convert(report.report_markdown);
    // const url = await uploadPdfToStorage(pdf, report.id);
    // return url;

    console.log('PDF generation not implemented. Requires markdown-pdf library.');
    return null;
  } catch (error) {
    console.error('Error generating report PDF:', error);
    return null;
  }
}

/**
 * Get audit report summary for dashboard
 */
export async function getAuditReportSummary(): Promise<{
  total_reports: number;
  last_report_date: string | null;
  average_verification_rate: number;
  departments_covered: number;
} | null> {
  try {
    const { data: reports } = await supabase
      .from('audit_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10);

    if (!reports || reports.length === 0) {
      return null;
    }

    const avgVerificationRate =
      reports.reduce((sum: number, r: any) => sum + (r.verification_rate || 0), 0) / reports.length;

    return {
      total_reports: reports.length,
      last_report_date: reports[0].generated_at,
      average_verification_rate: Math.round(avgVerificationRate * 100) / 100,
      departments_covered: new Set(reports.map((r: any) => r.report_title)).size,
    };
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return null;
  }
}
