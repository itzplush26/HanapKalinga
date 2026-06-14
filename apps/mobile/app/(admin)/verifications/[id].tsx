import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, XCircle, FileText, Clock, Info, RefreshCw } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { Separator } from '../../../src/components/ui/Separator';
import { useVerificationDetail } from '../../../src/lib/hooks/useVerificationDetail';
import { supabase } from '../../../src/lib/supabase';
import { getStatusColor, getInitials } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';
import type { VerificationStatus } from '@hanapkalinga/shared/types';

export default function VerificationReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, refetch } = useVerificationDetail(id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [showResubmissionInput, setShowResubmissionInput] = useState(false);

  const handleAction = useCallback(
    async (
      action: string,
      newStatus: VerificationStatus,
      reason?: string,
      notes?: string
    ) => {
      if (!id) return;
      setActionLoading(action);
      try {
        const prevStatus = data?.nurse?.verification_status ?? 'pending';

        const { error: updateError }: any = await (supabase as any)
          .from('nurses')
          .update({
            verification_status: newStatus,
            rejection_reason: reason ?? null,
          })
          .eq('id', id);

        if (updateError) {
          Alert.alert('Error', updateError.message);
          return;
        }

        const { error: auditError }: any = await (supabase as any)
          .from('verification_audit_logs')
          .insert({
            nurse_id: id,
            admin_id: data?.profile?.id ?? '',
            action,
            previous_status: prevStatus,
            new_status: newStatus,
            rejection_reason: reason ?? null,
            review_notes: notes ?? null,
          });

        if (auditError) {
          Alert.alert('Error', auditError.message);
          return;
        }

        const { error: notifError }: any = await (supabase as any)
          .from('notifications')
          .insert({
            user_id: id,
            type: 'verification_update',
            title: 'Verification status updated',
            body: `Your verification status has been updated to ${newStatus.replace(/_/g, ' ')}.`,
            metadata: { verification_status: newStatus },
          });

        if (notifError) {
          console.error('Failed to create notification', notifError);
        }

        Alert.alert('Success', `Verification ${action} completed.`);
        setShowRejectionInput(false);
        setShowResubmissionInput(false);
        setRejectionReason('');
        setReviewNotes('');
        refetch();
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Action failed');
      } finally {
        setActionLoading(null);
      }
    },
    [id, data, refetch]
  );

  const confirmApprove = useCallback(() => {
    Alert.alert('Approve verification', 'Are you sure you want to approve this applicant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => handleAction('approved', 'verified'),
      },
    ]);
  }, [handleAction]);

  const confirmReject = useCallback(() => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    Alert.alert('Reject verification', 'Are you sure? This will notify the applicant.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () =>
          handleAction('rejected', 'rejected', rejectionReason.trim(), reviewNotes.trim() || undefined),
      },
    ]);
  }, [rejectionReason, reviewNotes, handleAction]);

  const confirmResubmission = useCallback(() => {
    if (!reviewNotes.trim()) {
      Alert.alert('Required', 'Please enter review notes for the applicant.');
      return;
    }
    Alert.alert('Request resubmission', 'Applicant will be notified to resubmit documents.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: () =>
          handleAction('resubmission_requested', 'resubmission_required', undefined, reviewNotes.trim()),
      },
    ]);
  }, [reviewNotes, handleAction]);

  const confirmUnderReview = useCallback(() => {
    Alert.alert('Mark under review', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark',
        onPress: () => handleAction('marked_under_review', 'under_review'),
      },
    ]);
  }, [handleAction]);

  const openDocumentUrl = useCallback((url: string | null | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  }, []);

  if (loading) {
    return (
      <ScreenWrapper scroll>
        <View style={styles.loadingContainer}>
          <Skeleton variant="rectangle" height={200} />
          <Skeleton variant="rectangle" height={150} style={{ marginTop: spacing.md }} />
          <Skeleton variant="rectangle" height={100} style={{ marginTop: spacing.md }} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="secondary" onPress={refetch}>
            Retry
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  if (!data?.nurse) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Applicant not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const nurse = data.nurse as unknown as Record<string, any>;
  const profile = data.profile;
  const statusColor = getStatusColor(nurse.verification_status as VerificationStatus);

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <Card variant="default" title="Applicant info">
          <View style={styles.applicantHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.full_name ?? 'A')}
              </Text>
            </View>
            <View style={styles.applicantDetails}>
              <Text style={styles.applicantName}>
                {profile?.full_name ?? 'Applicant'}
              </Text>
              <Badge color={statusColor} label={nurse.verification_status.replace(/_/g, ' ')} />
            </View>
          </View>
          <Separator style={{ marginVertical: spacing.sm }} />
          <View style={styles.detailRows}>
            {profile?.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{profile.phone}</Text>
              </View>
            )}
            {profile?.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{profile.address}</Text>
              </View>
            )}
            {profile?.city && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {[profile.city, profile.region].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider type</Text>
              <Text style={styles.detailValue}>
                {nurse.provider_type === 'caregiver' ? 'Caregiver' : 'Nurse'}
              </Text>
            </View>
            {nurse.specializations && nurse.specializations.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Specializations</Text>
                <View style={styles.chipRow}>
                  {nurse.specializations.map((s: string) => (
                    <Badge key={s} color="neutral" label={s} />
                  ))}
                </View>
              </View>
            )}
            {nurse.submitted_at && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted</Text>
                <Text style={styles.detailValue}>
                  {new Date(nurse.submitted_at).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Card variant="default" title="Documents" style={{ marginTop: spacing.md }}>
          <View style={styles.documentList}>
            <TouchableOpacity
              style={styles.documentRow}
              onPress={() => openDocumentUrl(nurse.prc_document_url)}
              accessibilityRole="button"
              accessibilityLabel="View PRC document"
            >
              <FileText size={20} color={colors.brand[600]} />
              <Text style={styles.documentLabel}>PRC / TESDA Certificate</Text>
              <Text style={styles.documentAction}>
                {nurse.prc_document_url ? 'View' : 'Not uploaded'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.documentRow}
              onPress={() => openDocumentUrl(nurse.nbi_document_url)}
              accessibilityRole="button"
              accessibilityLabel="View NBI clearance"
            >
              <FileText size={20} color={colors.brand[600]} />
              <Text style={styles.documentLabel}>NBI Clearance</Text>
              <Text style={styles.documentAction}>
                {nurse.nbi_document_url ? 'View' : 'Not uploaded'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {data.auditLogs.length > 0 && (
          <Card variant="default" title="Audit log" style={{ marginTop: spacing.md }}>
            {data.auditLogs.map((log, index) => (
              <View key={log.id}>
                {index > 0 && <Separator />}
                <View style={styles.auditRow}>
                  <View style={styles.auditIcon}>
                    <Clock size={16} color={colors.muted} />
                  </View>
                  <View style={styles.auditContent}>
                    <Text style={styles.auditAction}>
                      {log.action.replace(/_/g, ' ')} by {log.admin_name}
                    </Text>
                    <Text style={styles.auditStatus}>
                      {log.previous_status ?? '—'} → {log.new_status}
                    </Text>
                    {log.review_notes && (
                      <Text style={styles.auditNotes}>{log.review_notes}</Text>
                    )}
                    <Text style={styles.auditDate}>
                      {new Date(log.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card variant="default" title="Actions" style={{ marginTop: spacing.md }}>
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              onPress={confirmApprove}
              loading={actionLoading === 'approved'}
              disabled={actionLoading !== null}
            >
              Approve
            </Button>

            <Button
              variant="secondary"
              onPress={() => {
                setShowRejectionInput(true);
                setShowResubmissionInput(false);
              }}
              loading={actionLoading === 'rejected'}
              disabled={actionLoading !== null}
              style={styles.rejectButton}
            >
              Reject
            </Button>

            {showRejectionInput && (
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Rejection reason (required)"
                  placeholderTextColor={colors.muted}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  accessibilityLabel="Rejection reason"
                />
                <TextInput
                  style={styles.textArea}
                  placeholder="Review notes (optional)"
                  placeholderTextColor={colors.muted}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  accessibilityLabel="Review notes"
                />
                <View style={styles.inputActions}>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setShowRejectionInput(false);
                      setRejectionReason('');
                      setReviewNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onPress={confirmReject}>
                    Confirm Reject
                  </Button>
                </View>
              </View>
            )}

            <Button
              variant="ghost"
              onPress={() => {
                setShowResubmissionInput(true);
                setShowRejectionInput(false);
              }}
              loading={actionLoading === 'resubmission_requested'}
              disabled={actionLoading !== null}
            >
              Request Resubmission
            </Button>

            {showResubmissionInput && (
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Review notes for applicant (required)"
                  placeholderTextColor={colors.muted}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  accessibilityLabel="Review notes for resubmission"
                />
                <View style={styles.inputActions}>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setShowResubmissionInput(false);
                      setReviewNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onPress={confirmResubmission}>
                    Confirm
                  </Button>
                </View>
              </View>
            )}

            <Button
              variant="ghost"
              onPress={confirmUnderReview}
              loading={actionLoading === 'marked_under_review'}
              disabled={actionLoading !== null}
            >
              Mark Under Review
            </Button>
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  applicantDetails: {
    flex: 1,
    gap: spacing.xxs,
  },
  applicantName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  detailRows: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 100,
  },
  detailValue: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    flex: 1,
    textAlign: 'right',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  documentList: {
    gap: spacing.sm,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  documentLabel: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    flex: 1,
  },
  documentAction: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.semantic.link,
  },
  auditRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  auditIcon: {
    paddingTop: 2,
  },
  auditContent: {
    flex: 1,
    gap: 2,
  },
  auditAction: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  auditStatus: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  auditNotes: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    fontStyle: 'italic',
  },
  auditDate: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  rejectButton: {
    borderColor: colors.semantic.error,
  },
  inputSection: {
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface.soft,
    borderRadius: rounded.md,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
