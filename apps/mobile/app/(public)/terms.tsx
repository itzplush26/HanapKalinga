import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Terms of Service',
          headerTitleStyle: {
            fontFamily: typography.fontFamily.bodySemiBold,
            fontSize: typography.size.titleSm,
            color: colors.ink,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={{ padding: spacing.xs }}
            >
              <ChevronLeft size={24} color={colors.ink} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <Text style={styles.paragraph}>
          Welcome to HanapKalinga. By using our platform, you agree to these terms of service. Please read them carefully.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using HanapKalinga, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          HanapKalinga is a platform that connects families seeking nursing and caregiving services with qualified healthcare providers. We facilitate the discovery and booking process but are not a direct provider of medical services.
        </Text>

        <Text style={styles.heading}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate and complete information during registration.
        </Text>

        <Text style={styles.heading}>4. Provider Verification</Text>
        <Text style={styles.paragraph}>
          HanapKalinga performs verification checks on healthcare providers, including license and document verification. However, we do not guarantee the accuracy or completeness of provider information. Families should exercise due diligence when selecting a provider.
        </Text>

        <Text style={styles.heading}>5. Booking and Payments</Text>
        <Text style={styles.paragraph}>
          Bookings created through the platform are agreements between families and providers. HanapKalinga facilitates communication but is not responsible for the fulfillment of bookings. Payment terms are agreed upon directly between parties.
        </Text>

        <Text style={styles.heading}>6. Prohibited Conduct</Text>
        <Text style={styles.paragraph}>
          Users agree not to: misuse the platform, provide false information, harass other users, circumvent verification processes, or use the platform for any unlawful purpose.
        </Text>

        <Text style={styles.heading}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          HanapKalinga shall not be liable for any indirect, incidental, or consequential damages arising from the use of the platform. The platform is provided "as is" without warranties of any kind.
        </Text>

        <Text style={styles.heading}>8. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Users will be notified of material changes via email or platform notification. Continued use after changes constitutes acceptance.
        </Text>

        <Text style={styles.heading}>9. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, please contact us at support@hanapkalinga.ph.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  lastUpdated: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
