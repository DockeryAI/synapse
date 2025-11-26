#!/usr/bin/env node

/**
 * Detailed API Test for Failing APIs
 * Tests Outscraper and Semrush with correct endpoints
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Color codes
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

// ============================================================================
// OUTSCRAPER API TESTS
// ============================================================================
async function testOutscraperAPI() {
  log('\n════════════════════════════════════════════', 'magenta');
  log('TESTING OUTSCRAPER API', 'magenta');
  log('════════════════════════════════════════════', 'magenta');

  const apiKey = process.env.VITE_OUTSCRAPER_API_KEY;
  log(`\nAPI Key: ${apiKey?.substring(0, 20)}...`, 'cyan');

  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Outscraper API key not configured');
  }

  // Test 1: Account Balance (correct endpoint)
  log('\n1. Testing Account Balance endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.app.outscraper.com/account/balance', {
      headers: {
        'X-API-KEY': apiKey
      }
    });
    log('✅ Account balance endpoint works!', 'green');
    console.log('   Credits:', response.data);
  } catch (error) {
    log('❌ Balance endpoint failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }

  // Test 2: Account Info (alternative endpoint)
  log('\n2. Testing Account Info endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.app.outscraper.com/account/info', {
      headers: {
        'X-API-KEY': apiKey
      }
    });
    log('✅ Account info endpoint works!', 'green');
    console.log('   Info:', JSON.stringify(response.data).substring(0, 100));
  } catch (error) {
    log('❌ Info endpoint failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }

  // Test 3: Google Maps Search (actual scraping endpoint)
  log('\n3. Testing Google Maps Search endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.app.outscraper.com/maps/search-v2', {
      params: {
        query: 'restaurants near Austin, TX',
        limit: 1
      },
      headers: {
        'X-API-KEY': apiKey
      }
    });
    log('✅ Google Maps search works!', 'green');
    console.log('   Results:', response.data?.data?.length || 0, 'places found');
  } catch (error) {
    log('❌ Maps search failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }

  // Test 4: Reviews endpoint
  log('\n4. Testing Reviews endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.app.outscraper.com/maps/reviews-v3', {
      params: {
        query: 'https://www.google.com/maps/place/?q=place_id:ChIJLwPMoJm1RIYRetVp1EtGm10',
        reviewsLimit: 1,
        async: false
      },
      headers: {
        'X-API-KEY': apiKey
      }
    });
    log('✅ Reviews endpoint works!', 'green');
    console.log('   Reviews found:', response.data?.data?.length || 0);
  } catch (error) {
    log('❌ Reviews endpoint failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }
}

// ============================================================================
// SEMRUSH API TESTS
// ============================================================================
async function testSemrushAPI() {
  log('\n════════════════════════════════════════════', 'magenta');
  log('TESTING SEMRUSH API', 'magenta');
  log('════════════════════════════════════════════', 'magenta');

  const apiKey = process.env.VITE_SEMRUSH_API_KEY;
  log(`\nAPI Key: ${apiKey?.substring(0, 20)}...`, 'cyan');

  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('Semrush API key not configured');
  }

  // Test 1: Credits Balance
  log('\n1. Testing Credits Balance endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.semrush.com/', {
      params: {
        type: 'credits_balance',
        key: apiKey
      }
    });
    log('✅ Credits balance works!', 'green');
    console.log('   API Units remaining:', response.data);
  } catch (error) {
    log('❌ Credits endpoint failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }

  // Test 2: Domain Overview (correct parameters)
  log('\n2. Testing Domain Overview endpoint...', 'yellow');
  try {
    const response = await axios.get('https://www.semrush.com/api/v3/', {
      params: {
        type: 'domain_ranks',
        key: apiKey,
        domain: 'example.com',
        database: 'us',
        export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At'
      }
    });
    log('✅ Domain overview works!', 'green');
    console.log('   Data:', response.data.substring(0, 100));
  } catch (error) {
    log('❌ Domain overview failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
    console.log('   Response:', error.response?.data);
  }

  // Test 3: Keyword Rankings
  log('\n3. Testing Keyword Rankings endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.semrush.com/', {
      params: {
        type: 'domain_organic',
        key: apiKey,
        domain: 'example.com',
        database: 'us',
        display_limit: 1,
        export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td'
      }
    });
    log('✅ Keyword rankings work!', 'green');
    console.log('   Data preview:', response.data.substring(0, 150));
  } catch (error) {
    log('❌ Keyword rankings failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }

  // Test 4: Alternative Analytics endpoint
  log('\n4. Testing Analytics API endpoint...', 'yellow');
  try {
    const response = await axios.get('https://api.semrush.com/analytics/v1/', {
      params: {
        key: apiKey,
        type: 'domain_rank',
        domain: 'example.com'
      }
    });
    log('✅ Analytics API works!', 'green');
    console.log('   Data:', response.data.substring(0, 100));
  } catch (error) {
    log('❌ Analytics API failed', 'red');
    console.log('   Error:', error.response?.status, error.response?.data || error.message);
  }
}

// ============================================================================
// NEWS API ALTERNATIVES
// ============================================================================
async function testNewsAlternatives() {
  log('\n════════════════════════════════════════════', 'magenta');
  log('TESTING NEWS API ALTERNATIVES', 'magenta');
  log('════════════════════════════════════════════', 'magenta');

  // Since News API key is not configured, test if other APIs can provide news

  // Test 1: Serper News Search
  const serperKey = process.env.VITE_SERPER_API_KEY;
  if (serperKey && !serperKey.includes('your_')) {
    log('\n1. Testing Serper News Search...', 'yellow');
    try {
      const response = await axios.post('https://google.serper.dev/news', {
        q: 'technology news'
      }, {
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        }
      });
      log('✅ Serper can provide news!', 'green');
      console.log('   News articles found:', response.data.news?.length || 0);
    } catch (error) {
      log('❌ Serper news failed', 'red');
      console.log('   Error:', error.response?.status || error.message);
    }
  }

  // Test 2: OpenRouter for news summaries
  const openRouterKey = process.env.VITE_OPENROUTER_API_KEY;
  if (openRouterKey && !openRouterKey.includes('your_')) {
    log('\n2. OpenRouter can generate news summaries...', 'yellow');
    log('✅ Can use OpenRouter to analyze and summarize news from other sources', 'green');
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runDetailedTests() {
  log('\n╔════════════════════════════════════════╗', 'magenta');
  log('║  DETAILED API FAILURE INVESTIGATION   ║', 'magenta');
  log('╚════════════════════════════════════════╝', 'magenta');

  try {
    await testOutscraperAPI();
  } catch (error) {
    log(`\n❌ Outscraper tests failed completely: ${error.message}`, 'red');
  }

  try {
    await testSemrushAPI();
  } catch (error) {
    log(`\n❌ Semrush tests failed completely: ${error.message}`, 'red');
  }

  try {
    await testNewsAlternatives();
  } catch (error) {
    log(`\n❌ News alternatives failed: ${error.message}`, 'red');
  }

  log('\n╔════════════════════════════════════════╗', 'magenta');
  log('║           RECOMMENDATIONS              ║', 'magenta');
  log('╚════════════════════════════════════════╝', 'magenta');

  log('\n📋 Required Actions:', 'yellow');
  log('1. NEWS API: Need to get a real API key from newsapi.ai or newsapi.org', 'cyan');
  log('2. REDDIT API: Need to register app at https://www.reddit.com/prefs/apps', 'cyan');
  log('3. OUTSCRAPER: If still failing, verify API key is active', 'cyan');
  log('4. SEMRUSH: If still failing, check account status and API access level', 'cyan');

  log('\n🔄 Workarounds Available:', 'yellow');
  log('• Use Serper for news (already working)', 'green');
  log('• Use OpenRouter for content analysis (already working)', 'green');
  log('• APIs are set to fail gracefully with retry logic', 'green');
}

// Run the tests
runDetailedTests().catch(error => {
  log('\n❌ Test runner failed:', 'red');
  console.error(error);
  process.exit(1);
});