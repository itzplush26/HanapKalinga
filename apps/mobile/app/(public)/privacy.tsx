import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
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
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <Text style={styles.paragraph}>
          HanapKalinga ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly, including: name, email address, phone number, address, professional credentials, and documents submitted for verification. We also collect usage data such as app interactions, booking history, and communications.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to: provide and improve our services, verify provider credentials, facilitate bookings and communications, send notifications, and comply with legal obligations.
        </Text>

        <Text style={styles.heading}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We share information only as necessary for platform operations: providers see family contact details after booking acceptance; families see provider profiles and verification status. We do not sell personal information to third parties.
        </Text>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your data, including encryption in transit and at rest, access controls, and regular security audits.
        </Text>

        <Text style={styles.heading}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your information for as long as your account is active and as needed to provide services. You may request deletion of your account and associated data by contacting support.
        </Text>

        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, correct, or delete your personal information. You may also request a copy of your data or restrict processing. To exercise these rights, contact us at support@hanapkalinga.com.
        </Text>

        <Text style={styles.heading}>7. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          We use essential cookies for authentication and platform functionality. Analytics tools may collect anonymous usage data to help us improve the platform.
        </Text>

        <Text style={styles.heading}>8. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify users of material changes via email or in-app notification.
        </Text>

        <Text style={styles.heading}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          For questions about this Privacy Policy, please contact us at support@hanapkalinga.com.
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
