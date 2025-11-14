// Supabase client configuration and utilities

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Demo mode flag
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn('🔔 Running in DEMO MODE - Supabase not configured. Data will not persist.');
}

// Create Supabase client (or mock for demo mode)
export const supabase = isDemoMode
  ? createMockSupabaseClient()
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
      db: {
        schema: 'public',
      },
    });

// Mock Supabase client for demo mode
function createMockSupabaseClient(): any {
  const mockError = {
    data: null,
    error: {
      message: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
      code: 'SUPABASE_NOT_CONFIGURED',
      details: 'Running in demo mode without database connection.',
      hint: 'Check NAICS_MIGRATION_GUIDE.md for setup instructions.'
    }
  };

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    single: () => Promise.resolve(mockError),
    order: () => mockQuery,
    limit: () => mockQuery,
    then: (resolve: any) => resolve(mockError),
  };

  return {
    from: () => mockQuery,
    auth: {
      getUser: () => Promise.resolve(mockError),
      signInWithPassword: () => Promise.resolve(mockError),
      signUp: () => Promise.resolve(mockError),
      signOut: () => Promise.resolve(mockError),
      resetPasswordForEmail: () => Promise.resolve(mockError),
      updateUser: () => Promise.resolve(mockError),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockError),
        getPublicUrl: () => ({ data: { publicUrl: '' }, error: mockError.error }),
        remove: () => Promise.resolve(mockError),
        list: () => Promise.resolve(mockError),
      }),
    },
    functions: {
      invoke: () => Promise.resolve(mockError),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
  };
}

// Auth helpers
export const auth = {
  /**
   * Get the current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};

// Storage helpers
export const storage = {
  /**
   * Upload a file to storage
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;
    return data;
  },
};

// Edge Functions helpers
export const functions = {
  /**
   * Invoke an edge function
   */
  async invoke<T = any>(functionName: string, payload?: any): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) throw error;
    return data as T;
  },

  /**
   * Analyze mirror section
   */
  async analyzeMirror(brandId: string, section: string, forceRefresh = false) {
    return this.invoke('analyze-mirror', {
      brandId,
      section,
      forceRefresh,
    });
  },

  /**
   * Send message to Marbs assistant
   */
  async askMarbs(message: string, context: any, conversationId?: string) {
    return this.invoke('marbs-assistant', {
      message,
      context,
      conversationId,
    });
  },

  /**
   * Generate content (MARBA or Synapse mode)
   */
  async generateContent(
    brandId: string,
    platform: string,
    topic: string,
    mode: 'marba' | 'synapse',
    options?: any
  ) {
    return this.invoke('generate-content', {
      brandId,
      platform,
      topic,
      mode,
      ...options,
    });
  },

  /**
   * Enrich content with Synapse
   */
  async enrichWithSynapse(content: string, enrichmentType = 'full') {
    return this.invoke('enrich-with-synapse', {
      content,
      enrichmentType,
    });
  },

  /**
   * Publish content to platform
   */
  async publishToPlatform(
    contentItemId: string,
    platform: string,
    content: string,
    imageUrl?: string
  ) {
    return this.invoke('publish-to-platforms', {
      contentItemId,
      platform,
      content,
      imageUrl,
    });
  },

  /**
   * Collect analytics from platform
   */
  async collectAnalytics(brandId: string, platform: string, dateRange: any) {
    return this.invoke('collect-analytics', {
      brandId,
      platform,
      dateRange,
    });
  },
};

// Real-time subscription helpers
export const realtime = {
  /**
   * Subscribe to table changes
   */
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to content calendar changes
   */
  subscribeToContentCalendar(brandId: string, callback: (payload: any) => void) {
    return this.subscribeToTable(
      'content_calendar_items',
      callback,
      `brand_id=eq.${brandId}`
    );
  },

  /**
   * Subscribe to Marbs conversations
   */
  subscribeToMarbsConversations(userId: string, callback: (payload: any) => void) {
    return this.subscribeToTable(
      'marbs_conversations',
      callback,
      `user_id=eq.${userId}`
    );
  },

  /**
   * Subscribe to intelligence opportunities
   */
  subscribeToOpportunities(brandId: string, callback: (payload: any) => void) {
    return this.subscribeToTable(
      'intelligence_opportunities',
      callback,
      `brand_id=eq.${brandId}`
    );
  },
};

// Query helpers
export const db = {
  /**
   * Get a single record by ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as T;
  },

  /**
   * Get all records from a table
   */
  async getAll<T>(table: string, filters?: Record<string, any>): Promise<T[]> {
    let query = supabase.from(table).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as T[]) || [];
  },

  /**
   * Insert a record
   */
  async insert<T>(table: string, record: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  },

  /**
   * Update a record
   */
  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  },

  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export default supabase;
