const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function clearCache(domain) {
  const { error } = await supabase
    .from('location_detection_cache')
    .delete()
    .eq('domain', domain);
  
  if (error) console.error('Error:', error);
  else console.log(`✅ Cleared cache for: ${domain}`);
}

clearCache('thephoenixinsurance.com');
