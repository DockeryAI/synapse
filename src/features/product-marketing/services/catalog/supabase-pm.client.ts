/**
 * Product Marketing Supabase Client
 *
 * Provides a configured Supabase client for Product Marketing operations.
 * Uses the same connection as the main app but with PM-specific helpers.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as mainSupabaseClient } from '@/lib/supabase';

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
// SINGLETON CLIENT - Reuse main app client to avoid multiple instances
// ============================================================================

/**
 * Get the Product Marketing Supabase client
 * Reuses the main app client to avoid "Multiple GoTrueClient instances" warning
 */
export function getPMSupabaseClient(): SupabaseClient {
  return mainSupabaseClient as SupabaseClient;
}

/**
 * Reset the client (no-op since we reuse main client)
 * Kept for backwards compatibility
 */
export function resetPMSupabaseClient(): void {
  // No-op - main client is managed elsewhere
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
