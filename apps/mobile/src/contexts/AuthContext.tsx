import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Href } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@hanapkalinga/shared/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getRedirectPath: (role: UserRole) => Href;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  getRedirectPath: () => '/' as Href,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const getRedirectPath = useCallback((role: UserRole): Href => {
    switch (role) {
      case 'family': return '/(family)';
      case 'nurse': return '/(nurse)';
      case 'admin': return '/(admin)';
      default: return '/';
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Add timeout to prevent hanging on slow network
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (result?.data?.session?.user) {
          setUser(result.data.session.user);
          await fetchProfile(result.data.session.user.id);
        }
      } catch (error) {
        // session restore failed silently
        console.log('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, signOut, refreshProfile, getRedirectPath }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
