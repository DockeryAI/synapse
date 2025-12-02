/**
 * OpenRouter API Keys Configuration
 *
 * 4 API keys for parallel LLM processing
 * Enables 4x speed improvement for batch operations
 */

export interface OpenRouterKeyConfig {
  id: string;
  key: string;
  budgetLimit: number;
  currentSpend: number;
  status: 'active' | 'exhausted' | 'error';
}

// 4 OpenRouter API keys for parallel processing (loaded from environment)
export const OPENROUTER_KEYS: OpenRouterKeyConfig[] = [
  {
    id: 'key_1',
    key: import.meta.env.VITE_OPENROUTER_KEY_1 || '',
    budgetLimit: 100,
    currentSpend: 0,
    status: 'active',
  },
  {
    id: 'key_2',
    key: import.meta.env.VITE_OPENROUTER_KEY_2 || '',
    budgetLimit: 100,
    currentSpend: 0,
    status: 'active',
  },
  {
    id: 'key_3',
    key: import.meta.env.VITE_OPENROUTER_KEY_3 || '',
    budgetLimit: 100,
    currentSpend: 0,
    status: 'active',
  },
  {
    id: 'key_4',
    key: import.meta.env.VITE_OPENROUTER_KEY_4 || '',
    budgetLimit: 100,
    currentSpend: 0,
    status: 'active',
  },
];

// OpenRouter API configuration
export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-opus-4',  // Upgraded to Opus 4.5 for highest quality

  // Concurrency settings
  maxConcurrentPerKey: 4,
  totalMaxConcurrent: 16, // 4 keys × 4 concurrent

  // Timeout and retry settings
  timeoutMs: 120000, // 2 minutes
  retryAttempts: 3,
  backoffMultiplier: 2,
  initialBackoffMs: 5000,

  // Request settings
  defaultTemperature: 0.3,
  defaultMaxTokens: 6000,

  // Headers for OpenRouter
  headers: {
    'HTTP-Referer': 'https://synapse.app',
    'X-Title': 'Synapse Intelligence Engine',
  },
} as const;

// Helper to get active keys only
export function getActiveKeys(): OpenRouterKeyConfig[] {
  return OPENROUTER_KEYS.filter(k => k.status === 'active');
}

// Helper to check remaining budget
export function getRemainingBudget(): number {
  return OPENROUTER_KEYS.reduce((sum, k) => sum + (k.budgetLimit - k.currentSpend), 0);
}

// Helper to get key by index (with rotation)
export function getKeyByIndex(index: number): OpenRouterKeyConfig {
  const activeKeys = getActiveKeys();
  if (activeKeys.length === 0) {
    throw new Error('No active OpenRouter keys available');
  }
  return activeKeys[index % activeKeys.length];
}
