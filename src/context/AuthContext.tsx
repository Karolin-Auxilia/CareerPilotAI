import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getCurrentUser, signIn, signUp, signOut, updateProfile } from '../services/supabase/auth';
import { supabase, isConfigured } from '../services/supabase/client';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  setLocalCredits: (credits: number) => void;
  upgradePlan: (newPlan: 'free' | 'premium' | 'pro') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const { user: currentUser, profile: currentProfile } = await getCurrentUser();
      setUser(currentUser);
      setProfile(currentProfile);
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { user: currentUser, profile: currentProfile } = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setProfile(currentProfile);
        }
      } catch (err) {
        console.error('Auth initialization error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (isConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (mounted) setProfile(prof);
        } else {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { user: loggedInUser, profile: loggedInProfile, error } = await signIn(email, pass);
      if (error) {
        setLoading(false);
        return { success: false, error };
      }
      setUser(loggedInUser);
      setProfile(loggedInProfile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (email: string, pass: string, fullName: string) => {
    setLoading(true);
    try {
      const { user: registeredUser, profile: registeredProfile, error } = await signUp(email, pass, fullName);
      if (error) {
        setLoading(false);
        return { success: false, error };
      }
      setUser(registeredUser);
      setProfile(registeredProfile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  };

  const setLocalCredits = (credits: number) => {
    if (profile) {
      setProfile({ ...profile, credits });
    }
  };

  const upgradePlan = async (newPlan: 'free' | 'premium' | 'pro') => {
    if (!profile) return;
    const updated = await updateProfile(profile.id, { plan: newPlan });
    if (updated.profile) {
      setProfile(updated.profile);
    } else {
      setProfile({ ...profile, plan: newPlan });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        resetPassword,
        refreshProfile,
        setLocalCredits,
        upgradePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
