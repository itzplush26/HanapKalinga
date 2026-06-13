import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFamilyBookings } from '../../../src/lib/hooks/useFamilyBookings';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { TextLink } from '../../../src/components/ui/TextLink';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { BookingCard } from '../../../src/components/BookingCard';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function FamilyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookings, loading, error, refreshing, refetch } = useFamilyBookings(user?.id);

  return (
    <ScreenWrapper>
      {loading && bookings.length === 0 ? (
        <View style={styles.skeletonRow}>
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
        </View>
      ) : error ? (
        <EmptyState
          icon={<Calendar size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar size={40} color={colors.muted} />}
          title="No bookings yet"
          subtitle="Find a nurse to get started."
          actionLabel="Browse nurses"
          onAction={() => router.push('/(family)/browse')}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/(family)/bookings/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
  },
  skeletonRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
