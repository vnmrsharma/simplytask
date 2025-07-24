import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from './useErrorHandler';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleAsync, error, clearError } = useErrorHandler();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    return handleAsync(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    }, 'Failed to create account');
  };

  const signIn = async (email: string, password: string) => {
    return handleAsync(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes('email_not_confirmed')) {
          throw new Error('Please check your email and click the verification link to confirm your account.');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        throw error;
      }
      return data;
    }, 'Failed to sign in');
  };

  const signOut = async () => {
    return handleAsync(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }, 'Failed to sign out');
  };

  return {
    user,
    session,
    loading,
    error,
    clearError,
    signUp,
    signIn,
    signOut,
  };
}