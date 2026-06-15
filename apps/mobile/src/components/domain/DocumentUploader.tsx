import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface DocumentUploaderProps {
  label: string;
  onFileSelect: (file: { uri: string; name: string; size: number; mimeType: string } | null) => void;
  selectedFile?: { uri: string; name: string; size: number; mimeType: string } | null;
  accept?: string[];
  loading?: boolean;
}

export function DocumentUploader({
  label,
  onFileSelect,
  selectedFile,
  accept,
  loading = false,
}: DocumentUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept ?? ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      if (file.size && file.size > MAX_FILE_SIZE) {
        setError('File exceeds 5MB limit. Please select a smaller file.');
        return;
      }

      onFileSelect({
        uri: file.uri,
        name: file.name,
        size: file.size ?? 0,
        mimeType: file.mimeType ?? 'application/octet-stream',
      });
    } catch {
      setError('Failed to pick document. Please try again.');
    }
  };

  const handleRemove = () => {
    setError(null);
    onFileSelect(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {selectedFile ? (
        <View style={styles.fileCard}>
          <FileText size={20} color={colors.brand[600]} />
          <Text style={styles.fileName} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            accessibilityLabel={`Remove ${selectedFile.name}`}
            accessibilityRole="button"
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePick}
          disabled={loading}
          style={[styles.uploadZone, loading && styles.uploadZoneDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Upload ${label}`}
        >
          {loading ? (
            <Text style={styles.uploadText}>Uploading...</Text>
          ) : (
            <>
              <Upload size={20} color={colors.brand[600]} />
              <Text style={styles.uploadText}>Tap to upload {label}</Text>
              <Text style={styles.uploadHint}>PDF or image, max 5MB</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {error && (
        <View style={styles.errorRow}>
          <AlertTriangle size={14} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand[200],
    borderRadius: rounded.sm,
    backgroundColor: colors.brand[50],
  },
  fileName: {
    flex: 1,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  removeButton: {
    padding: spacing.xxs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadZone: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    borderRadius: rounded.sm,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.canvas,
  },
  uploadZoneDisabled: {
    opacity: 0.5,
  },
  uploadText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.brand[600],
  },
  uploadHint: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
  },
});
