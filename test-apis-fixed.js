#!/usr/bin/env node

/**
 * Fixed API Key Test Script
 * Tests each API with correct endpoints and fallbacks
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results storage
const testResults = [];

async function testAPI(name, testFunc, critical = false) {
  log(`\nTesting ${name}...`, 'cyan');
  try {
    const result = await testFunc();
    log(`✅ ${name} - WORKING`, 'green');
    if (result && result.preview) {
      console.log(`   ${result.preview}`);
    }
    testResults.push({ api: name, status: 'SUCCESS', critical });
    return true;
  } catch (error) {
    log(`❌ ${name} - FAILED`, 'red');
    console.log(`   Error: ${error.message}`);
    testResults.push({
      api: name,
      status: 'FAILED',
      error: error.message,
      critical
    });
    return false;
  }
}

// Individual API Tests

async function testYouTubeAPI() {
  const apiKey = process.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('YouTube API key not configured');
  }

  const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet',
      chart: 'mostPopular',
      maxResults: 1,
      key: apiKey
    }
  });

  return { preview: `Got ${response.data.items?.length || 0} videos from YouTube` };
}

async function testNewsAPI() {
  const apiKey = process.env.VITE_NEWS_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('News API key not configured');
  }

  // First try newsapi.ai (the one shown in console error)
  try {
    const response = await axios.get('https://www.newsapi.ai/api/v1/article/getArticles', {
      params: {
        query: JSON.stringify({
          keyword: "technology",
          lang: "eng"
        }),
        resultType: "articles",
        articlesCount: 1,
        apiKey: apiKey
      }
    });
    return { preview: 'NewsAPI.ai is working' };
  } catch (error) {
    // If newsapi.ai fails, try newsapi.org
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        pageSize: 1,
        apiKey: apiKey
      }
    });
    return { preview: 'NewsAPI.org is working (not .ai)' };
  }
}

async function testSerperAPI() {
  const apiKey = process.env.VITE_SERPER_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Serper API key not configured');
  }

  const response = await axios.post('https://google.serper.dev/search', {
    q: 'test'
  }, {
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  });

  return { preview: `Got ${response.data.organic?.length || 0} search results` };
}

async function testOpenRouterAPI() {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return { preview: `Found ${response.data.data?.length || 0} available models` };
}

async function testWeatherAPI() {
  const apiKey = process.env.VITE_WEATHER_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Weather API key not configured');
  }

  const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
    params: {
      key: apiKey,
      q: 'Austin,TX'
    }
  });

  return { preview: `Weather in ${response.data.location?.name}: ${response.data.current?.temp_f}°F` };
}

async function testApifyAPI() {
  const apiKey = process.env.VITE_APIFY_API_KEY || process.env.VITE_APIFY_API_TOKEN;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Apify API key not configured');
  }

  try {
    const response = await axios.get(`https://api.apify.com/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return { preview: `Apify user: ${response.data.data?.username}` };
  } catch (error) {
    // Try with token in query
    const response = await axios.get(`https://api.apify.com/v2/user`, {
      params: { token: apiKey }
    });
    return { preview: `Apify account verified` };
  }
}

async function testOutscraperAPI() {
  const apiKey = process.env.VITE_OUTSCRAPER_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Outscraper API key not configured');
  }

  const response = await axios.get('https://api.app.outscraper.com/account/balance', {
    headers: {
      'X-API-KEY': apiKey
    }
  });

  return { preview: `Outscraper credits: ${response.data?.credits || 'Unknown'}` };
}

async function testSemrushAPI() {
  const apiKey = process.env.VITE_SEMRUSH_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Semrush API key not configured');
  }

  const response = await axios.get('https://api.semrush.com/', {
    params: {
      type: 'credits_balance',
      key: apiKey
    }
  });

  return { preview: `Semrush API units: ${response.data}` };
}

async function testRedditAPI() {
  const clientId = process.env.REDDIT_CLIENT_ID || process.env.VITE_REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET || process.env.VITE_REDDIT_CLIENT_SECRET;

  if (!clientId || clientId.includes('your_')) {
    throw new Error('Reddit Client ID not configured');
  }
  if (!clientSecret || clientSecret.includes('your_')) {
    throw new Error('Reddit Client Secret not configured');
  }

  // Get access token
  const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token',
    'grant_type=client_credentials',
    {
      auth: {
        username: clientId,
        password: clientSecret
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || process.env.VITE_REDDIT_USER_AGENT || 'SynapseTest/1.0'
      }
    }
  );

  return { preview: `Reddit auth successful, token type: ${authResponse.data.token_type}` };
}

// Optional APIs (not critical for core functionality)
async function testOpenAIAPI() {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('sk-proj-') || apiKey.length < 20) {
    throw new Error('OpenAI API key not configured (optional)');
  }

  const response = await axios.get('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return { preview: `OpenAI has ${response.data.data?.length || 0} models available` };
}

async function testPerplexityAPI() {
  const apiKey = process.env.VITE_PERPLEXITY_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Perplexity API key not configured (optional)');
  }

  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: 'llama-3.1-sonar-small-128k-online',
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 5
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return { preview: 'Perplexity API working' };
}

// Edge Function Test
async function testEdgeFunctions() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  // Test if Edge Functions are accessible
  try {
    const response = await axios.post(
      `${supabaseUrl}/functions/v1/fetch-youtube`,
      { action: 'test' },
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { preview: 'Edge Functions are accessible' };
  } catch (error) {
    if (error.response?.status === 500) {
      throw new Error('Edge Functions need API keys synced (use npm run sync:api-keys)');
    }
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'magenta');
  log('║     API KEY VERIFICATION REPORT        ║', 'magenta');
  log('╚════════════════════════════════════════╝', 'magenta');

  // Test critical APIs
  log('\n📌 CRITICAL APIs (Required for core functionality):', 'yellow');
  await testAPI('YouTube API', testYouTubeAPI, true);
  await testAPI('News API', testNewsAPI, true);
  await testAPI('Serper API', testSerperAPI, true);
  await testAPI('OpenRouter API', testOpenRouterAPI, true);
  await testAPI('Weather API', testWeatherAPI, true);
  await testAPI('Apify API', testApifyAPI, true);
  await testAPI('Outscraper API', testOutscraperAPI, true);
  await testAPI('Semrush API', testSemrushAPI, true);
  await testAPI('Reddit API', testRedditAPI, true);

  // Test optional APIs
  log('\n📎 OPTIONAL APIs (Nice to have):', 'yellow');
  await testAPI('OpenAI API', testOpenAIAPI, false);
  await testAPI('Perplexity API', testPerplexityAPI, false);

  // Test Edge Functions
  log('\n🌐 EDGE FUNCTION Status:', 'yellow');
  await testAPI('Supabase Edge Functions', testEdgeFunctions, true);

  // Summary
  log('\n╔════════════════════════════════════════╗', 'magenta');
  log('║            FINAL SUMMARY               ║', 'magenta');
  log('╚════════════════════════════════════════╝', 'magenta');

  const critical = testResults.filter(r => r.critical);
  const optional = testResults.filter(r => !r.critical);
  const criticalSuccess = critical.filter(r => r.status === 'SUCCESS');
  const criticalFailed = critical.filter(r => r.status === 'FAILED');
  const optionalSuccess = optional.filter(r => r.status === 'SUCCESS');
  const optionalFailed = optional.filter(r => r.status === 'FAILED');

  log(`\n✅ Critical APIs Working: ${criticalSuccess.length}/${critical.length}`, 'green');
  criticalSuccess.forEach(r => console.log(`   ✓ ${r.api}`));

  if (criticalFailed.length > 0) {
    log(`\n❌ Critical APIs Failed: ${criticalFailed.length}/${critical.length}`, 'red');
    criticalFailed.forEach(r => console.log(`   ✗ ${r.api}: ${r.error}`));
  }

  log(`\n📊 Optional APIs: ${optionalSuccess.length} working, ${optionalFailed.length} not configured`, 'cyan');

  // Action items
  if (criticalFailed.length > 0) {
    log('\n🔧 ACTION REQUIRED:', 'yellow');

    const edgeFuncFailed = criticalFailed.find(r => r.api.includes('Edge Functions'));
    if (edgeFuncFailed) {
      log('\n1. Sync your API keys to Supabase:', 'cyan');
      console.log('   npm run sync:api-keys');
    }

    const apiKeysFailed = criticalFailed.filter(r =>
      r.error.includes('not configured') ||
      r.error.includes('401') ||
      r.error.includes('403')
    );

    if (apiKeysFailed.length > 0) {
      log('\n2. Check these API keys in your .env file:', 'cyan');
      apiKeysFailed.forEach(r => {
        console.log(`   - ${r.api}`);
      });
    }
  } else {
    log('\n🎉 All critical APIs are working correctly!', 'green');
    log('\nYour app should be fully functional at http://localhost:3000/', 'green');
  }
}

// Run the tests
runAllTests().catch(error => {
  log('\n❌ Test runner failed:', 'red');
  console.error(error);
  process.exit(1);
});