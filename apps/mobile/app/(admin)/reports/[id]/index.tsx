import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../src/lib/supabase';
import { useAdminReports } from '../../../../src/lib/hooks/useAdminReports';
import { ScreenWrapper } from '../../../../src/components/ScreenWrapper';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../../src/components/domain/EmptyState';
import { colors } from '../../../../src/theme/colors';
import { spacing } from '../../../../src/theme/spacing';
import { rounded } from '../../../../src/theme/rounded';
import { typography } from '../../../../src/theme/typography';
import type { IncidentReport, IncidentReportStatus } from '@hanapkalinga/shared/types';

const STATUS_COLORS: Record<string, 'success' | 'pending' | 'error' | 'info' | 'neutral'> = {
  pending: 'pending',
  reviewed: 'info',
  resolved: 'success',
};

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateStatus } = useAdminReports();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [reporterName, setReporterName] = useState<string | null>(null);
  const [reportedName, setReportedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: reportRow, error: reportError } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (reportError || !reportRow) {
        setLoading(false);
        return;
      }

      const r = reportRow as unknown as IncidentReport;
      setReport(r);

      const [{ data: rep }, { data: repd }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', r.reporter_id).single(),
        supabase.from('profiles').select('full_name').eq('id', r.reported_user_id).single(),
      ]);

      setReporterName((rep as { full_name: string | null } | null)?.full_name ?? null);
      setReportedName((repd as { full_name: string | null } | null)?.full_name ?? null);
      setLoading(false);
    })();
  }, [id]);

  const handleUpdateStatus = (newStatus: IncidentReportStatus) => {
    if (!report) return;
    const label = newStatus === 'reviewed' ? 'Mark under review' : newStatus === 'resolved' ? 'Resolve' : 'Dismiss';
    Alert.alert(
      label,
      `Are you sure you want to mark this report as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          onPress: async () => {
            const result = await updateStatus(report.id, newStatus);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              setReport({ ...report, status: newStatus });
              Alert.alert('Updated', `Report marked as "${newStatus}".`);
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
        </View>
      </ScreenWrapper>
    );
  }

  if (!report) {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Report not found"
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const statusColor = STATUS_COLORS[report.status] ?? 'neutral';

  return (
    <ScreenWrapper scroll>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{report.category}</Text>
          <Badge color={statusColor} label={report.status} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporter</Text>
          <Text style={styles.nameText}>{reporterName ?? 'Unknown'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported User</Text>
          <Text style={styles.nameText}>{reportedName ?? 'Unknown'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        {report.created_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Reported</Text>
            <Text style={styles.dateText}>
              {new Date(report.created_at).toLocaleDateString('en-PH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {report.status !== 'resolved' && (
          <View style={styles.actions}>
            {report.status === 'pending' && (
              <Button
                variant="primary"
                onPress={() => handleUpdateStatus('reviewed')}
                style={styles.actionButton}
              >
                Mark Under Review
              </Button>
            )}
            {report.status === 'reviewed' && (
              <Button
                variant="primary"
                onPress={() => handleUpdateStatus('resolved')}
                style={styles.actionButton}
              >
                Resolve
              </Button>
            )}
            <Button
              variant="secondary"
              onPress={() => handleUpdateStatus('resolved')}
              style={styles.actionButton}
            >
              Dismiss
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.ink,
  },
  description: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    lineHeight: 22,
  },
  dateText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});
