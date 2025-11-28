const fs = require('fs');
const index = JSON.parse(fs.readFileSync('./public/data/enhanced-profiles/index.json'));

console.log('=== NAICS Coverage Summary ===');
console.log('Total profiles:', index.length);
console.log('');

// Group by NAICS prefix (first 2 digits = sector)
const sectors = {};
index.forEach(p => {
  const prefix = (p.naics || '').substring(0, 2);
  if (!sectors[prefix]) sectors[prefix] = [];
  sectors[prefix].push(p);
});

const sectorNames = {
  '11': 'Agriculture',
  '21': 'Mining',
  '22': 'Utilities',
  '23': 'Construction',
  '31': 'Manufacturing',
  '32': 'Manufacturing',
  '33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44': 'Retail Trade',
  '45': 'Retail Trade',
  '48': 'Transportation',
  '49': 'Transportation',
  '51': 'Information',
  '52': 'Finance/Insurance',
  '53': 'Real Estate',
  '54': 'Professional Services',
  '56': 'Admin/Support',
  '61': 'Education',
  '62': 'Healthcare',
  '71': 'Arts/Entertainment',
  '72': 'Accommodation/Food',
  '81': 'Other Services',
  '92': 'Public Admin'
};

console.log('By NAICS Sector:');
Object.keys(sectors).sort().forEach(prefix => {
  const name = sectorNames[prefix] || 'Other';
  console.log('  ' + prefix + ' (' + name + '): ' + sectors[prefix].length + ' profiles');
});

console.log('');
console.log('By Category:');
const cats = {};
index.forEach(p => {
  const cat = p.category || 'Uncategorized';
  cats[cat] = (cats[cat] || 0) + 1;
});
Object.entries(cats).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log('  ' + cat + ': ' + count);
});

console.log('');
console.log('All NAICS codes:');
index.forEach(p => {
  console.log('  ' + p.naics + ' - ' + p.name);
});
