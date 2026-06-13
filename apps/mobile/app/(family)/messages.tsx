import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/domain/EmptyState';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function FamilyMessagesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { error: fetchError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);
        if (fetchError) throw new Error(fetchError.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Messages & Notifications</Text>
        {loading ? (
          <View style={styles.skeletonRow}>
            <Skeleton variant="rectangle" height={72} />
            <Skeleton variant="rectangle" height={72} />
            <Skeleton variant="rectangle" height={72} />
          </View>
        ) : error ? (
          <EmptyState
            icon={<MessageSquare size={40} color={colors.muted} />}
            title="Something went wrong"
            subtitle={error}
          />
        ) : user ? (
          <NotificationsPanel userId={user.id} />
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  skeletonRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
});
