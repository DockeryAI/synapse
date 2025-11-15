/**
 * Test News API via Supabase Edge Function
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testNewsAPI() {
  console.log('🧪 Testing News API...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'industry',
        industry: 'Bookstore',
        keywords: ['independent bookstore', 'reading'],
        limit: 5
      })
    });

    console.log('Response Status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ FAILED - Edge Function Error:', data);
      process.exit(1);
    }

    if (!data.success) {
      console.error('❌ FAILED - API Error:', data.error);
      process.exit(1);
    }

    console.log('✅ SUCCESS - News API is working!');
    console.log(`\nReceived ${data.articles.length} articles:`);

    data.articles.slice(0, 3).forEach((article, i) => {
      console.log(`\n${i + 1}. ${article.title}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Published: ${article.publishedAt}`);
      console.log(`   URL: ${article.url}`);
    });

    console.log('\n✅ News API Test PASSED\n');

  } catch (error) {
    console.error('❌ FAILED - Unexpected Error:', error.message);
    process.exit(1);
  }
}

// Load .env file
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

testNewsAPI();
