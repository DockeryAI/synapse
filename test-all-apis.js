#!/usr/bin/env node

/**
 * Comprehensive API Key Test Script
 * Tests each API directly to verify keys are working
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results storage
const testResults = [];

async function testAPI(name, testFunc) {
  log(`\nTesting ${name}...`, 'cyan');
  try {
    const result = await testFunc();
    log(`✅ ${name} - SUCCESS`, 'green');
    if (result) {
      console.log(`   Response preview:`, JSON.stringify(result).substring(0, 100) + '...');
    }
    testResults.push({ api: name, status: 'SUCCESS', error: null });
    return true;
  } catch (error) {
    log(`❌ ${name} - FAILED`, 'red');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response:`, error.response.data);
    }
    testResults.push({
      api: name,
      status: 'FAILED',
      error: error.message,
      details: error.response?.data
    });
    return false;
  }
}

// Individual API Tests

async function testYouTubeAPI() {
  const apiKey = process.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    throw new Error('YouTube API key not configured in .env');
  }

  const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet',
      chart: 'mostPopular',
      maxResults: 1,
      key: apiKey
    }
  });

  return response.data;
}

async function testNewsAPI() {
  const apiKey = process.env.VITE_NEWS_API_KEY;
  if (!apiKey || apiKey === 'your_news_api_key_here') {
    throw new Error('News API key not configured in .env');
  }

  // Note: NewsAPI.ai endpoint, not newsapi.org
  const response = await axios.get('https://www.newsapi.ai/api/v1/article/getArticles', {
    params: {
      query: JSON.stringify({
        keyword: "technology",
        lang: "eng",
        dateStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date().toISOString().split('T')[0]
      }),
      resultType: "articles",
      articlesSortBy: "date",
      articlesCount: 1,
      apiKey: apiKey
    }
  });

  return response.data;
}

async function testSerperAPI() {
  const apiKey = process.env.VITE_SERPER_API_KEY;
  if (!apiKey || apiKey === 'your_serper_api_key_here') {
    throw new Error('Serper API key not configured in .env');
  }

  const response = await axios.post('https://google.serper.dev/search', {
    q: 'test query'
  }, {
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function testOpenAIAPI() {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-proj-' || apiKey.length < 20) {
    throw new Error('OpenAI API key not configured in .env');
  }

  const response = await axios.get('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return response.data;
}

async function testOpenRouterAPI() {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key not configured in .env');
  }

  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return response.data;
}

async function testPerplexityAPI() {
  const apiKey = process.env.VITE_PERPLEXITY_API_KEY;
  if (!apiKey || apiKey === 'your_perplexity_api_key_here') {
    throw new Error('Perplexity API key not configured in .env');
  }

  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: 'llama-3.1-sonar-small-128k-online',
    messages: [
      { role: 'user', content: 'Say hello' }
    ],
    max_tokens: 10
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function testWeatherAPI() {
  const apiKey = process.env.VITE_WEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_weather_api_key_here') {
    throw new Error('Weather API key not configured in .env');
  }

  const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
    params: {
      key: apiKey,
      q: 'London'
    }
  });

  return response.data;
}

async function testApifyAPI() {
  const apiKey = process.env.VITE_APIFY_API_KEY;
  if (!apiKey || apiKey === 'your_apify_api_key_here') {
    throw new Error('Apify API key not configured in .env');
  }

  const response = await axios.get(`https://api.apify.com/v2/user/me`, {
    params: {
      token: apiKey
    }
  });

  return response.data;
}

async function testOutscraperAPI() {
  const apiKey = process.env.VITE_OUTSCRAPER_API_KEY;
  if (!apiKey || apiKey === 'your_outscraper_api_key_here') {
    throw new Error('Outscraper API key not configured in .env');
  }

  // Test with account info endpoint
  const response = await axios.get('https://api.app.outscraper.com/account/info', {
    headers: {
      'X-API-KEY': apiKey
    }
  });

  return response.data;
}

async function testSemrushAPI() {
  const apiKey = process.env.VITE_SEMRUSH_API_KEY;
  if (!apiKey || apiKey === 'your_semrush_api_key_here') {
    throw new Error('Semrush API key not configured in .env');
  }

  // Test with credits endpoint
  const response = await axios.get('https://api.semrush.com/analytics/v1/', {
    params: {
      type: 'credits_balance',
      key: apiKey
    }
  });

  return response.data;
}

async function testRedditAPI() {
  const clientId = process.env.VITE_REDDIT_CLIENT_ID;
  const clientSecret = process.env.VITE_REDDIT_CLIENT_SECRET;

  if (!clientId || clientId === 'your_reddit_client_id_here') {
    throw new Error('Reddit Client ID not configured in .env');
  }
  if (!clientSecret || clientSecret === 'your_reddit_client_secret_here') {
    throw new Error('Reddit Client Secret not configured in .env');
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
        'User-Agent': process.env.VITE_REDDIT_USER_AGENT || 'SynapseTest/1.0'
      }
    }
  );

  return authResponse.data;
}

// Main test runner
async function runAllTests() {
  log('\n=================================', 'cyan');
  log('   API KEY VERIFICATION TEST', 'cyan');
  log('=================================', 'cyan');

  // Test each API
  await testAPI('YouTube API', testYouTubeAPI);
  await testAPI('News API (newsapi.ai)', testNewsAPI);
  await testAPI('Serper API', testSerperAPI);
  await testAPI('OpenAI API', testOpenAIAPI);
  await testAPI('OpenRouter API', testOpenRouterAPI);
  await testAPI('Perplexity API', testPerplexityAPI);
  await testAPI('Weather API', testWeatherAPI);
  await testAPI('Apify API', testApifyAPI);
  await testAPI('Outscraper API', testOutscraperAPI);
  await testAPI('Semrush API', testSemrushAPI);
  await testAPI('Reddit API', testRedditAPI);

  // Summary
  log('\n=================================', 'cyan');
  log('        TEST SUMMARY', 'cyan');
  log('=================================', 'cyan');

  const successful = testResults.filter(r => r.status === 'SUCCESS');
  const failed = testResults.filter(r => r.status === 'FAILED');

  log(`\n✅ Successful: ${successful.length}/${testResults.length}`, 'green');
  successful.forEach(r => {
    console.log(`   - ${r.api}`);
  });

  if (failed.length > 0) {
    log(`\n❌ Failed: ${failed.length}/${testResults.length}`, 'red');
    failed.forEach(r => {
      console.log(`   - ${r.api}: ${r.error}`);
    });

    log('\n📝 TROUBLESHOOTING GUIDE:', 'yellow');
    failed.forEach(r => {
      log(`\n${r.api}:`, 'yellow');
      if (r.error.includes('not configured')) {
        console.log('   → Check your .env file has the correct key');
        console.log('   → Make sure the key is not the placeholder value');
      } else if (r.error.includes('401') || r.error.includes('Unauthorized')) {
        console.log('   → The API key exists but is invalid or expired');
        console.log('   → Get a new key from the provider');
      } else if (r.error.includes('403') || r.error.includes('Forbidden')) {
        console.log('   → The API key is valid but lacks permissions');
        console.log('   → Check your account/plan limits');
      } else if (r.error.includes('ENOTFOUND')) {
        console.log('   → Network issue or wrong API endpoint');
      } else {
        console.log('   → Error details:', r.details || r.error);
      }
    });
  }

  // Edge Function sync reminder
  if (successful.length > 0) {
    log('\n📤 Next Step: Sync to Supabase Edge Functions', 'cyan');
    console.log('   Run: npm run sync:api-keys');
    console.log('   This will upload your working API keys to Supabase');
  }
}

// Run the tests
runAllTests().catch(error => {
  log('\n❌ Test runner failed:', 'red');
  console.error(error);
  process.exit(1);
});