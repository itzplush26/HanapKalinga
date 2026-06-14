import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Chip } from '../../../src/components/ui/Chip';
import { Input } from '../../../src/components/ui/Input';
import { TextLink } from '../../../src/components/ui/TextLink';
import { getInitials } from '../../../src/lib/helpers';
import { supabase } from '../../../src/lib/supabase';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';
import type { Shift, PatientCondition } from '@hanapkalinga/shared/types';

const SHIFTS: { label: string; value: Shift }[] = [
  { label: 'Morning (6AM-2PM)', value: 'morning' },
  { label: 'Afternoon (2PM-10PM)', value: 'afternoon' },
  { label: 'Evening (10PM-6AM)', value: 'evening' },
  { label: 'Full Day (6AM-6PM)', value: 'full_day' },
];

const CONDITIONS: { label: string; value: PatientCondition }[] = [
  { label: 'Bedridden', value: 'bedridden' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Needs assistance', value: 'assisted' },
];

const BUDGET_BANDS = [
  { label: 'Under P1,000/day', value: 'under_1000' },
  { label: 'P1,000 - P2,000/day', value: '1000_2000' },
  { label: 'P2,000 - P3,500/day', value: '2000_3500' },
  { label: 'P3,500+/day', value: '3500_plus' },
];

const BOOKING_SKILLS = [
  'IV Therapy',
  'Wound Care',
  'Medication Management',
  'Post-Op Care',
  'Mobility Assistance',
  'Palliative Care',
];

interface NurseInfo {
  id: string;
  full_name: string | null;
  city: string | null;
  daily_rate_12hr: number | null;
}

export default function NewBookingScreen() {
  const router = useRouter();
  const { nurseId } = useLocalSearchParams<{ nurseId: string }>();
  const { user } = useAuth();

  const [nurse, setNurse] = useState<NurseInfo | null>(null);
  const [loadingNurse, setLoadingNurse] = useState(!!nurseId);

  const [requestedDate, setRequestedDate] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [patientCondition, setPatientCondition] = useState<PatientCondition | null>(null);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (nurseId) {
      supabase
        .from('nurses')
        .select('id, daily_rate_12hr, profiles!inner(full_name, city)')
        .eq('id', nurseId)
        .single()
        .then(({ data: raw, error }) => {
          if (!error && raw) {
            const d = raw as any;
            setNurse({
              id: d.id,
              full_name: d.profiles?.full_name ?? null,
              city: d.profiles?.city ?? null,
              daily_rate_12hr: d.daily_rate_12hr,
            });
          }
          setLoadingNurse(false);
        });
    }
  }, [nurseId]);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setRequestedDate(selectedDate);
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!user || !nurseId) {
      Alert.alert('Error', 'Please select a nurse first.');
      return;
    }
    if (!shift) {
      Alert.alert('Validation', 'Please select a shift.');
      return;
    }
    if (!patientCondition) {
      Alert.alert('Validation', 'Please select a patient condition.');
      return;
    }
    if (requiredSkills.length === 0) {
      Alert.alert('Validation', 'Please select at least one required skill.');
      return;
    }
    if (!budgetRange) {
      Alert.alert('Validation', 'Please select a budget range.');
      return;
    }

    setSubmitting(true);

    const notes = JSON.stringify({
      patientCondition,
      requiredSkills,
      budgetRange,
      additionalInstructions: additionalNotes.trim() || undefined,
    });

    const { error: bookingError } = await supabase.from('bookings').insert({
      family_id: user.id,
      nurse_id: nurseId,
      requested_date: requestedDate.toISOString().split('T')[0],
      shift,
      status: 'pending',
      notes,
    } as any);

    setSubmitting(false);

    if (bookingError) {
      Alert.alert('Error', bookingError.message);
      return;
    }

    Alert.alert(
      'Booking Requested',
      'Your booking request has been sent to the nurse.',
      [
        { text: 'View Booking', onPress: () => router.push('/(family)/bookings') },
        { text: 'OK', onPress: () => router.back() },
      ]
    );
  };

  if (!nurseId) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <CalendarDays size={48} color={colors.muted} />
          <Text style={styles.selectNurseTitle}>Select a nurse first</Text>
          <Text style={styles.selectNurseSubtitle}>
            Browse nurses and tap "Request Booking" to get started.
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/(family)/browse')}
          >
            Browse nurses
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.title}>New Booking</Text>

        {loadingNurse ? (
          <Text style={styles.loadingText}>Loading nurse info...</Text>
        ) : nurse ? (
          <Card variant="cream" roundedSize="md">
            <View style={styles.nurseRow}>
              <View style={styles.nurseAvatar}>
                <Text style={styles.nurseAvatarText}>
                  {getInitials(nurse.full_name ?? 'Nurse')}
                </Text>
              </View>
              <View style={styles.nurseInfo}>
                <Text style={styles.nurseName}>{nurse.full_name ?? 'Nurse'}</Text>
                {nurse.city && (
                  <Text style={styles.nurseCity}>{nurse.city}</Text>
                )}
                {nurse.daily_rate_12hr && (
                  <Text style={styles.nurseRate}>
                    P{Number(nurse.daily_rate_12hr).toLocaleString('en-PH')}/day
                  </Text>
                )}
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePicker}
            accessibilityRole="button"
            accessibilityLabel="Select date"
            testID="bookingNew_picker_date"
          >
            <CalendarDays size={18} color={colors.brand[600]} />
            <Text style={styles.dateText}>
              {requestedDate.toLocaleDateString('en-PH', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={requestedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date(Date.now() + 86400000)}
              maximumDate={new Date(Date.now() + 30 * 86400000)}
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Patient condition</Text>
          <View style={styles.optionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setPatientCondition(c.value)}
                style={[
                  styles.optionCard,
                  patientCondition === c.value && styles.optionCardSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: patientCondition === c.value }}
                testID={`bookingNew_input_condition_${c.value}`}
              >
                <Text
                  style={[
                    styles.optionText,
                    patientCondition === c.value && styles.optionTextSelected,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Shift</Text>
          <View style={styles.chipRow}>
            {SHIFTS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={shift === s.value}
                onPress={() => setShift(s.value)}
                testID={`bookingNew_picker_shift_${s.value}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Required skills</Text>
          <View style={styles.chipRow}>
            {BOOKING_SKILLS.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                selected={requiredSkills.includes(skill)}
                onPress={() => toggleSkill(skill)}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Budget range</Text>
          <View style={styles.chipRow}>
            {BUDGET_BANDS.map((b) => (
              <Chip
                key={b.value}
                label={b.label}
                selected={budgetRange === b.value}
                onPress={() => setBudgetRange(b.value)}
                testID={`bookingNew_input_budget_${b.value}`}
              />
            ))}
          </View>
        </View>

        <Input
          label="Additional notes (optional)"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          placeholder="Any special requirements or instructions"
          multiline
          numberOfLines={3}
        />

        <Button variant="primary" loading={submitting} onPress={handleSubmit} testID="bookingNew_button_submit">
          Submit Request
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  loadingText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  selectNurseTitle: {
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  selectNurseSubtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'center',
  },
  nurseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nurseAvatar: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  nurseAvatarText: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  nurseInfo: {
    flex: 1,
    gap: 2,
  },
  nurseName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  nurseCity: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  nurseRate: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[600],
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  dateText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  optionText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.brand[600],
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
