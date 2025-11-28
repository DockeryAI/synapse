const fs = require('fs');

// Load local enhanced profiles index
const localIndex = JSON.parse(fs.readFileSync('./public/data/enhanced-profiles/index.json'));
const localNaicsCodes = new Set(localIndex.map(p => p.naics));

// Parse complete-naics-codes.ts to extract NAICS codes marked has_full_profile: true
const naicsFile = fs.readFileSync('./src/data/complete-naics-codes.ts', 'utf-8');

// Extract all entries with has_full_profile: true
const profileEntries = [];
const regex = /\{\s*naics_code:\s*'(\d+)',\s*display_name:\s*'([^']+)',\s*category:\s*'([^']+)'[^}]*has_full_profile:\s*true/g;
let match;
while ((match = regex.exec(naicsFile)) !== null) {
  profileEntries.push({
    naics: match[1],
    name: match[2],
    category: match[3]
  });
}

console.log('=== NAICS Comparison Summary ===\n');
console.log('Local enhanced profiles:', localIndex.length);
console.log('NAICS codes marked has_full_profile:', profileEntries.length);

// Find missing profiles (in DB but not local)
const missing = profileEntries.filter(p => !localNaicsCodes.has(p.naics));
console.log('\n=== MISSING FROM LOCAL DB ===');
console.log('Count:', missing.length);
if (missing.length > 0) {
  missing.forEach(p => {
    console.log(`  ${p.naics} - ${p.name} (${p.category})`);
  });
}

// Find profiles in local but not in DB marked as has_full_profile
const dbNaicsCodes = new Set(profileEntries.map(p => p.naics));
const extra = localIndex.filter(p => !dbNaicsCodes.has(p.naics));
console.log('\n=== IN LOCAL BUT NOT MARKED has_full_profile IN DB ===');
console.log('Count:', extra.length);
if (extra.length > 0) {
  extra.forEach(p => {
    console.log(`  ${p.naics} - ${p.name} (${p.category})`);
  });
}

// Also count all NAICS codes (including on-demand)
const allRegex = /\{\s*naics_code:\s*'(\d+)',\s*display_name:\s*'([^']+)'/g;
const allEntries = [];
let allMatch;
while ((allMatch = allRegex.exec(naicsFile)) !== null) {
  allEntries.push({
    naics: allMatch[1],
    name: allMatch[2]
  });
}
console.log('\n=== TOTAL NAICS CODES IN DB ===');
console.log('Total entries:', allEntries.length);
console.log('Pre-generated (has_full_profile: true):', profileEntries.length);
console.log('On-demand (has_full_profile: false):', allEntries.length - profileEntries.length);
