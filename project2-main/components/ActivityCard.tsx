import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, Calendar, MapPin } from 'lucide-react-native';

interface ActivityCardProps {
  title: string;
  category: string;
  description: string;
  date: string;
  location: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  points: number;
  onPress?: () => void;
}

export default function ActivityCard({
  title,
  category,
  description,
  date,
  location,
  status,
  points,
  onPress,
}: ActivityCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.detailText}>{date}</Text>
        </View>
        <View style={styles.detailItem}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText}>{location}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pointsContainer}>
          <Award size={14} color="#F59E0B" />
          <Text style={styles.pointsText}>{points} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  category: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
});