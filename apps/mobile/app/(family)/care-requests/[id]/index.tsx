import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Briefcase, Wallet, Calendar, Edit3, Trash2 } from 'lucide-react-native';
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

export default function FamilyCareRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { careRequest, applications, loading, error, refetch } = useCareRequestDetail(id);

  const handleDelete = () => {
    Alert.alert(
      'Delete Care Request',
      'Are you sure you want to delete this care request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await (supabase
                .from('care_requests') as any)
                .update({ status: 'cancelled' })
                .eq('id', id);

              if (deleteError) {
                Alert.alert('Error', deleteError.message);
                return;
              }
              router.back();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete care request');
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
  const isOwn = careRequest.family_id === user?.id;

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Applications ({applications.length})
          </Text>
          {applications.length === 0 ? (
            <Text style={styles.emptyText}>No applications yet.</Text>
          ) : (
            applications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <Text style={styles.applicantName}>
                  {app.nurse?.full_name ?? 'Unknown Nurse'}
                </Text>
                {app.nurse?.city && (
                  <Text style={styles.applicantCity}>{app.nurse.city}</Text>
                )}
                <Badge color={app.status === 'pending' ? 'pending' : 'info'} label={app.status} />
              </View>
            ))
          )}
        </View>

        {isOwn && careRequest.status === 'open' && (
          <View style={styles.actions}>
            <Button
              variant="secondary"
              onPress={() => router.push(`/(family)/care-requests/${id}/edit`)}
              style={styles.actionButton}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
            >
              Delete
            </Button>
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
  emptyText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    fontStyle: 'italic',
  },
  applicationCard: {
    backgroundColor: colors.surface.strong,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  applicantName: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.ink,
  },
  applicantCity: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.semantic.error,
  },
});
