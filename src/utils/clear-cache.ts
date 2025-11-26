/**
 * Cache Clearing Utility
 * Clears all cached intelligence data to force fresh fetching
 */

export function clearIntelligenceCache(): void {
  console.log('[CacheClear] Clearing all intelligence caches...');

  // Clear localStorage items related to intelligence
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('synapse_insights_cache') ||
      key.includes('smart_picks_cache') ||
      key.includes('intelligence_') ||
      key.includes('deepcontext_') ||
      key.includes('jtbd_')
    )) {
      keysToRemove.push(key);
    }
  }

  // Remove all related keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[CacheClear] Removed cache key: ${key}`);
  });

  // Clear sessionStorage as well
  const sessionKeysToRemove: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('intelligence') ||
      key.includes('synapse') ||
      key.includes('deepcontext')
    )) {
      sessionKeysToRemove.push(key);
    }
  }

  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`[CacheClear] Removed session key: ${key}`);
  });

  console.log(`[CacheClear] Cleared ${keysToRemove.length} localStorage keys and ${sessionKeysToRemove.length} sessionStorage keys`);
}

// Auto-clear cache if URL has ?clear-cache parameter
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clear-cache') === 'true') {
    clearIntelligenceCache();
    console.log('[CacheClear] Cache cleared via URL parameter');
    // Remove the parameter from URL without reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('clear-cache');
    window.history.replaceState({}, '', newUrl.toString());
  }
}