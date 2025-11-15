/**
 * Authentication Service
 *
 * Handles user authentication, session management, and profile creation
 * Built on top of Supabase Auth
 */

import { supabase, auth as supabaseAuth } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  created_at: Date;
  updated_at: Date;
}

export const AuthService = {
  /**
   * Sign up a new user with email and password
   * Automatically creates a user profile entry
   */
  async signUp(email: string, password: string, fullName?: string): Promise<User> {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      // Don't throw - user is created, profile can be created later
    }

    return data.user;
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error('Failed to create session');

    return data.session;
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  },

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const user = userId || (await this.getCurrentUser())?.id;
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Update user password (must be logged in)
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  /**
   * Check if current user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

export default AuthService;
