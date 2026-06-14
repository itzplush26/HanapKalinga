import { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LogOut, LayoutDashboard, ShieldCheck, Stethoscope, Users, CalendarDays } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

const TABS = [
  { name: 'index', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'verifications', label: 'Verifications', icon: ShieldCheck },
  { name: 'nurses', label: 'Nurses', icon: Stethoscope },
  { name: 'families', label: 'Families', icon: Users },
  { name: 'bookings', label: 'Bookings', icon: CalendarDays },
] as const;

function AdminHeader() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, signOut } = useAuth();

  const currentSegment = (segments as string[])[1] ?? 'index';

  const handleTabPress = useCallback(
    (name: string) => {
      if (name === 'index') {
        router.replace('/(admin)');
      } else {
        router.replace(`/(admin)/${name}` as any);
      }
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }, [signOut, router]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.adminInfo}>
          <Text style={styles.adminLabel}>Admin</Text>
          <Text style={styles.adminName} numberOfLines={1}>
            {profile?.full_name ?? 'Administrator'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <LogOut size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const isActive =
            tab.name === 'index'
              ? currentSegment === 'index'
              : currentSegment.startsWith(tab.name);
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(tab.name)}
              style={[styles.tab, isActive && styles.tabActive]}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <Icon
                size={16}
                color={isActive ? colors.canvas : colors.muted}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function AdminLayout() {
  const router = useRouter();
  const { user, profile, isLoading, getRedirectPath } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (profile && profile.role !== 'admin') {
      router.replace(getRedirectPath(profile.role));
    }
  }, [user, profile, isLoading, router, getRedirectPath]);

  if (isLoading) return null;
  if (!user) return null;
  if (profile && profile.role !== 'admin') return null;

  return (
    <Stack
      screenOptions={{
        header: () => <AdminHeader />,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="verifications/index" />
      <Stack.Screen name="nurses" />
      <Stack.Screen name="families" />
      <Stack.Screen name="bookings/index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingTop: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  adminInfo: {
    flex: 1,
  },
  adminLabel: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: rounded.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.strong,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: rounded.pill,
    backgroundColor: colors.surface.strong,
  },
  tabActive: {
    backgroundColor: colors.brand[600],
  },
  tabLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.canvas,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
});
