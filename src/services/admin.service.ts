/**
 * Admin Service
 *
 * Handles admin-only operations including:
 * - User management
 * - Session access
 * - Audit logging
 * - User data access
 *
 * Only accessible to admin@dockeryai.com
 */

import { supabase } from '@/lib/supabase';
import { AuthService, type UserProfile } from './auth.service';

const ADMIN_EMAIL = 'admin@dockeryai.com';

export interface AdminAccessLog {
  id: string;
  admin_id: string;
  accessed_user_id: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  industry?: string;
  location?: string;
  [key: string]: any;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: string;
  [key: string]: any;
}

export const AdminService = {
  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const user = await AuthService.getCurrentUser();
    return user?.email === ADMIN_EMAIL;
  },

  /**
   * Ensure current user is admin (throws if not)
   */
  async requireAdmin(): Promise<void> {
    const isAdmin = await this.isAdmin();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }
  },

  /**
   * Get all user profiles (admin only)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    await this.requireAdmin();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
  },

  /**
   * Get specific user profile (admin only)
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    await this.requireAdmin();
    await this.logAdminAccess(userId, 'viewed_profile');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  /**
   * Get user's business profile (admin only)
   */
  async getUserBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    await this.requireAdmin();
    await this.logAdminAccess(userId, 'viewed_business_profile');

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*, products(*), services(*)')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as BusinessProfile;
  },

  /**
   * Get all campaigns for a user (admin only)
   */
  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    await this.requireAdmin();
    await this.logAdminAccess(userId, 'viewed_campaigns');

    const { data, error } = await supabase
      .from('campaigns')
      .select('*, campaign_posts(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data as Campaign[];
  },

  /**
   * Get all data for a user (admin only)
   * Returns comprehensive user data for session viewing
   */
  async getUserData(userId: string): Promise<{
    profile: UserProfile;
    businessProfile: BusinessProfile | null;
    campaigns: Campaign[];
  }> {
    await this.requireAdmin();
    await this.logAdminAccess(userId, 'viewed_full_session');

    const [profile, businessProfile, campaigns] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserBusinessProfile(userId),
      this.getUserCampaigns(userId),
    ]);

    return {
      profile,
      businessProfile,
      campaigns,
    };
  },

  /**
   * Log admin access to audit trail
   */
  async logAdminAccess(
    accessedUserId: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const admin = await AuthService.getCurrentUser();
    if (!admin) return;

    const { error } = await supabase.from('admin_access_log').insert({
      admin_id: admin.id,
      accessed_user_id: accessedUserId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log admin access:', error);
      // Don't throw - logging failure shouldn't break the operation
    }
  },

  /**
   * Get admin access logs (admin only)
   */
  async getAccessLogs(
    userId?: string,
    limit: number = 100
  ): Promise<AdminAccessLog[]> {
    await this.requireAdmin();

    let query = supabase
      .from('admin_access_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('accessed_user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as AdminAccessLog[];
  },

  /**
   * Search users by email or name (admin only)
   */
  async searchUsers(query: string): Promise<UserProfile[]> {
    await this.requireAdmin();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,business_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as UserProfile[];
  },

  /**
   * Get user statistics (admin only)
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> {
    await this.requireAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, newToday, newThisWeek, newThisMonth] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString()),
    ]);

    return {
      totalUsers: total.count || 0,
      newUsersToday: newToday.count || 0,
      newUsersThisWeek: newThisWeek.count || 0,
      newUsersThisMonth: newThisMonth.count || 0,
    };
  },
};

export default AdminService;
