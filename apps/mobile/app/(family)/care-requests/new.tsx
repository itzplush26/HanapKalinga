import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { RegionCitySelects } from '../../../src/components/domain/RegionCitySelects';
import { Chip } from '../../../src/components/ui/Chip';
import { Button } from '../../../src/components/ui/Button';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';
import { PH_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';

export default function NewCareRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [careType, setCareType] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [budgetBand, setBudgetBand] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const CARE_TYPES = ['Nurse', 'Caregiver'];
  const BUDGET_BANDS = ['under_1000', '1000_2000', '2000_3500', '3500_plus'];

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !careType || !region || !city || !barangay || selectedSpecs.length === 0 || !budgetBand || !startDate) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.id) return;

    setSaving(true);
    try {
      const { error: insertError } = await (supabase.from('care_requests') as any).insert({
        family_id: user.id,
        title: title.trim(),
        care_type: careType,
        region,
        city,
        barangay,
        required_specializations: selectedSpecs,
        budget_band: budgetBand,
        start_date: startDate,
        description: description.trim() || null,
      });

      if (insertError) {
        Alert.alert('Error', insertError.message);
        return;
      }

      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create care request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>New Care Request</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Need a nurse for my father"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Title"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Care Type *</Text>
          <View style={styles.chipRow}>
            {CARE_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={careType === type}
                onPress={() => setCareType(type)}
              />
            ))}
          </View>
        </View>

        <RegionCitySelects
          region={region}
          city={city}
          onRegionChange={setRegion}
          onCityChange={setCity}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Barangay *</Text>
          <TextInput
            style={styles.input}
            value={barangay}
            onChangeText={setBarangay}
            placeholder="Enter barangay"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Barangay"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Required Specializations *</Text>
          <View style={styles.chipRow}>
            {PH_SPECIALIZATIONS.map((spec) => (
              <Chip
                key={spec}
                label={spec}
                selected={selectedSpecs.includes(spec)}
                onPress={() => toggleSpec(spec)}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Budget Band *</Text>
          <View style={styles.chipRow}>
            {BUDGET_BANDS.map((band) => (
              <Chip
                key={band}
                label={band.replace(/_/g, ' ').replace(/(\d+)_(\d+)/, '₱$1 - ₱$2')}
                selected={budgetBand === band}
                onPress={() => setBudgetBand(band)}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Start date"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your care needs..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            accessibilityLabel="Description"
          />
        </View>

        <View style={styles.actions}>
          <Button variant="secondary" onPress={() => router.back()} style={styles.actionButton}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={saving}
            style={styles.actionButton}
          >
            Post Care Request
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    backgroundColor: colors.canvas,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
