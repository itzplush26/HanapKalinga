import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { House, Calendar, MessageSquare, Clock, User } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { typography } from '../../src/theme/typography';

export default function NurseTabLayout() {
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
    if (profile && profile.role !== 'nurse') {
      router.replace(getRedirectPath(profile.role));
    }
  }, [user, profile, isLoading, router, getRedirectPath]);

  if (isLoading) return null;
  if (!user) return null;
  if (profile && profile.role !== 'nurse') return null;

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
          tabBarIcon: ({ color, focused }) => (
            <House
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Calendar
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Clock
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User
              size={22}
              color={color}
              strokeWidth={focused ? 2.25 : 2}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
