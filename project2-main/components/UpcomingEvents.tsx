import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { DashboardEvent, DashboardEventType } from '@/types';

interface UpcomingEventsProps {
  events: DashboardEvent[];
  onEventPress?: (event: DashboardEvent) => void;
  onViewAll?: () => void;
  maxDisplay?: number;
}

const getEventIcon = (type: DashboardEventType) => {
  switch (type) {
    case 'deadline':
      return { icon: AlertCircle, color: COLORS.error };
    case 'event':
      return { icon: Calendar, color: COLORS.primary };
    case 'reminder':
      return { icon: Clock, color: COLORS.warning };
    case 'holiday':
      return { icon: Calendar, color: COLORS.success };
    default:
      return { icon: Calendar, color: COLORS.textMuted };
  }
};

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysUntil = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function UpcomingEvents({
  events,
  onEventPress,
  onViewAll,
  maxDisplay = 3,
}: UpcomingEventsProps) {
  const displayEvents = events.slice(0, maxDisplay);

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Events</Text>
        </View>
        <View style={styles.emptyState}>
          <Calendar size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Events</Text>
        {events.length > maxDisplay && onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.eventsList}>
        {displayEvents.map((event) => {
          const { icon: Icon, color } = getEventIcon(event.type);
          const daysUntil = getDaysUntil(event.date);
          const isUrgent = daysUntil <= 2 && event.type === 'deadline';

          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventItem, isUrgent && styles.eventItemUrgent]}
              onPress={() => onEventPress?.(event)}
            >
              <View style={[styles.eventIcon, { backgroundColor: `${color}20` }]}>
                <Icon size={20} color={color} />
              </View>
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  {event.is_important && (
                    <View style={styles.importantBadge}>
                      <Text style={styles.importantText}>!</Text>
                    </View>
                  )}
                </View>
                {event.description && (
                  <Text style={styles.eventDescription} numberOfLines={1}>
                    {event.description}
                  </Text>
                )}
                <View style={styles.eventMeta}>
                  <View style={styles.eventDate}>
                    <Calendar size={12} color={COLORS.textMuted} />
                    <Text style={styles.eventDateText}>{formatEventDate(event.date)}</Text>
                  </View>
                  {event.time && (
                    <View style={styles.eventTime}>
                      <Clock size={12} color={COLORS.textMuted} />
                      <Text style={styles.eventTimeText}>{event.time}</Text>
                    </View>
                  )}
                  {event.location && (
                    <View style={styles.eventLocation}>
                      <MapPin size={12} color={COLORS.textMuted} />
                      <Text style={styles.eventLocationText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.daysUntil, isUrgent && styles.daysUntilUrgent]}>
                <Text style={[styles.daysUntilNumber, isUrgent && styles.daysUntilNumberUrgent]}>
                  {daysUntil}
                </Text>
                <Text style={[styles.daysUntilText, isUrgent && styles.daysUntilTextUrgent]}>
                  {daysUntil === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
  },
  eventItemUrgent: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  importantBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importantText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  eventDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  eventLocationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  daysUntil: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12,
  },
  daysUntilUrgent: {
    backgroundColor: COLORS.error,
  },
  daysUntilNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  daysUntilNumberUrgent: {
    color: COLORS.white,
  },
  daysUntilText: {
    fontSize: 10,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  daysUntilTextUrgent: {
    color: COLORS.white,
  },
});
