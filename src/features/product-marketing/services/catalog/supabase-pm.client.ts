/**
 * Product Marketing Supabase Client
 *
 * Provides a configured Supabase client for Product Marketing operations.
 * Uses the same connection as the main app but with PM-specific helpers.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TABLE CONSTANTS
// ============================================================================

/** Product Marketing table names - all prefixed with pm_ */
export const PM_TABLES = {
  PRODUCTS: 'pm_products',
  CATEGORIES: 'pm_categories',
  PRODUCT_SOURCES: 'pm_product_sources',
  PRODUCT_METADATA: 'pm_product_metadata',
  EXTRACTION_LOGS: 'pm_extraction_logs',
} as const;

// ============================================================================
// ERROR TYPES
// ============================================================================

/** Product Marketing specific error */
export interface PMDatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/** Convert Supabase error to PM error */
export function toPMError(error: unknown): PMDatabaseError {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      code: String(err.code || 'UNKNOWN'),
      message: String(err.message || 'An unknown error occurred'),
      details: err.details ? String(err.details) : undefined,
      hint: err.hint ? String(err.hint) : undefined,
    };
  }
  return {
    code: 'UNKNOWN',
    message: String(error),
  };
}

/** Check if error is a duplicate key violation */
export function isDuplicateError(error: unknown): boolean {
  const pmError = toPMError(error);
  return pmError.code === '23505';
}

/** Check if error is a foreign key violation */
export function isForeignKeyError(error: unknown): boolean {
  const pmError = toPMError(error);
  return pmError.code === '23503';
}

// ============================================================================
// SINGLETON CLIENT
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Product Marketing Supabase client
 * Uses environment variables for configuration
 */
export function getPMSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get environment variables (Vite or Node.js)
  const env = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? process.env : {});

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  });

  return supabaseClient;
}

/**
 * Reset the client (useful for testing)
 */
export function resetPMSupabaseClient(): void {
  supabaseClient = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Execute a database operation with automatic error handling
 */
export async function withPMDatabase<T>(
  operation: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  const client = getPMSupabaseClient();
  const { data, error } = await operation(client);

  if (error) {
    throw new Error(`Database operation failed: ${toPMError(error).message}`);
  }

  if (data === null) {
    throw new Error('Database operation returned null');
  }

  return data;
}

/**
 * Check if the PM tables exist
 */
export async function checkPMTablesExist(): Promise<boolean> {
  const client = getPMSupabaseClient();

  try {
    // Try to query the products table
    const { error } = await client
      .from(PM_TABLES.PRODUCTS)
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
