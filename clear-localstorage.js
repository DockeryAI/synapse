/**
 * Clear localStorage Script
 *
 * Run this in the browser console to clear all UVP-related localStorage data
 */

console.log('🧹 Clearing localStorage...');

const itemsToRemove = [
  'marba_session_id',
  'marba_uvp_pending',
  'buyerPersonas',
  'synapse_buyer_personas',
  'temp_brand_id',
  'temp_brand_user_id'
];

// Clear specific items
itemsToRemove.forEach(item => {
  if (localStorage.getItem(item)) {
    localStorage.removeItem(item);
    console.log(`✅ Removed: ${item}`);
  } else {
    console.log(`⚪ Not found: ${item}`);
  }
});

// Clear any marba_uvp_* or marba_buyer_personas_* items
const allKeys = Object.keys(localStorage);
let removedSessionItems = 0;

allKeys.forEach(key => {
  if (key.startsWith('marba_uvp_') || key.startsWith('marba_buyer_personas_')) {
    localStorage.removeItem(key);
    removedSessionItems++;
    console.log(`✅ Removed session item: ${key}`);
  }
});

console.log(`\n🎉 localStorage cleanup complete!`);
console.log(`   - Fixed items: ${itemsToRemove.length}`);
console.log(`   - Session items: ${removedSessionItems}`);
console.log('\n🔄 Refresh the page to see changes');

// Copy this to clipboard for easy pasting in browser console
`
// Paste this in browser console:
console.log('🧹 Clearing localStorage...');
const items = ['marba_session_id','marba_uvp_pending','buyerPersonas','synapse_buyer_personas','temp_brand_id','temp_brand_user_id'];
items.forEach(item => { if(localStorage.getItem(item)) { localStorage.removeItem(item); console.log('✅ Removed: ' + item); } });
Object.keys(localStorage).forEach(key => { if(key.startsWith('marba_uvp_') || key.startsWith('marba_buyer_personas_')) { localStorage.removeItem(key); console.log('✅ Removed: ' + key); } });
console.log('🎉 localStorage cleared! Refresh the page.');
`;