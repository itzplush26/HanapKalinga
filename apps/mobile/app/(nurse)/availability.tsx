import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  useNurseWeekAvailability,
  getWeekRange,
  type WeekAvailabilitySlot,
} from '../../src/lib/hooks/useNurseWeekAvailability';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';
import type { Shift } from '@hanapkalinga/shared/types';

const SHIFTS = ['morning', 'afternoon', 'evening'] as const;
const SHIFT_LABELS: Record<string, string> = {
  morning: 'Morning\n6AM-2PM',
  afternoon: 'Afternoon\n2PM-10PM',
  evening: 'Evening\n10PM-6AM',
};
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekLabel(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-PH', opts)} – ${end.toLocaleDateString('en-PH', opts)}`;
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const { data: slots, loading, error, refetch } = useNurseWeekAvailability(user?.id, weekStart);
  const [localSlots, setLocalSlots] = useState<WeekAvailabilitySlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const syncedSlots = loading && localSlots.length === 0 ? [] : localSlots.length > 0 ? localSlots : slots;

  const toggleSlot = useCallback(
    (date: string, shift: Shift) => {
      setLocalSlots((prev) => {
        const next = prev.length > 0 ? prev : slots;
        return next.map((s) =>
          s.date === date && s.shift === shift ? { ...s, is_open: !s.is_open } : s
        );
      });
      setHasChanges(true);
    },
    [slots]
  );

  const handleSave = async () => {
    if (!user || !hasChanges) return;
    setSaving(true);

    const currentSlots = localSlots.length > 0 ? localSlots : slots;
    const changedSlots = currentSlots.filter(
      (s, i) => s.is_open !== (slots[i]?.is_open ?? false)
    );

    try {
      for (const slot of changedSlots) {
        if (slot.id) {
          await (supabase as any)
            .from('availability')
            .update({ is_open: slot.is_open })
            .eq('id', slot.id);
        } else {
          await (supabase as any).from('availability').insert({
            nurse_id: user.id,
            date: slot.date,
            shift: slot.shift,
            is_open: slot.is_open,
          });
        }
      }
      setHasChanges(false);
      setLocalSlots([]);
      refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const goToPrevWeek = () => {
    setLocalSlots([]);
    setHasChanges(false);
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setLocalSlots([]);
    setHasChanges(false);
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const { start: weekStartStr } = getWeekRange(weekStart);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Availability</Text>

        <View style={styles.weekNav}>
          <TextLink onPress={goToPrevWeek}>{'< Previous'}</TextLink>
          <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
          <TextLink onPress={goToNextWeek}>{'Next >'}</TextLink>
        </View>

        {loading && syncedSlots.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <Skeleton variant="rectangle" height={300} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="primary" onPress={refetch}>Retry</Button>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.gridHeader}>
                <View style={styles.shiftLabelCol} />
                {DAY_LABELS.map((label, i) => {
                  const date = new Date(weekStart);
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const isPast = isPastDate(dateStr);
                  const isCurrent = isToday(dateStr);
                  return (
                    <View
                      key={label}
                      style={[
                        styles.dayHeader,
                        isCurrent && styles.dayHeaderCurrent,
                        isPast && styles.dayPast,
                      ]}
                    >
                      <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>
                        {label}
                      </Text>
                      <Text style={[styles.dayDate, isCurrent && styles.dayLabelCurrent]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {SHIFTS.map((shift) => (
                <View key={shift} style={styles.gridRow}>
                  <View style={styles.shiftLabelCol}>
                    <Text style={styles.shiftLabel}>{SHIFT_LABELS[shift]}</Text>
                  </View>
                  {DAY_LABELS.map((_, i) => {
                    const date = new Date(weekStart);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const slot = syncedSlots.find(
                      (s) => s.date === dateStr && s.shift === shift
                    );
                    const isOpen = slot?.is_open ?? false;
                    const past = isPastDate(dateStr);

                    return (
                      <TouchableOpacity
                        key={`${dateStr}-${shift}`}
                        onPress={() => !past && toggleSlot(dateStr, shift)}
                        disabled={past}
                        activeOpacity={0.7}
                        style={[
                          styles.cell,
                          isOpen && !past && styles.cellOpen,
                          past && styles.cellPast,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isOpen, disabled: past }}
                        accessibilityLabel={`${DAY_LABELS[i]} ${shift} ${isOpen ? 'open' : 'closed'}`}
                      >
                        <Text style={[styles.cellText, isOpen && !past && styles.cellTextOpen]}>
                          {isOpen ? '✓' : '—'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <Button
          variant="primary"
          loading={saving}
          disabled={!hasChanges}
          onPress={handleSave}
          style={styles.saveButton}
        >
          Save
        </Button>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekLabel: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  skeletonContainer: {
    padding: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftLabelCol: {
    width: 72,
    marginRight: spacing.xs,
  },
  dayHeader: {
    width: 48,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginHorizontal: 2,
    borderRadius: rounded.sm,
  },
  dayHeaderCurrent: {
    borderWidth: 2,
    borderColor: colors.brand[400],
  },
  dayPast: {
    opacity: 0.4,
  },
  dayLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.muted,
  },
  dayLabelCurrent: {
    color: colors.brand[600],
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  dayDate: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shiftLabel: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'right',
    lineHeight: 14,
  },
  cell: {
    width: 48,
    height: 48,
    borderRadius: rounded.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  cellOpen: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  cellPast: {
    backgroundColor: colors.surface.strong,
    opacity: 0.5,
  },
  cellText: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
  },
  cellTextOpen: {
    color: colors.canvas,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
