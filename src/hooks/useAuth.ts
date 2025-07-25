import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from './useErrorHandler';

interface AuthError {
  type: 'validation' | 'auth' | 'network' | 'confirmation' | 'password' | 'general';
  message: string;
  details?: string;
  suggestions?: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const { handleAsync, error: generalError, clearError: clearGeneralError } = useErrorHandler();

  // Enhanced error handling for auth-specific errors
  const setError = (type: AuthError['type'], message: string, details?: string, suggestions?: string[]) => {
    setAuthError({ type, message, details, suggestions });
  };

  const clearError = () => {
    setAuthError(null);
    clearGeneralError();
  };

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; errors: string[]; suggestions: string[] } => {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
      suggestions.push('Use at least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add an uppercase letter (A-Z)');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add a lowercase letter (a-z)');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add a number (0-9)');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
      suggestions.push('Add a special character (!@#$%^&*)');
    }

    if (password.length > 0 && password.length < 6) {
      suggestions.push('Consider using a passphrase for better security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    };
  };

  // Email validation function
  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        // console.error('Error initializing auth:', error);
        setError('network', 'Failed to initialize authentication', 'Please check your internet connection');
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
    clearError();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError('validation', emailValidation.error!, undefined, ['Use format: name@example.com']);
      return null;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError('password', 'Password does not meet security requirements', 
        passwordValidation.errors.join(', '), passwordValidation.suggestions);
      return null;
    }

    return handleAsync(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        // console.error('Supabase signUp error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
          setError('auth', 'This email is already registered', 
            'An account with this email already exists', 
            ['Try signing in instead', 'Use "Forgot Password" if needed']);
          return null;
        }
        
        if (error.message.includes('weak_password') || error.message.includes('password')) {
          setError('password', 'Password is too weak', error.message, 
            ['Use a mix of letters, numbers, and special characters', 'Make it at least 8 characters long']);
          return null;
        }
        
        if (error.message.includes('invalid_email') || error.message.includes('email')) {
          setError('validation', 'Invalid email address', error.message, 
            ['Check the email format', 'Make sure there are no typos']);
          return null;
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setError('network', 'Network connection failed', 
            'Unable to reach the authentication server', 
            ['Check your internet connection', 'Try again in a moment']);
          return null;
        }
        
        // Generic error fallback
        setError('general', 'Failed to create account', error.message, ['Please try again']);
        return null;
      }
      
      return data;
    }, 'Failed to create account');
  };

  const signIn = async (email: string, password: string) => {
    clearError();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError('validation', emailValidation.error!, undefined, ['Check the email format']);
      return null;
    }

    if (!password) {
      setError('validation', 'Password is required', undefined, ['Enter your password']);
      return null;
    }

    return handleAsync(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // console.error('Supabase signIn error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('email_not_confirmed')) {
          setError('confirmation', 'Email not verified', 
            'Please check your email and click the verification link to confirm your account.',
            ['Check your spam folder', 'Resend verification email', 'Contact support if needed']);
          return null;
        }
        
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setError('auth', 'Invalid credentials', 
            'The email or password you entered is incorrect.',
            ['Double-check your email and password', 'Use "Forgot Password" to reset', 'Make sure Caps Lock is off']);
          return null;
        }
        
        if (error.message.includes('too_many_requests')) {
          setError('auth', 'Too many login attempts', 
            'Please wait a few minutes before trying again.',
            ['Try again in 5-10 minutes', 'Use "Forgot Password" if you\'re unsure']);
          return null;
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setError('network', 'Network connection failed', 
            'Unable to reach the authentication server.',
            ['Check your internet connection', 'Try again in a moment']);
          return null;
        }
        
        // Generic error fallback
        setError('general', 'Sign in failed', error.message, ['Please try again']);
        return null;
      }
      
      return data;
    }, 'Failed to sign in');
  };

  const resetPassword = async (email: string) => {
    clearError();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError('validation', emailValidation.error!, undefined, ['Use format: name@example.com']);
      return null;
    }

    return handleAsync(async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        // console.error('Supabase resetPassword error:', error);
        
        if (error.message.includes('email_not_found') || error.message.includes('user_not_found')) {
          setError('auth', 'Email not found', 
            'No account found with this email address.',
            ['Check the email spelling', 'Try a different email', 'Create a new account instead']);
          return null;
        }
        
        if (error.message.includes('too_many_requests')) {
          setError('auth', 'Too many reset requests', 
            'Please wait before requesting another password reset.',
            ['Check your email for previous reset links', 'Try again in 10-15 minutes']);
          return null;
        }
        
        // Generic error fallback
        setError('general', 'Password reset failed', error.message, ['Please try again']);
        return null;
      }
      
      return data;
    }, 'Failed to send password reset email');
  };

  const signInWithGoogle = async () => {
    clearError();
    return handleAsync(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        // console.error('Supabase Google signIn error:', error);
        
        // Handle specific OAuth errors
        if (error.message.includes('popup_blocked')) {
          setError('auth', 'Popup blocked', 
            'Please allow popups for this site and try again.',
            ['Enable popups in your browser', 'Try refreshing and signing in again']);
          return null;
        }
        
        if (error.message.includes('oauth_provider_not_supported')) {
          setError('auth', 'Google sign-in not available', 
            'Google authentication is temporarily unavailable.',
            ['Try signing in with email and password', 'Contact support if this persists']);
          return null;
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setError('network', 'Network connection failed', 
            'Unable to connect to Google for authentication.',
            ['Check your internet connection', 'Try again in a moment']);
          return null;
        }
        
        // Generic error fallback
        setError('general', 'Google sign-in failed', error.message, ['Please try again']);
        return null;
      }
      
      return data;
    }, 'Failed to sign in with Google');
  };

  const signOut = async () => {
    clearError();
    return handleAsync(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // console.error('Supabase signOut error:', error);
        setError('general', 'Sign out failed', error.message, ['Try refreshing the page']);
        // Don't throw error - user should still be logged out from UI perspective
        return;
      }
    }, 'Failed to sign out');
  };

  return {
    user,
    session,
    loading,
    error: authError || generalError,
    clearError,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    validatePassword,
    validateEmail,
  };
}