import { supabase } from '@/lib/supabase';
import { PortfolioData, Activity, Skill, Achievement, Profile, ActivityCategory } from '@/types/database';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/**
 * Fetch complete portfolio data for a student
 */
export async function fetchPortfolioData(studentId: string): Promise<PortfolioData | null> {
  try {
    // Use the database function for efficient data fetch
    const { data, error } = await supabase.rpc('get_portfolio_data', {
      student_id: studentId,
    } as any);

    if (error) {
      console.error('FetchPortfolioData error:', error);
      return null;
    }

    const portfolioData = data as any;
    
    // Build category breakdown
    const activities = portfolioData?.activities || [];
    const categoryBreakdown: Record<ActivityCategory, number> = {
      workshop: 0,
      competition: 0,
      certification: 0,
      seminar: 0,
      sports: 0,
      cultural: 0,
      social_service: 0,
      internship: 0,
      other: 0,
    };

    activities.forEach((activity: Activity) => {
      if (activity.category in categoryBreakdown) {
        categoryBreakdown[activity.category]++;
      }
    });

    return {
      profile: portfolioData?.profile,
      activities: activities,
      skills: portfolioData?.skills || [],
      achievements: portfolioData?.achievements || [],
      stats: {
        total_activities: portfolioData?.stats?.total_activities || 0,
        total_points: portfolioData?.stats?.total_points || 0,
        certificates_count: portfolioData?.stats?.certificates_count || 0,
        approved_activities: activities.length,
        category_breakdown: categoryBreakdown,
      },
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FetchPortfolioData error:', error);
    return null;
  }
}

/**
 * Format category name for display
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate HTML content for PDF
 */
function generatePDFHTML(data: PortfolioData): string {
  const { profile, activities, skills, achievements, stats } = data;

  // Activities table rows
  const activitiesRows = activities
    .map(
      (activity, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${activity.title}</td>
        <td>${formatCategory(activity.category)}</td>
        <td>${formatDate(activity.activity_date)}</td>
        <td>${activity.points}</td>
      </tr>
    `
    )
    .join('');

  // Skills list
  const skillsList = skills
    .map(
      (skill) => `
      <div class="skill-item">
        <span class="skill-name">${skill.name}</span>
        <div class="skill-bar">
          <div class="skill-progress" style="width: ${skill.proficiency}%"></div>
        </div>
        <span class="skill-percent">${skill.proficiency}%</span>
      </div>
    `
    )
    .join('');

  // Achievements list
  const achievementsList = achievements
    .map(
      (achievement) => `
      <div class="achievement-item">
        <strong>${achievement.title}</strong>
        ${achievement.description ? `<p>${achievement.description}</p>` : ''}
        <small>${formatDate(achievement.date_earned)}</small>
      </div>
    `
    )
    .join('');

  // Category breakdown
  const categoryBreakdownHTML = Object.entries(stats.category_breakdown)
    .filter(([_, count]) => count > 0)
    .map(
      ([category, count]) => `
      <div class="category-item">
        <span>${formatCategory(category)}</span>
        <span>${count}</span>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Student Portfolio - ${profile.full_name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          padding-bottom: 30px;
          border-bottom: 3px solid #2563EB;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563EB;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .profile-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .profile-info h2 {
          font-size: 24px;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .profile-info p {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: linear-gradient(135deg, #2563EB 0%, #4338CA 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card .value {
          font-size: 32px;
          font-weight: bold;
        }
        .stat-card .label {
          font-size: 12px;
          opacity: 0.9;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h3 {
          font-size: 18px;
          color: #2563EB;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
        }
        tr:hover {
          background: #f8fafc;
        }
        .skill-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .skill-name {
          width: 150px;
          font-weight: 500;
        }
        .skill-bar {
          flex: 1;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin: 0 15px;
        }
        .skill-progress {
          height: 100%;
          background: linear-gradient(90deg, #2563EB, #4338CA);
          border-radius: 4px;
        }
        .skill-percent {
          width: 50px;
          text-align: right;
          font-weight: 500;
          color: #2563EB;
        }
        .achievement-item {
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 10px;
          border-left: 4px solid #2563EB;
        }
        .achievement-item p {
          color: #64748b;
          font-size: 13px;
          margin: 5px 0;
        }
        .achievement-item small {
          color: #94a3b8;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Student Activity Portfolio</h1>
        <p>Generated on ${formatDate(data.generated_at)}</p>
      </div>

      <div class="profile-section">
        <div class="profile-info">
          <h2>${profile.full_name}</h2>
          <p><strong>Enrollment:</strong> ${profile.enrollment_number || 'N/A'}</p>
          <p><strong>Department:</strong> ${profile.department || 'N/A'}</p>
          <p><strong>Semester:</strong> ${profile.semester || 'N/A'}</p>
          <p><strong>CGPA:</strong> ${profile.cgpa?.toFixed(2) || 'N/A'}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${stats.total_activities}</div>
          <div class="label">Total Activities</div>
        </div>
        <div class="stat-card">
          <div class="value">${stats.total_points}</div>
          <div class="label">Total Points</div>
        </div>
        <div class="stat-card">
          <div class="value">${stats.certificates_count}</div>
          <div class="label">Certificates</div>
        </div>
      </div>

      ${
        activities.length > 0
          ? `
      <div class="section">
        <h3>📋 Approved Activities</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            ${activitiesRows}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      ${
        skills.length > 0
          ? `
      <div class="section">
        <h3>🎯 Skills</h3>
        ${skillsList}
      </div>
      `
          : ''
      }

      ${
        achievements.length > 0
          ? `
      <div class="section">
        <h3>🏆 Achievements</h3>
        ${achievementsList}
      </div>
      `
          : ''
      }

      ${
        categoryBreakdownHTML
          ? `
      <div class="section">
        <h3>📊 Category Breakdown</h3>
        ${categoryBreakdownHTML}
      </div>
      `
          : ''
      }

      <div class="footer">
        <p>This portfolio was auto-generated from the Student Activity Portal</p>
        <p>© ${new Date().getFullYear()} University Student Portal</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate CSV content
 */
function generateCSV(data: PortfolioData): string {
  const { profile, activities, skills, achievements, stats } = data;
  const lines: string[] = [];

  // Add BOM for Excel UTF-8 compatibility
  lines.push('\ufeff');

  // Profile section
  lines.push('STUDENT PORTFOLIO REPORT');
  lines.push(`Generated On,${formatDate(data.generated_at)}`);
  lines.push('');
  lines.push('PROFILE INFORMATION');
  lines.push(`Name,${profile.full_name}`);
  lines.push(`Email,${profile.email}`);
  lines.push(`Enrollment Number,${profile.enrollment_number || 'N/A'}`);
  lines.push(`Department,${profile.department || 'N/A'}`);
  lines.push(`Semester,${profile.semester || 'N/A'}`);
  lines.push(`CGPA,${profile.cgpa?.toFixed(2) || 'N/A'}`);
  lines.push('');

  // Statistics
  lines.push('STATISTICS');
  lines.push(`Total Activities,${stats.total_activities}`);
  lines.push(`Total Points,${stats.total_points}`);
  lines.push(`Certificates,${stats.certificates_count}`);
  lines.push('');

  // Activities
  if (activities.length > 0) {
    lines.push('ACTIVITIES');
    lines.push('S.No,Title,Description,Category,Date,Location,Points,Status');
    activities.forEach((activity, index) => {
      const description = activity.description.replace(/,/g, ';').replace(/\n/g, ' ');
      lines.push(
        `${index + 1},${activity.title},"${description}",${formatCategory(activity.category)},${formatDate(activity.activity_date)},${activity.location || 'N/A'},${activity.points},${activity.status}`
      );
    });
    lines.push('');
  }

  // Skills
  if (skills.length > 0) {
    lines.push('SKILLS');
    lines.push('S.No,Skill Name,Proficiency (%)');
    skills.forEach((skill, index) => {
      lines.push(`${index + 1},${skill.name},${skill.proficiency}`);
    });
    lines.push('');
  }

  // Achievements
  if (achievements.length > 0) {
    lines.push('ACHIEVEMENTS');
    lines.push('S.No,Title,Description,Date Earned');
    achievements.forEach((achievement, index) => {
      const description = (achievement.description || '').replace(/,/g, ';').replace(/\n/g, ' ');
      lines.push(
        `${index + 1},${achievement.title},"${description}",${formatDate(achievement.date_earned)}`
      );
    });
    lines.push('');
  }

  // Category breakdown
  lines.push('CATEGORY BREAKDOWN');
  lines.push('Category,Count');
  Object.entries(stats.category_breakdown).forEach(([category, count]) => {
    if (count > 0) {
      lines.push(`${formatCategory(category)},${count}`);
    }
  });

  return lines.join('\n');
}

/**
 * Export portfolio as PDF
 */
export async function exportToPDF(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const portfolioData = await fetchPortfolioData(studentId);

    if (!portfolioData) {
      return { success: false, error: 'Failed to fetch portfolio data' };
    }

    const html = generatePDFHTML(portfolioData);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create a proper filename
    const fileName = `Portfolio_${portfolioData.profile.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    // Use expo-file-system new API to create file in documents
    const pdfFile = new File(Paths.document, fileName);
    
    // Copy generated PDF to documents directory
    const tempFile = new File(uri);
    await tempFile.move(pdfFile);

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfFile.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Portfolio PDF',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('ExportToPDF error:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
}

/**
 * Export portfolio as CSV
 */
export async function exportToCSV(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const portfolioData = await fetchPortfolioData(studentId);

    if (!portfolioData) {
      return { success: false, error: 'Failed to fetch portfolio data' };
    }

    const csvContent = generateCSV(portfolioData);
    const fileName = `Portfolio_${portfolioData.profile.full_name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    
    // Use expo-file-system new API to create file in documents
    const csvFile = new File(Paths.document, fileName);
    
    // Write CSV content to file
    await csvFile.write(csvContent);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(csvFile.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Save Portfolio CSV',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('ExportToCSV error:', error);
    return { success: false, error: 'Failed to generate CSV' };
  }
}

/**
 * Preview PDF (opens print dialog)
 */
export async function previewPDF(studentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const portfolioData = await fetchPortfolioData(studentId);

    if (!portfolioData) {
      return { success: false, error: 'Failed to fetch portfolio data' };
    }

    const html = generatePDFHTML(portfolioData);

    // Open print preview
    await Print.printAsync({
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('PreviewPDF error:', error);
    return { success: false, error: 'Failed to preview PDF' };
  }
}
