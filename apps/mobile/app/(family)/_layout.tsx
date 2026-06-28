import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { House, Search, Calendar, MessageSquare, User, FileText } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { typography } from '../../src/theme/typography';

export default function FamilyTabLayout() {
  const router = useRouter();
  const { user, profile, isLoading, getRedirectPath } = useAuth();
  const { colors } = useTheme();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasChecked.current) return;
    hasChecked.current = true;
    if (!user) {
      router.replace('/');
      return;
    }
    if (profile && profile.role !== 'family') {
      router.replace(getRedirectPath(profile.role));
    }
  }, [user, profile, isLoading, router, getRedirectPath]);

  if (isLoading) return null;
  if (!user) return null;
  if (profile && profile.role !== 'family') return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors['nav-active'],
        tabBarInactiveTintColor: colors['nav-inactive'],
        tabBarStyle: {
          backgroundColor: colors['nav-bg'],
          borderTopWidth: 1,
          borderTopColor: colors['nav-border'],
          height: 64,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: typography.fontFamily.body,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarTestID: 'tab_home' as never,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <House
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        } as any}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarTestID: 'tab_browse' as never,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Search
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        } as any}
      />
      <Tabs.Screen
        name="care-requests"
        options={{
          title: 'Care Requests',
          tabBarTestID: 'tab_care-requests' as never,
          tabBarIcon: ({ color }: { color: string }) => <FileText size={22} color={color} />,
        } as any}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarTestID: 'tab_bookings' as never,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Calendar
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        } as any}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarTestID: 'tab_messages' as never,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <MessageSquare
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        } as any}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarTestID: 'tab_profile' as never,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <User
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        } as any}
      />
    </Tabs>
  );
}
