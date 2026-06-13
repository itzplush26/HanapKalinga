import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { TextLink } from './ui/TextLink';
import { PROVIDER_SPECIALIZATIONS, PH_CITIES } from '@hanapkalinga/shared/constants';
import type { NurseFilters } from '../lib/hooks/useNurses';
import type { ProviderType } from '@hanapkalinga/shared/types';

interface NurseFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: NurseFilters) => void;
  currentFilters: NurseFilters;
}

const RATE_BANDS = [
  { label: 'Under P1,000', min: 0, max: 999 },
  { label: 'P1,000 - P2,000', min: 1000, max: 2000 },
  { label: 'P2,000 - P3,500', min: 2000, max: 3500 },
  { label: 'P3,500+', min: 3500, max: undefined },
];

export function NurseFiltersSheet({
  visible,
  onClose,
  onApply,
  currentFilters,
}: NurseFiltersSheetProps) {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(currentFilters.city);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(
    currentFilters.specializations ?? []
  );
  const [selectedRateBand, setSelectedRateBand] = useState<number | undefined>(
    currentFilters.minRate
  );
  const [selectedAvailability, setSelectedAvailability] = useState<string>(
    currentFilters.availabilityStatus ?? 'any'
  );
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderType | undefined>(
    currentFilters.providerType
  );

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleApply = () => {
    const band = RATE_BANDS.find((b) => b.min === selectedRateBand);
    onApply({
      city: selectedCity,
      specializations: selectedSpecializations.length > 0 ? selectedSpecializations : undefined,
      minRate: band?.min,
      maxRate: band?.max,
      availabilityStatus: selectedAvailability as NurseFilters['availabilityStatus'],
      providerType: selectedProviderType,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCity(undefined);
    setSelectedSpecializations([]);
    setSelectedRateBand(undefined);
    setSelectedAvailability('any');
    setSelectedProviderType(undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close filters" accessibilityRole="button">
            <X size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {PH_CITIES.map((city) => (
              <Chip
                key={city}
                label={city}
                selected={selectedCity === city}
                onPress={() => setSelectedCity(selectedCity === city ? undefined : city)}
                style={styles.chip}
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Specialization</Text>
          <View style={styles.chipGrid}>
            {PROVIDER_SPECIALIZATIONS.map((spec) => (
              <Chip
                key={spec}
                label={spec}
                selected={selectedSpecializations.includes(spec)}
                onPress={() => toggleSpecialization(spec)}
                style={styles.chip}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Daily Rate</Text>
          <View style={styles.chipGrid}>
            {RATE_BANDS.map((band) => (
              <Chip
                key={band.label}
                label={band.label}
                selected={selectedRateBand === band.min}
                onPress={() => setSelectedRateBand(selectedRateBand === band.min ? undefined : band.min)}
                style={styles.chip}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.chipRow}>
            {[
              { label: 'Any', value: 'any' },
              { label: 'Available Now', value: 'available_now' },
              { label: 'Available This Week', value: 'available_next_week' },
            ].map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={selectedAvailability === opt.value}
                onPress={() => setSelectedAvailability(opt.value)}
                style={styles.chip}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Provider Type</Text>
          <View style={styles.chipRow}>
            {[
              { label: 'Both', value: undefined },
              { label: 'Nurse', value: 'nurse' as ProviderType },
              { label: 'Caregiver', value: 'caregiver' as ProviderType },
            ].map((opt) => (
              <Chip
                key={opt.label}
                label={opt.label}
                selected={selectedProviderType === opt.value}
                onPress={() => setSelectedProviderType(opt.value)}
                style={styles.chip}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TextLink onPress={handleReset}>Reset</TextLink>
          <Button variant="primary" onPress={handleApply} style={styles.applyButton}>
            Apply
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  title: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipScroll: {
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  applyButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
