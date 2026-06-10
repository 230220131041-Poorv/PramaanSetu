import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  FileText, 
  Link2, 
  Download, 
  Copy, 
  Check,
  Share2,
  Globe,
  Lock
} from 'lucide-react-native';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { PortfolioExportFormat, PortfolioExportOptions } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (options: PortfolioExportOptions) => Promise<{ success: boolean; url?: string; error?: string }>;
  userName: string;
}

export default function ShareModal({ visible, onClose, onExport, userName }: ShareModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<PortfolioExportFormat>('web_link');
  const [isPublic, setIsPublic] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeAchievements, setIncludeAchievements] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatOptions: { format: PortfolioExportFormat; icon: any; title: string; description: string }[] = [
    {
      format: 'web_link',
      icon: Link2,
      title: 'Shareable Link',
      description: 'Generate a web link to share your portfolio',
    },
    {
      format: 'pdf',
      icon: FileText,
      title: 'PDF Document',
      description: 'Download your portfolio as a PDF file',
    },
  ];

  const handleExport = async () => {
    setLoading(true);
    setGeneratedUrl(null);
    
    const options: PortfolioExportOptions = {
      format: selectedFormat,
      includeActivities,
      includeSkills,
      includeAchievements,
      includeStats,
      expiresInDays: isPublic ? undefined : 7,
    };

    const result = await onExport(options);
    
    if (result.success && result.url) {
      setGeneratedUrl(result.url);
      
      if (selectedFormat === 'pdf') {
        Alert.alert('Success', 'Your portfolio PDF has been generated!');
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to generate portfolio');
    }
    
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (generatedUrl) {
      // In a real app, use Clipboard API
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Copied!', 'Link copied to clipboard');
    }
  };

  const handleShare = async () => {
    if (generatedUrl) {
      try {
        await Share.share({
          message: `Check out ${userName}'s verified portfolio: ${generatedUrl}`,
          url: generatedUrl,
          title: `${userName}'s Portfolio`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCopied(false);
    onClose();
  };

  const ToggleOption = ({ 
    label, 
    value, 
    onToggle 
  }: { 
    label: string; 
    value: boolean; 
    onToggle: () => void;
  }) => (
    <TouchableOpacity style={styles.toggleOption} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Portfolio</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Format Selection */}
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatOptions}>
            {formatOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedFormat === option.format;
              return (
                <TouchableOpacity
                  key={option.format}
                  style={[styles.formatOption, isSelected && styles.formatOptionSelected]}
                  onPress={() => setSelectedFormat(option.format)}
                >
                  <View style={[styles.formatIcon, isSelected && styles.formatIconSelected]}>
                    <Icon size={24} color={isSelected ? COLORS.white : COLORS.primary} />
                  </View>
                  <Text style={[styles.formatTitle, isSelected && styles.formatTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.formatDescription}>{option.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Privacy Option (for web link) */}
          {selectedFormat === 'web_link' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <View style={styles.privacyOptions}>
                <TouchableOpacity
                  style={[styles.privacyOption, isPublic && styles.privacyOptionSelected]}
                  onPress={() => setIsPublic(true)}
                >
                  <Globe size={20} color={isPublic ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.privacyText, isPublic && styles.privacyTextSelected]}>
                    Public (Anyone with link)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.privacyOption, !isPublic && styles.privacyOptionSelected]}
                  onPress={() => setIsPublic(false)}
                >
                  <Lock size={20} color={!isPublic ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.privacyText, !isPublic && styles.privacyTextSelected]}>
                    Expires in 7 days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Include Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Include in Portfolio</Text>
            <View style={styles.toggleList}>
              <ToggleOption
                label="Verified Activities"
                value={includeActivities}
                onToggle={() => setIncludeActivities(!includeActivities)}
              />
              <ToggleOption
                label="Skills & Competencies"
                value={includeSkills}
                onToggle={() => setIncludeSkills(!includeSkills)}
              />
              <ToggleOption
                label="Achievements"
                value={includeAchievements}
                onToggle={() => setIncludeAchievements(!includeAchievements)}
              />
              <ToggleOption
                label="Statistics Summary"
                value={includeStats}
                onToggle={() => setIncludeStats(!includeStats)}
              />
            </View>
          </View>

          {/* Generated URL */}
          {generatedUrl && (
            <View style={styles.generatedSection}>
              <Text style={styles.sectionTitle}>Your Portfolio Link</Text>
              <View style={styles.urlContainer}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {generatedUrl}
                </Text>
                <View style={styles.urlActions}>
                  <TouchableOpacity style={styles.urlButton} onPress={handleCopyLink}>
                    {copied ? (
                      <Check size={20} color={COLORS.success} />
                    ) : (
                      <Copy size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.urlButton} onPress={handleShare}>
                    <Share2 size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleExport}
            disabled={loading}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.generateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <Download size={20} color={COLORS.white} />
                  <Text style={styles.generateButtonText}>
                    {selectedFormat === 'pdf' ? 'Generate PDF' : 
                     selectedFormat === 'qr_code' ? 'Generate QR Code' : 
                     'Generate Link'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  formatOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  formatIconSelected: {
    backgroundColor: COLORS.primary,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  formatTitleSelected: {
    color: COLORS.primary,
  },
  formatDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  privacyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  privacyTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  toggleList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  toggleLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  generatedSection: {
    marginTop: 24,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  urlActions: {
    flexDirection: 'row',
    gap: 8,
  },
  urlButton: {
    padding: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
