import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EVENT_TYPES } from '@/constants/Content';
import { Colors } from '@/constants/Colors';
import { AppData, AppCalendarEvent } from '@/lib/appData';
import { isLiveSupabaseConfigured } from '@/lib/authService';

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  notes: string | null;
  is_recurring: boolean;
}

export default function CalendarScreen() {
  const { colors, accentColor, isDark } = useTheme();
  const { user, coupleId } = useAuthStore();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newType, setNewType] = useState('focus');
  const [newNotes, setNewNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      // 1. Load persistent calendar events from AppData
      const localEvents = await AppData.getCalendarEvents();

      // 2. If live Supabase cloud connected, sync with Supabase
      if (isLiveSupabaseConfigured() && user) {
        try {
          const cid = coupleId || 'personal';
          const { data } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('couple_id', cid)
            .order('event_date');
          if (data && data.length > 0) return data as CalendarEvent[];
        } catch { /* noop */ }
      }
      return localEvents as CalendarEvent[];
    },
  });

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const firstDayOffset = startOfMonth(currentMonth).getDay();

  const getEventsForDate = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.event_date), date));

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const saveEvent = async () => {
    if (!newTitle.trim() || !newDate) {
      Alert.alert('Missing Info', 'Please enter a title and date.');
      return;
    }
    setSaving(true);
    try {
      // Save locally to persistent AppData
      await AppData.saveCalendarEvent({
        title: newTitle.trim(),
        event_date: newDate,
        event_type: newType,
        notes: newNotes.trim() || null,
        is_recurring: isRecurring,
      });

      // Also save to Supabase if live cloud connected
      if (isLiveSupabaseConfigured() && user) {
        try {
          const cid = coupleId || 'personal';
          await supabase.from('calendar_events').insert({
            couple_id: cid,
            created_by: user.id,
            title: newTitle.trim(),
            event_date: newDate,
            event_type: newType,
            notes: newNotes.trim() || null,
            is_recurring: isRecurring,
          });
        } catch (err) {
          console.warn('Supabase calendar sync skipped:', err);
        }
      }

      setShowAddModal(false);
      setNewTitle('');
      setNewNotes('');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    } catch {
      Alert.alert('Error', 'Could not save schedule item.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    Alert.alert('Remove Entry', 'Remove this scheduled item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await AppData.deleteCalendarEvent(id);
          if (isLiveSupabaseConfigured()) {
            try {
              await supabase.from('calendar_events').delete().eq('id', id);
            } catch { /* noop */ }
          }
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" style={{ color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              AGENDA & FOCUS
            </Text>
            <Text variant="heading" style={{ color: colors.text, fontSize: 28, marginTop: 2 }}>
              Calendar
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addBtn, { backgroundColor: Colors.taupe }]}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Minimalist Frosted Calendar Card (from design reference) */}
        <Card elevated style={[styles.calendarCard, { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB0' }]}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Text variant="subheading" style={{ color: colors.text, fontSize: 17, fontFamily: 'Inter_600SemiBold' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <View style={styles.navButtons}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(m => subMonths(m, 1))}
                style={[styles.navBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 14 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurrentMonth(m => addMonths(m, 1))}
                style={[styles.navBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 14 }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Days of week */}
          <View style={styles.dayRow}>
            {daysOfWeek.map((d, i) => (
              <Text key={i} style={[styles.dayHeaderLabel, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.grid}>
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {monthDays.map(date => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentDay = isSameDay(date, new Date());
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.selectedDayCell, { backgroundColor: Colors.taupe }],
                    !isSelected && isCurrentDay && [styles.todayCell, { borderColor: Colors.taupe }],
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isSelected ? '#FFFFFF' : isSameMonth(date, currentMonth) ? colors.text : colors.textSubtle },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                  {hasEvents && (
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : Colors.sage },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Selected Day Agenda */}
        {selectedDate && (
          <View style={styles.agendaSection}>
            <View style={styles.agendaHeader}>
              <Text variant="subheading" style={{ color: colors.text }}>
                {isSameDay(selectedDate, new Date())
                  ? 'Today'
                  : format(selectedDate, 'EEEE, MMM d')}
              </Text>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                {selectedEvents.length} {selectedEvents.length === 1 ? 'session' : 'sessions'}
              </Text>
            </View>

            {selectedEvents.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFF80' }]}>
                <Text style={{ fontSize: 24, marginBottom: 6 }}>🌿</Text>
                <Text variant="body" style={{ color: colors.textMuted, textAlign: 'center' }}>
                  No sessions scheduled. Enjoy your peaceful space.
                </Text>
              </Card>
            ) : (
              selectedEvents.map(event => {
                const typeMeta = EVENT_TYPES[event.event_type] ?? EVENT_TYPES.other;
                return (
                  <Card
                    key={event.id}
                    style={[
                      styles.eventCard,
                      { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFFCC', borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.eventRow}>
                      <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + '25' }]}>
                        <Text style={{ fontSize: 16 }}>{typeMeta.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '600' }}>
                          {event.title}
                        </Text>
                        <Text variant="caption" style={{ color: colors.textMuted }}>
                          {typeMeta.label}
                        </Text>
                        {event.notes && (
                          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                            {event.notes}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => deleteEvent(event.id)} style={{ padding: 6 }}>
                        <Text style={{ color: colors.textSubtle, fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Schedule Item Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text variant="bodyMedium" style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
            <Text variant="subheading" style={{ color: colors.text }}>New Schedule Item</Text>
            <TouchableOpacity onPress={saveEvent} disabled={saving}>
              <Text variant="bodyMedium" style={{ color: Colors.taupe, fontWeight: '600' }}>
                {saving ? 'Saving...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Session or task title..."
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            />
            <TextInput
              value={newDate}
              onChangeText={setNewDate}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            />

            {/* Category selection */}
            <Text variant="label" style={{ color: colors.textMuted, marginTop: 8 }}>Category</Text>
            <View style={styles.typeGrid}>
              {Object.entries(EVENT_TYPES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setNewType(key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: newType === key ? val.color : colors.surface,
                      borderColor: newType === key ? val.color : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{val.emoji}</Text>
                  <Text
                    variant="caption"
                    style={{
                      color: newType === key ? '#FFFFFF' : colors.text,
                      fontWeight: newType === key ? '600' : '400',
                    }}
                  >
                    {val.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Notes, intentions or location..."
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={3}
              style={[styles.textArea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeaderLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
    position: 'relative',
  },
  selectedDayCell: {
    borderRadius: 14,
    shadowColor: '#2B2724',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  todayCell: {
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
  agendaSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 6,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  eventCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: { flex: 1, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9D0C5',
    marginBottom: 16,
  },
  modalForm: { gap: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
