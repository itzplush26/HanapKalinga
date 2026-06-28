import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Button } from './ui/Button';

const DEFAULT_REASONS = [
  'Schedule conflict',
  'Change in care needs',
  'Found alternative care',
  'Personal reasons',
  'Other',
];

interface CancelBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  reasons?: string[];
  loading?: boolean;
}

export function CancelBookingModal({
  visible,
  onClose,
  onConfirm,
  reasons = DEFAULT_REASONS,
  loading = false,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  const canSubmit = selectedReason && (selectedReason !== 'Other' || customReason.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Cancel Booking</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <X size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Please select a reason for cancelling:</Text>

          <View style={styles.reasonsList}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => {
                  setSelectedReason(reason);
                  if (reason !== 'Other') setCustomReason('');
                }}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedReason === reason }}
              >
                <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>
                  {selectedReason === reason && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Other' && (
            <TextInput
              style={styles.input}
              placeholder="Describe your reason..."
              placeholderTextColor={colors.muted}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={3}
              accessibilityLabel="Custom reason"
            />
          )}

          <View style={styles.actions}>
            <Button variant="secondary" onPress={onClose} style={styles.actionButton}>
              Keep Booking
            </Button>
            <Button
              variant="primary"
              onPress={handleConfirm}
              disabled={!canSubmit}
              loading={loading}
              style={styles.actionButton}
            >
              Confirm Cancellation
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: rounded.lg,
    borderTopRightRadius: rounded.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  reasonsList: {
    gap: spacing.xs,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: rounded.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  reasonItemSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: rounded.full,
    borderWidth: 2,
    borderColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.brand[600],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[600],
  },
  reasonText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    flex: 1,
  },
  reasonTextSelected: {
    color: colors.ink,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  input: {
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
