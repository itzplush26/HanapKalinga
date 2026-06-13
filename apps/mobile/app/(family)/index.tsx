import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFamilyBookings } from '../../src/lib/hooks/useFamilyBookings';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { BookingCard } from '../../src/components/BookingCard';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

const WELCOME_BANNER_KEY = '@hanapkalinga/welcome_banner_dismissed';

export default function FamilyDashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { bookings, loading } = useFamilyBookings(user?.id);

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_BANNER_KEY).then((value) => {
      if (value !== 'true') setShowWelcome(true);
    });
  }, []);

  const dismissWelcome = useCallback(async () => {
    setShowWelcome(false);
    await AsyncStorage.setItem(WELCOME_BANNER_KEY, 'true');
  }, []);

  const recentBookings = bookings.slice(0, 3);

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        {showWelcome && (
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeContent}>
              <Heart size={24} color={colors.canvas} />
              <View style={styles.welcomeText}>
                <Text style={styles.welcomeTitle}>
                  Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Find the right care for your loved ones.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={dismissWelcome}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss welcome banner"
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <Card variant="signature" roundedSize="lg" style={styles.promoCard}>
          <Text style={styles.promoTitle}>Find a nurse or caregiver</Text>
          <Text style={styles.promoSubtitle}>
            Browse verified professionals near you
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(family)/browse')}
            style={styles.promoButton}
            accessibilityRole="button"
            accessibilityLabel="Browse nurses"
          >
            <Text style={styles.promoButtonText}>Browse now</Text>
            <ArrowRight size={18} color={colors.canvas} />
          </TouchableOpacity>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent bookings</Text>
            {bookings.length > 3 && (
              <TextLink onPress={() => router.push('/(family)/bookings')}>
                View all
              </TextLink>
            )}
          </View>
          {loading ? (
            <View style={styles.skeletonRow}>
              <Skeleton variant="rectangle" height={80} />
              <Skeleton variant="rectangle" height={80} />
            </View>
          ) : recentBookings.length > 0 ? (
            <FlatList
              data={recentBookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  onPress={() => router.push(`/(family)/bookings/${item.id}`)}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Card variant="cream" roundedSize="md">
              <Text style={styles.emptyText}>
                No bookings yet. Find a nurse to get started.
              </Text>
            </Card>
          )}
        </View>

        <Button
          variant="primary"
          onPress={() => router.push('/(family)/browse')}
        >
          Request a booking
        </Button>

        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <NotificationsPanel userId={user.id} maxItems={5} showMarkAllRead={false} />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  welcomeBanner: {
    backgroundColor: colors.brand[600],
    borderRadius: rounded.lg,
    padding: spacing.md,
  },
  welcomeContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.canvas,
  },
  welcomeSubtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
  },
  promoCard: {
    padding: spacing.lg,
  },
  promoTitle: {
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.display,
    color: colors.canvas,
  },
  promoSubtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xxs,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 44,
  },
  promoButtonText: {
    fontSize: typography.size.button,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.canvas,
    textDecorationLine: 'underline',
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  skeletonRow: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
