import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Badge } from './ui/Badge';

interface ParsedBookingNotes {
  patientCondition?: string;
  requiredSkills?: string[];
  budgetRange?: string;
  additionalInstructions?: string;
}

export function parseBookingNotes(notes: string | null | undefined): ParsedBookingNotes | null {
  if (!notes?.trim()) return null;
  try {
    const raw = JSON.parse(notes) as Record<string, unknown>;
    const skills = (Array.isArray(raw.requiredSkills) ? raw.requiredSkills : null) ?? (Array.isArray(raw.skills) ? raw.skills : null);
    const budget = typeof raw.budgetRange === 'string' ? raw.budgetRange : typeof raw.budgetBand === 'string' ? raw.budgetBand : undefined;
    const extra = typeof raw.additionalInstructions === 'string' ? raw.additionalInstructions : typeof raw.notes === 'string' ? raw.notes : undefined;
    return {
      patientCondition: typeof raw.patientCondition === 'string' ? raw.patientCondition : undefined,
      requiredSkills: skills?.filter((s): s is string => typeof s === 'string'),
      budgetRange: budget,
      additionalInstructions: extra,
    };
  } catch {
    return { additionalInstructions: notes };
  }
}

const CONDITION_LABELS: Record<string, string> = {
  bedridden: 'Bedridden',
  mobile: 'Mobile',
  assisted: 'Needs assistance',
};

const BUDGET_LABELS: Record<string, string> = {
  under_1000: 'Under P1,000/day',
  '1000_2000': 'P1,000 - P2,000/day',
  '2000_3500': 'P2,000 - P3,500/day',
  '3500_plus': 'P3,500+/day',
};

interface BookingDetailCardProps {
  notes: string | null | undefined;
}

export function BookingDetailCard({ notes }: BookingDetailCardProps) {
  const details = parseBookingNotes(notes);
  if (!details) return null;

  const condition = details.patientCondition ? CONDITION_LABELS[details.patientCondition] ?? details.patientCondition : null;
  const budget = details.budgetRange ? BUDGET_LABELS[details.budgetRange] ?? details.budgetRange : null;
  const skills = details.requiredSkills ?? [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Booking details</Text>
      <View style={styles.section}>
        {condition && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Patient condition</Text>
            <Text style={styles.fieldValue}>{condition}</Text>
          </View>
        )}
        {skills.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Skills needed</Text>
            <View style={styles.chipRow}>
              {skills.map((skill) => (
                <Badge key={skill} color="neutral" label={skill} />
              ))}
            </View>
          </View>
        )}
        {budget && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Budget</Text>
            <Text style={styles.fieldValue}>{budget}</Text>
          </View>
        )}
        {details.additionalInstructions && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Additional notes</Text>
            <Text style={styles.fieldValue}>{details.additionalInstructions}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  title: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xxs,
  },
  fieldLabel: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
});
