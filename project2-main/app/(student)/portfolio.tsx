import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Star, Trophy, BookOpen, Share2, CheckCircle, FileText, ExternalLink } from 'lucide-react-native';
import { COLORS, GRADIENTS, getCategoryColor } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { PortfolioExportOptions, ActivityCategory, CATEGORY_LABELS } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ShareModal from '@/components/ShareModal';
import { VerificationStamp } from '@/components/VerificationBadge';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function StudentPortfolio() {
  const { 
    user, 
    skills, 
    achievements, 
    activities,
    studentStats,
    skillsLoading, 
    fetchSkills, 
    fetchAchievements,
    fetchActivities,
    fetchStudentStats
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Get approved activities only
  const approvedActivities = activities.filter(a => a.status === 'approved');

  // Group activities by category for summary
  const activitySummary = approvedActivities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {} as Record<ActivityCategory, number>);

  useEffect(() => {
    fetchSkills();
    fetchAchievements();
    fetchActivities();
    fetchStudentStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSkills(), 
      fetchAchievements(),
      fetchActivities(),
      fetchStudentStats()
    ]);
    setRefreshing(false);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format category name
  const formatCategory = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate PDF HTML with actual data
  const generatePortfolioPDF = (): string => {
    const activitiesRows = approvedActivities
      .map((activity, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${activity.title}</td>
          <td>${formatCategory(activity.category)}</td>
          <td>${formatDate(activity.activity_date)}</td>
          <td>${activity.points}</td>
        </tr>
      `)
      .join('');

    const skillsList = skills
      .map(skill => `
        <div class="skill-item">
          <span class="skill-name">${skill.name}</span>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${skill.proficiency}%"></div>
          </div>
          <span class="skill-percent">${skill.proficiency}%</span>
        </div>
      `)
      .join('');

    const achievementsList = achievements
      .map(achievement => `
        <div class="achievement-item">
          <strong>${achievement.title}</strong>
          ${achievement.description ? `<p>${achievement.description}</p>` : ''}
          <small>${formatDate(achievement.date_earned)}</small>
        </div>
      `)
      .join('');

    const categoryBreakdownHTML = Object.entries(activitySummary)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => `
        <div class="category-item">
          <span>${formatCategory(category)}</span>
          <span class="category-count">${count}</span>
        </div>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student Portfolio - ${user?.full_name || 'Student'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
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
          .header p { color: #666; font-size: 14px; }
          .profile-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .profile-info h2 {
            font-size: 24px;
            color: #1e293b;
            margin-bottom: 12px;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .profile-info p {
            color: #64748b;
            font-size: 14px;
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
          .achievement-item small { color: #94a3b8; }
          .category-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .category-count {
            font-weight: 600;
            color: #2563EB;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
          .verified-badge {
            display: inline-block;
            background: #22c55e;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 Student Activity Portfolio</h1>
          <p>Generated on ${formatDate(new Date().toISOString())}</p>
          <span class="verified-badge">✓ Verified by Institution</span>
        </div>

        <div class="profile-section">
          <div class="profile-info">
            <h2>${user?.full_name || 'Student Name'}</h2>
            <div class="profile-grid">
              <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
              <p><strong>Department:</strong> ${user?.department || 'N/A'}</p>
              <p><strong>Enrollment:</strong> ${user?.enrollment_number || 'N/A'}</p>
              <p><strong>Semester:</strong> ${user?.semester || 'N/A'}</p>
              <p><strong>CGPA:</strong> ${user?.cgpa?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${studentStats?.total_activities || approvedActivities.length}</div>
            <div class="label">Total Activities</div>
          </div>
          <div class="stat-card">
            <div class="value">${studentStats?.total_points || 0}</div>
            <div class="label">Total Points</div>
          </div>
          <div class="stat-card">
            <div class="value">${studentStats?.certificates_count || 0}</div>
            <div class="label">Certificates</div>
          </div>
        </div>

        ${approvedActivities.length > 0 ? `
        <div class="section">
          <h3>📋 Verified Activities (${approvedActivities.length})</h3>
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
        ` : ''}

        ${skills.length > 0 ? `
        <div class="section">
          <h3>💡 Skills & Competencies</h3>
          ${skillsList}
        </div>
        ` : ''}

        ${achievements.length > 0 ? `
        <div class="section">
          <h3>🏆 Achievements</h3>
          ${achievementsList}
        </div>
        ` : ''}

        ${Object.keys(activitySummary).length > 0 ? `
        <div class="section">
          <h3>📊 Category Breakdown</h3>
          ${categoryBreakdownHTML}
        </div>
        ` : ''}

        <div class="footer">
          <p>This portfolio is verified and authenticated by the Student Activity Portal</p>
          <p>Document ID: ${user?.id?.slice(0, 8) || 'N/A'}-${Date.now()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPortfolio = async (options: PortfolioExportOptions) => {
    if (!user?.id) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      if (options.format === 'pdf') {
        const html = generatePortfolioPDF();
        
        // For web platform, open in new window and trigger print
        if (Platform.OS === 'web') {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            // Wait for content to load then print
            setTimeout(() => {
              printWindow.print();
            }, 500);
          } else {
            // Fallback to expo-print if popup blocked
            await Print.printAsync({ html });
          }
          return { success: true };
        }
        
        // For native platforms, generate file and share
        const { uri } = await Print.printToFileAsync({ html });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Portfolio PDF',
          });
        }
        
        return { success: true };
      } else if (options.format === 'web_link') {
        Alert.alert(
          'Coming Soon',
          'Shareable web links will be available in a future update.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'Web links not yet available' };
      }
      
      return { success: false, error: 'Unknown export format' };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: 'Failed to export portfolio' };
    }
  };

  const getAchievementIcon = (icon?: string) => {
    switch (icon) {
      case 'trophy':
        return <Trophy size={20} color={COLORS.warning} />;
      case 'book-open':
        return <BookOpen size={20} color={COLORS.primary} />;
      case 'star':
        return <Star size={20} color={COLORS.warning} />;
      default:
        return <Award size={20} color={COLORS.warning} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'Student'}</Text>
              <Text style={styles.profileTitle}>{user?.department || 'Department'}</Text>
              <Text style={styles.profileId}>
                {user?.enrollment_number || 'Student ID'} • Semester {user?.semester || '-'}
              </Text>
            </View>
            {/* Share Button */}
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Share2 size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Portfolio Stats Summary */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{studentStats?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{approvedActivities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{skills.length}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{achievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Verified Activities Summary */}
        {approvedActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Verified Activities</Text>
              <View style={styles.verifiedBadge}>
                <CheckCircle size={14} color={COLORS.success} />
                <Text style={styles.verifiedText}>
                  {approvedActivities.length} Verified
                </Text>
              </View>
            </View>
            <View style={styles.activitySummaryCard}>
              {Object.entries(activitySummary).map(([category, count]) => (
                <View key={category} style={styles.categorySummary}>
                  <View 
                    style={[
                      styles.categoryDot, 
                      { backgroundColor: getCategoryColor(category as ActivityCategory) }
                    ]} 
                  />
                  <Text style={styles.categoryName}>
                    {CATEGORY_LABELS[category as ActivityCategory]}
                  </Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills & Competencies</Text>
          </View>

          {skillsLoading ? (
            <LoadingSpinner />
          ) : skills.length === 0 ? (
            <EmptyState
              title="No skills added"
              message="Your skills will appear here as you complete activities"
              icon="award"
            />
          ) : (
            <View style={styles.skillsList}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillItem}>
                  <View style={styles.skillHeader}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillPercentage}>{skill.proficiency}%</Text>
                  </View>
                  <View style={styles.skillBar}>
                    <View
                      style={[
                        styles.skillProgress,
                        { 
                          width: `${skill.proficiency}%`, 
                          backgroundColor: skill.proficiency > 70 ? COLORS.success : 
                                          skill.proficiency > 40 ? COLORS.warning : COLORS.error
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>

          {achievements.length === 0 ? (
            <EmptyState
              title="No achievements yet"
              message="Complete activities to earn achievements"
              icon="award"
            />
          ) : (
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    {getAchievementIcon(achievement.icon ?? undefined)}
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <Text style={styles.achievementDate}>{achievement.date_earned}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onExport={handleExportPortfolio}
        userName={user?.full_name || 'Student'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  activitySummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  categorySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  skillsList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  skillItem: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  skillPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  skillBar: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillProgress: {
    height: '100%',
    borderRadius: 4,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  bottomPadding: {
    height: 40,
  },
});
