import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors } = useTheme();
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
      <Text style={[styles.label, { color: colors['text-secondary'] }]}>{label}</Text>
      {selectedFile ? (
        <View
          style={[
            styles.fileCard,
            {
              borderColor: colors.primary,
              backgroundColor: colors['primary-light'],
            },
          ]}
        >
          <FileText size={20} color={colors.primary} />
          <Text style={[styles.fileName, { color: colors['text-primary'] }]} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            accessibilityLabel={`Remove ${selectedFile.name}`}
            accessibilityRole="button"
          >
            <X size={16} color={colors['text-muted']} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePick}
          disabled={loading}
          style={[
            styles.uploadZone,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
            loading && styles.uploadZoneDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Upload ${label}`}
        >
          {loading ? (
            <Text style={[styles.uploadText, { color: colors.primary }]}>Uploading...</Text>
          ) : (
            <>
              <Upload size={20} color={colors.primary} />
              <Text style={[styles.uploadText, { color: colors.primary }]}>Tap to upload {label}</Text>
              <Text style={[styles.uploadHint, { color: colors['text-muted'] }]}>PDF or image, max 5MB</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {error && (
        <View style={styles.errorRow}>
          <AlertTriangle size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderRadius: rounded.md,
  },
  fileName: {
    flex: 1,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
  removeButton: {
    padding: spacing[1],
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: rounded.md,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  uploadZoneDisabled: {
    opacity: 0.5,
  },
  uploadText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  uploadHint: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
});
