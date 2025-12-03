import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Checking for New Car Dealer profile...\n');

// Check all profiles with "car" in the name
const { data, error } = await supabase
  .from('industry_profiles')
  .select('id, name, created_at, template_count')
  .or('id.eq.new-car-dealer,name.ilike.%car%')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
} else if (data && data.length > 0) {
  console.log(`✅ Found ${data.length} car-related profiles:\n`);
  data.forEach(p => {
    const created = new Date(p.created_at);
    const isRecent = (Date.now() - created.getTime()) < (60 * 60 * 1000); // Less than 1 hour old
    const indicator = isRecent ? '🆕' : '  ';
    console.log(`${indicator} ${p.id}`);
    console.log(`   Name: ${p.name}`);
    console.log(`   Created: ${created.toLocaleString()}`);
    console.log(`   Templates: ${p.template_count || 0}`);
    console.log('');
  });

  // Check specifically for new-car-dealer
  const newCarDealer = data.find(p => p.id === 'new-car-dealer');
  if (newCarDealer) {
    console.log('✅ The "new-car-dealer" profile EXISTS in the database!');
    console.log(`   It was created at: ${new Date(newCarDealer.created_at).toLocaleString()}`);
  } else {
    console.log('⚠️  No profile with exact ID "new-car-dealer" found');
  }
} else {
  console.log('❌ No car-related profiles found in the database');
}

// Also check the total count
const { count } = await supabase
  .from('industry_profiles')
  .select('*', { count: 'exact', head: true });

console.log(`\n📊 Total profiles in database: ${count}`);