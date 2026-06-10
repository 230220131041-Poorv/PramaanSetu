import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox, FileText, Users, Award, Search } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: 'inbox' | 'file' | 'users' | 'award' | 'search';
}

export default function EmptyState({ title, message, icon = 'inbox' }: EmptyStateProps) {
  const getIcon = () => {
    const iconProps = { size: 64, color: COLORS.textMuted };
    switch (icon) {
      case 'file':
        return <FileText {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'search':
        return <Search {...iconProps} />;
      default:
        return <Inbox {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
