import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { House, Calendar, MessageSquare, Clock, User, FileText } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function NurseTabLayout() {
  const router = useRouter();
  const { user, profile, isLoading, getRedirectPath } = useAuth();

  useEffect(() => {
    if (isLoading) return;
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
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.fontFamily.bodyMedium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="care-requests"
        options={{
          title: 'Care Requests',
          tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Availability',
          tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
