import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  label?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'This year', days: 365 },
];

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  label = 'Date Range',
}: DateRangePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayRange = () => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return formatDate(startDate || endDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayPress = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (selectingStart) {
      setTempStart(selectedDate);
      setTempEnd(null);
      setSelectingStart(false);
    } else {
      if (tempStart && selectedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(selectedDate);
      } else {
        setTempEnd(selectedDate);
      }
      setSelectingStart(true);
    }
  };

  const handlePresetSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setTempStart(start);
    setTempEnd(end);
  };

  const handleApply = () => {
    onDateChange(tempStart, tempEnd);
    setShowModal(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onDateChange(null, null);
    setShowModal(false);
  };

  const isDateInRange = (day: number) => {
    if (!tempStart || !tempEnd) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= tempStart && date <= tempEnd;
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      (tempStart && date.toDateString() === tempStart.toDateString()) ||
      (tempEnd && date.toDateString() === tempEnd.toDateString())
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const inRange = isDateInRange(day);
      const selected = isDateSelected(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            inRange && styles.dayCellInRange,
            selected && styles.dayCellSelected,
          ]}
          onPress={() => handleDayPress(day)}
        >
          <Text
            style={[
              styles.dayText,
              inRange && styles.dayTextInRange,
              selected && styles.dayTextSelected,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <Calendar size={20} color={COLORS.primary} />
        <Text style={styles.selectorText}>{formatDisplayRange()}</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Preset Ranges */}
            <View style={styles.presetContainer}>
              {PRESET_RANGES.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetButton}
                  onPress={() => handlePresetSelect(preset.days)}
                >
                  <Text style={styles.presetText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Range Display */}
            <View style={styles.selectedRange}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateValue}>{formatDate(tempStart)}</Text>
              </View>
              <Text style={styles.dateSeparator}>→</Text>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateValue}>{formatDate(tempEnd)}</Text>
              </View>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                <ChevronLeft size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                <ChevronRight size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  selectorText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  presetText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateBox: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateSeparator: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInRange: {
    backgroundColor: COLORS.primaryLight,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dayTextInRange: {
    color: COLORS.primary,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});
