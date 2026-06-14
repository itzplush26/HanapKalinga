import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useFamilyBookings } from '../../src/lib/hooks/useFamilyBookings';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { BookingCard } from '../../src/components/BookingCard';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

const WELCOME_BANNER_KEY = '@hanapkalinga/welcome_banner_dismissed';

export default function FamilyDashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
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
          <View style={[styles.welcomeBanner, { backgroundColor: colors.primary }]}>
            <View style={styles.welcomeContent}>
              <Heart size={24} color={colors['on-primary']} />
              <View style={styles.welcomeText}>
                <Text style={[styles.welcomeTitle, { color: colors['on-primary'] }]}>
                  Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: colors['on-primary'] }]}>
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
              <Text style={{ color: colors['on-primary'], textDecorationLine: 'underline', fontSize: 14, fontFamily: typography.fontFamily.bodyMedium }}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Card style={styles.promoCard}>
          <Text style={[styles.promoTitle, { color: colors['text-primary'] }]}>
            Find a nurse or caregiver
          </Text>
          <Text style={[styles.promoSubtitle, { color: colors['text-secondary'] }]}>
            Browse verified professionals near you
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(family)/browse')}
            style={styles.promoButton}
            accessibilityRole="button"
            accessibilityLabel="Browse nurses"
          >
            <Text style={[styles.promoButtonText, { color: colors.primary }]}>
              Browse now
            </Text>
            <ArrowRight size={18} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors['text-primary'] }]}>
              Recent bookings
            </Text>
            {bookings.length > 3 && (
              <TextLink onPress={() => router.push('/(family)/bookings')}>
                View all
              </TextLink>
            )}
          </View>
          {loading ? (
            <View style={styles.skeletonRow}>
              <Skeleton height={80} />
              <Skeleton height={80} />
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
            <Card>
              <Text style={[styles.emptyText, { color: colors['text-muted'] }]}>
                No bookings yet. Find a nurse to get started.
              </Text>
            </Card>
          )}
        </View>

        <Button
          variant="default"
          onPress={() => router.push('/(family)/browse')}
        >
          Request a booking
        </Button>

        {user && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors['text-primary'] }]}>
              Notifications
            </Text>
            <NotificationsPanel userId={user.id} maxItems={5} showMarkAllRead={false} />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    gap: spacing[4],
  },
  welcomeBanner: {
    borderRadius: rounded.lg,
    padding: spacing[4],
  },
  welcomeContent: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  welcomeSubtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    marginTop: spacing[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  promoCard: {
    padding: spacing[6],
  },
  promoTitle: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  promoSubtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    marginTop: spacing[1],
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    minHeight: 44,
  },
  promoButtonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bodySemiBold,
    textDecorationLine: 'underline',
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  skeletonRow: {
    gap: spacing[3],
  },
  emptyText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
  },
});
