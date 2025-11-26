#!/usr/bin/env node

/**
 * Test Edge Functions after deployment
 * Checks if Edge Functions are working with API secrets
 */

import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

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

// Test functions
const tests = [
  {
    name: 'YouTube Search API',
    url: `${SUPABASE_URL}/functions/v1/fetch-youtube`,
    body: {
      endpoint: 'search',
      params: {
        part: 'snippet',
        q: 'technology trends 2024',
        maxResults: 3,
        type: 'video'
      }
    }
  },
  {
    name: 'Serper Search API',
    url: `${SUPABASE_URL}/functions/v1/fetch-serper`,
    body: {
      q: 'artificial intelligence',  // Serper uses 'q' not 'query'
      num: 5
    }
  },
  {
    name: 'SEMrush Keywords API',
    url: `${SUPABASE_URL}/functions/v1/fetch-seo-metrics`,
    body: {
      domain: 'example.com',
      type: 'keywords'
    }
  },
  {
    name: 'Outscraper Reviews API',
    url: `${SUPABASE_URL}/functions/v1/fetch-outscraper`,
    body: {
      query: 'Starbucks New York',
      limit: 5
    }
  },
  {
    name: 'Apify Twitter API',
    url: `${SUPABASE_URL}/functions/v1/apify-scraper`,
    body: {
      actorId: 'quacker~twitter-scraper',
      input: {
        searchTerms: ['AI technology'],
        maxTweets: 10
      }
    }
  },
  {
    name: 'AI Analysis (OpenRouter)',
    url: `${SUPABASE_URL}/functions/v1/ai-proxy`,
    body: {
      provider: 'openrouter',  // Required field
      model: 'anthropic/claude-3.5-sonnet',  // Updated model name
      messages: [
        {
          role: 'user',
          content: 'Brief analysis of current AI trends in 50 words'
        }
      ],
      max_tokens: 100
    }
  }
];

async function testEdgeFunctions() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║         TESTING EDGE FUNCTIONS AFTER DEPLOYMENT             ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log(`\nSupabase URL: ${SUPABASE_URL}`, 'cyan');
  log(`Total tests: ${tests.length}\n`, 'cyan');

  let success = 0;
  let failed = 0;

  for (const test of tests) {
    log(`Testing: ${test.name}`, 'yellow');
    log(`URL: ${test.url}`, 'cyan');

    try {
      const response = await axios.post(test.url, test.body, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 202) {
        log(`✅ ${test.name}: SUCCESS`, 'green');

        // Show sample data based on the type of response
        if (response.data) {
          if (response.data.items) {
            log(`   Found ${response.data.items.length} items`, 'green');
          } else if (response.data.organic) {
            log(`   Found ${response.data.organic.length} search results`, 'green');
          } else if (response.data.current) {
            log(`   Weather data received for ${response.data.location?.name}`, 'green');
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Outscraper returns data in a nested 'data' field
            log(`   Found ${response.data.data.length} results`, 'green');
          } else if (Array.isArray(response.data)) {
            log(`   Found ${response.data.length} results`, 'green');
          } else if (response.data.choices) {
            // AI response format
            log(`   AI response received`, 'green');
          } else if (response.data.status === 'Pending' && response.data.id) {
            // Async job response (like Outscraper)
            log(`   Async job created: ${response.data.id}`, 'green');
          } else {
            // Debug: Show what we actually got
            if (test.name.includes('Outscraper')) {
              log(`   Debug: Response keys: ${Object.keys(response.data).join(', ')}`, 'yellow');
            }
            log(`   Data received successfully`, 'green');
          }
        } else {
          log(`   Request successful`, 'green');
        }
        success++;
      } else {
        // Log the actual response for debugging
        console.log(`Debug: ${test.name} response status: ${response.status}`);
        console.log(`Debug: ${test.name} response data:`, response.data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      log(`❌ ${test.name}: FAILED`, 'red');

      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Error: ${JSON.stringify(error.response.data)}`, 'red');

        // Check for specific errors
        if (error.response.data?.error?.includes('not configured')) {
          log(`   💡 Fix: Add the API key to Supabase secrets`, 'yellow');
        } else if (error.response.status === 500) {
          log(`   💡 Fix: Check Edge Function logs in Supabase Dashboard`, 'yellow');
        }
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
      failed++;
    }

    log(''); // Empty line between tests
  }

  // Summary
  log('═══════════════════════════════════════════', 'magenta');
  log('📊 TEST SUMMARY', 'magenta');
  log('═══════════════════════════════════════════', 'magenta');
  log(`✅ Passed: ${success}/${tests.length}`, success > 0 ? 'green' : 'red');
  log(`❌ Failed: ${failed}/${tests.length}`, failed > 0 ? 'red' : 'green');

  if (success === tests.length) {
    log('\n🎉 ALL EDGE FUNCTIONS ARE WORKING!', 'green');
    log('Your API keys are properly configured.', 'green');
  } else {
    log('\n⚠️  Some Edge Functions are not working', 'yellow');
    log('Check the errors above and:', 'yellow');
    log('1. Verify API keys are set in .env', 'yellow');
    log('2. Run: ./scripts/set-edge-function-secrets.sh', 'yellow');
    log('3. Check logs at: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/functions', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testEdgeFunctions().catch(console.error);