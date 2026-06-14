import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Star, ChevronLeft } from 'lucide-react-native';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Chip } from '../../../src/components/ui/Chip';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { Separator } from '../../../src/components/ui/Separator';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { useNurseDetail } from '../../../src/lib/hooks/useNurseDetail';
import { getInitials, getStatusColor } from '../../../src/lib/helpers';
import type { Shift } from '@hanapkalinga/shared/types';

const SHIFTS: Shift[] = ['morning', 'afternoon', 'evening'];
const SHIFT_LABELS: Record<Shift, string> = {
  morning: 'AM',
  afternoon: 'PM',
  evening: 'Eve',
  full_day: 'Full',
  custom: 'Custom',
};

function formatAvailDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}\n${d.getDate()}`;
}

export default function NurseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, refetch } = useNurseDetail(id ?? '');

  const availabilityMap = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<string, boolean>> = {};
    for (const slot of data.availability) {
      if (!map[slot.date]) map[slot.date] = {};
      map[slot.date][slot.shift] = slot.is_open;
    }
    return map;
  }, [data]);

  const uniqueDates = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.availability.filter((s) => {
      if (seen.has(s.date)) return false;
      seen.add(s.date);
      return true;
    });
  }, [data]);

  const handleMapLink = () => {
    const location = data?.profile.city ?? 'Philippines';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(location)}`,
      android: `geo:0,0?q=${encodeURIComponent(location)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(location)}`,
    });
    Linking.openURL(url);
  };

  const handleRequestBooking = () => {
    if (!id) return;
    router.push(`/(family)/bookings/new?nurseId=${id}`);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={{ headerShown: true, title: 'Loading...' }} />
        <ScrollView style={styles.skeletonContainer}>
          <View style={styles.skeletonProfile}>
            <Skeleton variant="circle" width={80} height={80} />
            <Skeleton variant="text" style={{ width: '50%' }} />
            <Skeleton variant="text" style={{ width: '30%' }} />
          </View>
          <Skeleton variant="rectangle" style={{ height: 100 }} />
          <Skeleton variant="rectangle" style={{ height: 60 }} />
          <Skeleton variant="rectangle" style={{ height: 200 }} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={{ headerShown: true, title: 'Error' }} />
        <EmptyState
          title="Failed to load profile"
          subtitle={error}
          actionLabel="Try Again"
          onAction={refetch}
        />
      </ScreenWrapper>
    );
  }

  if (!data) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={{ headerShown: true, title: 'Not Found' }} />
        <EmptyState title="Nurse not found" subtitle="This profile may have been removed." />
      </ScreenWrapper>
    );
  }

  const { profile, nurse, reviews } = data;
  const initials = getInitials(profile.full_name ?? 'Nurse');
  const statusColor = getStatusColor(nurse.verification_status);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <ScreenWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          title: profile.full_name ?? 'Nurse Profile',
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
        <View style={styles.profileHeader}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName} testID="nurseDetail_text_name">{profile.full_name ?? 'Unknown'}</Text>
          <TouchableOpacity onPress={handleMapLink} style={styles.locationRow} accessibilityRole="button" accessibilityLabel={`Open map for ${profile.city}`}>
            <MapPin size={16} color={colors.brand[600]} />
            <Text style={styles.cityText}>{profile.city ?? 'Unknown location'}</Text>
          </TouchableOpacity>
          <View style={styles.statusRow}>
            <Badge color={statusColor} label={nurse.verification_status.replace('_', ' ')} />
            {avgRating && (
              <View style={styles.ratingRow}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>{avgRating} ({reviews.length})</Text>
              </View>
            )}
          </View>
        </View>

        {nurse.specializations && nurse.specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.chipRow}>
              {nurse.specializations.map((spec) => (
                <Chip key={spec} label={spec} selected style={styles.chip} />
              ))}
            </View>
          </View>
        )}

        <Separator />

        {nurse.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{nurse.bio}</Text>
          </View>
        )}

        <Separator />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rates</Text>
          <View style={styles.rateGrid}>
            <Card variant="default" roundedSize="md" style={styles.rateCard}>
              <Text style={styles.rateLabel}>Hourly Rate</Text>
              <Text style={styles.rateValue} testID="nurseDetail_text_rate">
                {nurse.hourly_rate ? `P${nurse.hourly_rate}/hr` : 'Not set'}
              </Text>
            </Card>
            <Card variant="default" roundedSize="md" style={styles.rateCard}>
              <Text style={styles.rateLabel}>Daily Rate (12hr)</Text>
              <Text style={styles.rateValue} testID="nurseDetail_text_rate">
                {nurse.daily_rate_12hr ? `P${nurse.daily_rate_12hr.toLocaleString('en-PH')}/day` : 'Not set'}
              </Text>
            </Card>
          </View>
        </View>

        <Separator />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability (Next 7 Days)</Text>
          {uniqueDates.length === 0 ? (
            <Text style={styles.noDataText}>No availability set for this period.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.availScroll}>
              <View style={styles.availGrid}>
                <View style={styles.availHeader}>
                  <View style={styles.availShiftCell}><Text style={styles.availShiftLabel} /></View>
                  {uniqueDates.slice(0, 7).map((slot) => (
                    <View key={slot.date} style={styles.availDateCell}>
                      <Text style={styles.availDateText}>{formatAvailDate(slot.date)}</Text>
                    </View>
                  ))}
                </View>
                {SHIFTS.map((shift) => (
                  <View key={shift} style={styles.availRow}>
                    <View style={styles.availShiftCell}>
                      <Text style={styles.availShiftLabel}>{SHIFT_LABELS[shift]}</Text>
                    </View>
                    {uniqueDates.slice(0, 7).map((slot) => {
                      const isOpen = availabilityMap[slot.date]?.[shift] ?? false;
                      return (
                        <View
                          key={`${slot.date}-${shift}`}
                          style={[
                            styles.availCell,
                            isOpen ? styles.availOpen : styles.availClosed,
                          ]}
                        >
                          <Text style={[styles.availCellText, isOpen ? styles.availOpenText : styles.availClosedText]}>
                            {isOpen ? '\u2713' : '\u2014'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <Separator />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews {avgRating ? `(${avgRating} avg)` : ''}
          </Text>
          {reviews.length === 0 ? (
            <Text style={styles.noDataText}>No reviews yet.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        color={star <= review.rating ? '#f59e0b' : colors.hairline}
                        fill={star <= review.rating ? '#f59e0b' : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button variant="primary" onPress={handleRequestBooking} style={styles.bookButton} testID="nurseDetail_button_requestBooking">
          Request Booking
        </Button>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonProfile: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  largeAvatarText: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  fullName: {
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  cityText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.brand[600],
    textDecorationLine: 'underline',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  chip: {
    marginBottom: spacing.xxs,
  },
  bioText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    lineHeight: 22,
  },
  rateGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  rateLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  rateValue: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[600],
  },
  availScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  availGrid: {
    gap: 2,
  },
  availHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availShiftCell: {
    width: 36,
    alignItems: 'center',
  },
  availShiftLabel: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
  },
  availDateCell: {
    width: 44,
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  availDateText: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
    textAlign: 'center',
    lineHeight: 14,
  },
  availCell: {
    width: 44,
    height: 32,
    borderRadius: rounded.xs,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  availOpen: {
    backgroundColor: '#d1fae5',
  },
  availClosed: {
    backgroundColor: colors.surface.strong,
  },
  availCellText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  availOpenText: {
    color: '#065f46',
  },
  availClosedText: {
    color: colors.muted,
  },
  noDataText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: colors.surface.soft,
    borderRadius: rounded.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  reviewComment: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    lineHeight: 20,
  },
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  bookButton: {
    width: '100%',
  },
});
