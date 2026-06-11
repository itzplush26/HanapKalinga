import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';

type Role = 'family' | 'nurse' | null;

const roleOptions: { value: 'family' | 'nurse'; title: string; description: string }[] = [
  {
    value: 'family',
    title: 'I am a family member',
    description: 'Looking for a nurse or caregiver for a loved one',
  },
  {
    value: 'nurse',
    title: 'I am a nurse or caregiver',
    description: 'Looking to offer my care services',
  },
];

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { email, role: preselectedRole } = useLocalSearchParams<{ email: string; role?: string }>();
  const [selectedRole, setSelectedRole] = useState<Role>(preselectedRole as Role || null);

  const handleContinue = () => {
    if (!selectedRole || !email) return;
    router.push(
      `/(auth)/register/profile?email=${encodeURIComponent(email)}&role=${selectedRole}`
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>
            Choose how you want to use {''}HanapKalinga
          </Text>
        </View>

        <View style={styles.options}>
          {roleOptions.map((option) => {
            const isSelected = selectedRole === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedRole(option.value)}
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                ]}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.title}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={colors.canvas} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            onPress={handleContinue}
            disabled={!selectedRole}
            style={styles.button}
          >
            Continue
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: rounded.md,
    padding: spacing.lg,
    borderWidth: 2,
  },
  cardSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  cardUnselected: {
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  cardTitleSelected: {
    color: colors.brand[600],
  },
  cardDescription: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  cardDescriptionSelected: {
    color: colors.body,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    marginTop: spacing.lg,
  },
});
