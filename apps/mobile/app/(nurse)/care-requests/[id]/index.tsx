import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Briefcase, Wallet, Calendar } from 'lucide-react-native';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useCareRequestDetail } from '../../../../src/lib/hooks/useCareRequestDetail';
import { ScreenWrapper } from '../../../../src/components/ScreenWrapper';
import { Badge } from '../../../../src/components/ui/Badge';
import { Chip } from '../../../../src/components/ui/Chip';
import { Button } from '../../../../src/components/ui/Button';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../../src/components/domain/EmptyState';
import { colors } from '../../../../src/theme/colors';
import { spacing } from '../../../../src/theme/spacing';
import { rounded } from '../../../../src/theme/rounded';
import { typography } from '../../../../src/theme/typography';

const STATUS_COLORS: Record<string, 'success' | 'pending' | 'error' | 'info' | 'neutral'> = {
  open: 'success',
  filled: 'info',
  cancelled: 'error',
};

export default function NurseCareRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { careRequest, applications, loading, error, refetch } = useCareRequestDetail(id);
  const [applying, setApplying] = useState(false);

  const userApplication = applications
    ? applications.find((a) => a.nurse_id === user?.id)
    : null;
  const hasApplied = !!userApplication;

  const handleApply = () => {
    if (!user?.id || !id) return;

    Alert.alert(
      'Apply for this request',
      'Send your application to the family for this care request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(true);
            try {
              const { error: insertError } = await (supabase
                .from('care_request_applications') as any)
                .insert({
                  care_request_id: id,
                  nurse_id: user.id,
                });

              if (insertError) {
                Alert.alert('Error', insertError.message);
                return;
              }

              Alert.alert('Applied!', 'Your application has been submitted.', [
                { text: 'OK', onPress: () => refetch() },
              ]);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to apply');
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="rectangle" height={200} />
          <Skeleton variant="rectangle" height={60} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !careRequest) {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Something went wrong"
          subtitle={error ?? 'Care request not found'}
          actionLabel="Try again"
          onAction={refetch}
        />
      </ScreenWrapper>
    );
  }

  const statusColor = STATUS_COLORS[careRequest.status] ?? 'neutral';

  return (
    <ScreenWrapper scroll>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{careRequest.title}</Text>
            <Badge color={statusColor} label={careRequest.status} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.muted} />
            <Text style={styles.detailText}>
              {careRequest.city}, {careRequest.region}
              {careRequest.barangay ? ` - ${careRequest.barangay}` : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Briefcase size={16} color={colors.muted} />
            <Text style={styles.detailText}>{careRequest.care_type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Wallet size={16} color={colors.muted} />
            <Text style={styles.detailText}>
              {careRequest.budget_band.replace(/_/g, ' ').replace(/(\d+)_(\d+)/, '₱$1 - ₱$2')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.muted} />
            <Text style={styles.detailText}>{careRequest.start_date}</Text>
          </View>
        </View>

        {careRequest.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{careRequest.description}</Text>
          </View>
        )}

        {careRequest.required_specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Specializations</Text>
            <View style={styles.chipRow}>
              {careRequest.required_specializations.map((spec) => (
                <Chip key={spec} label={spec} selected />
              ))}
            </View>
          </View>
        )}

        {careRequest.status === 'open' && (
          <View style={styles.applySection}>
            {hasApplied ? (
              <View style={styles.appliedBanner}>
                <Text style={styles.appliedText}>You have applied for this request.</Text>
                <Badge color="info" label={userApplication?.status ?? 'Applied'} />
              </View>
            ) : (
              <Button
                variant="primary"
                onPress={handleApply}
                loading={applying}
              >
                Apply for this Request
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    flex: 1,
  },
  description: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  applySection: {
    marginTop: spacing.md,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand[50],
    borderRadius: rounded.sm,
    padding: spacing.md,
  },
  appliedText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.brand[700],
    flex: 1,
  },
});
