/**
 * Test setup file for Vitest
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.VITE_OPENROUTER_API_KEY = 'test-openrouter-key'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress logs in tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock fetch globally
global.fetch = vi.fn()
