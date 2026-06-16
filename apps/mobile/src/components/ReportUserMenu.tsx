import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MoreHorizontal, Flag, Ban } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { IconButton } from './ui/IconButton';
import { Button } from './ui/Button';

const REPORT_CATEGORIES = [
  'Inappropriate behavior',
  'Harassment',
  'Fake profile',
  'Scam or fraud',
  'Safety concern',
  'Other',
];

interface ReportUserMenuProps {
  onReport: (category: string, description: string) => void;
  onBlock: () => void;
  loading?: boolean;
}

export function ReportUserMenu({
  onReport,
  onBlock,
  loading = false,
}: ReportUserMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenReport = () => {
    setMenuVisible(false);
    setReportVisible(true);
  };

  const handleSubmitReport = () => {
    if (!selectedCategory || description.trim().length < 50) return;
    onReport(selectedCategory, description.trim());
    setReportVisible(false);
    setSelectedCategory('');
    setDescription('');
  };

  const handleBlock = () => {
    setMenuVisible(false);
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? They will not be able to contact you or see your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: onBlock,
        },
      ]
    );
  };

  return (
    <>
      <IconButton
        icon={<MoreHorizontal size={20} color={colors.ink} />}
        onPress={() => setMenuVisible(true)}
        accessibilityLabel="More options"
      />

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleOpenReport}
              accessibilityRole="button"
            >
              <Flag size={18} color={colors.semantic.error} />
              <Text style={styles.menuItemText}>Report this user</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBlock}
              accessibilityRole="button"
            >
              <Ban size={18} color={colors.semantic.error} />
              <Text style={styles.menuItemText}>Block this user</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.reportContainer}>
            <Text style={styles.reportTitle}>Report User</Text>

            <Text style={styles.reportLabel}>Category</Text>
            <View style={styles.categoryList}>
              {REPORT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat && styles.categoryItemSelected,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedCategory === cat }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.reportLabel}>Description (min. 50 characters)</Text>
            <TextInput
              style={styles.reportInput}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              accessibilityLabel="Report description"
            />
            <Text style={styles.charCount}>
              {description.length}/50 minimum
            </Text>

            <View style={styles.reportActions}>
              <Button
                variant="secondary"
                onPress={() => setReportVisible(false)}
                style={styles.reportActionButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmitReport}
                disabled={!selectedCategory || description.trim().length < 50}
                loading={loading}
                style={styles.reportActionButton}
              >
                Submit Report
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: rounded.lg,
    borderTopRightRadius: rounded.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.ink,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  reportContainer: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: rounded.lg,
    borderTopRightRadius: rounded.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxHeight: '80%',
  },
  reportTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  reportLabel: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: rounded.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  categoryItemSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  categoryText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  categoryTextSelected: {
    color: colors.brand[600],
    fontFamily: typography.fontFamily.bodyMedium,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'right',
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reportActionButton: {
    flex: 1,
  },
});
