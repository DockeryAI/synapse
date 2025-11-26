/**
 * Clear Intelligence Cache
 *
 * Run this in the browser console to clear cached intelligence data:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire file and press Enter
 */

console.log('🧹 Clearing intelligence cache...');

// Clear localStorage intelligence cache
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.startsWith('intelligence_') ||
    key.startsWith('deepcontext:') ||
    key.includes('cache')
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`  Removing: ${key}`);
  localStorage.removeItem(key);
});

// Clear sessionStorage
sessionStorage.clear();

console.log(`✅ Cleared ${keysToRemove.length} cache entries`);
console.log('🔄 Reload the page (Ctrl+Shift+R or Cmd+Shift+R) for changes to take effect');
