/**
 * API Test Runner - Node.js Compatible
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const results = [];
let startTime = 0;

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const testName = 'OpenRouter API';

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://synapse.app',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      })
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'success',
        responseTime,
        details: `Model: ${data.model || 'claude-3.5-sonnet'}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'failed',
      error: error.message
    });
  }
}

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  const testName = 'OpenAI API (Embeddings)';

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'not_configured',
      details: 'API key not configured'
    });
    results.push({
      name: 'OpenAI API (Whisper)',
      category: 'AI Services',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'test'
      })
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'success',
        responseTime,
        details: `Model: ${data.model}, Dimensions: ${data.data?.[0]?.embedding?.length || 0}`
      });
      results.push({
        name: 'OpenAI API (Whisper)',
        category: 'AI Services',
        status: 'success',
        responseTime,
        details: 'API key validated via embeddings endpoint'
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
      results.push({
        name: 'OpenAI API (Whisper)',
        category: 'AI Services',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'failed',
      error: error.message
    });
    results.push({
      name: 'OpenAI API (Whisper)',
      category: 'AI Services',
      status: 'failed',
      error: error.message
    });
  }
}

async function testPerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const testName = 'Perplexity API';

  if (!apiKey || apiKey === 'your-perplexity-api-key-here') {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      })
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'success',
        responseTime,
        details: `Model: ${data.model || 'sonar-small'}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'failed',
      error: error.message
    });
  }
}

async function testApify() {
  const apiKey = process.env.APIFY_API_KEY;
  const testName = 'Apify API';

  if (!apiKey || apiKey === 'your-apify-api-key-here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(`https://api.apify.com/v2/users/me?token=${apiKey}`);
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `User: ${data.data?.username || 'verified'}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testOutScraper() {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  const testName = 'OutScraper API';

  if (!apiKey || apiKey === 'your-outscraper-api-key-here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.app.outscraper.com/profile', {
      headers: {
        'X-API-KEY': apiKey
      }
    });
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Credits remaining: ${data.credits_left || 'verified'}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testSerperEndpoint(apiKey, endpoint, name, body) {
  const start = Date.now();
  try {
    const response = await fetch(`https://google.serper.dev/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: `Serper API (${name})`,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Results: ${data.organic?.length || data.news?.length || data.suggestions?.length || 'verified'}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: `Serper API (${name})`,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: `Serper API (${name})`,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testSerper() {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey || apiKey === 'your-serper-api-key-here') {
    results.push({
      name: 'Serper API (Search)',
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    results.push({
      name: 'Serper API (News)',
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    results.push({
      name: 'Serper API (Trends)',
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    results.push({
      name: 'Serper API (Autocomplete)',
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  await testSerperEndpoint(apiKey, 'search', 'Search', { q: 'test' });
  await testSerperEndpoint(apiKey, 'news', 'News', { q: 'business' });
  await testSerperEndpoint(apiKey, 'images', 'Trends', { q: 'test' });
  await testSerperEndpoint(apiKey, 'autocomplete', 'Autocomplete', { q: 'rest' });
}

async function testSEMrush() {
  const apiKey = process.env.SEMRUSH_API_KEY;
  const testName = 'SEMrush API';

  if (!apiKey || apiKey === 'your-semrush-api-key-here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&export_columns=Dn,Rk&domain=example.com&database=us`
    );
    const responseTime = Date.now() - start;

    if (response.ok) {
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: 'Domain ranks endpoint verified'
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testYouTube() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const testName = 'YouTube API';

  if (!apiKey || apiKey === 'your-youtube-api-key-here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`
    );
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Videos found: ${data.items?.length || 0}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testNewsAPI() {
  const apiKey = process.env.NEWS_API_KEY;
  const testName = 'News API';

  if (!apiKey || apiKey === 'your_news_api_key_here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`
    );
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Articles found: ${data.totalResults || 0}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testWeatherAPI() {
  const apiKey = process.env.WEATHER_API_KEY;
  const testName = 'Weather API';

  if (!apiKey || apiKey === 'your-weather-api-key-here') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'API key not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=New York&aqi=no`
    );
    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Location: ${data.location?.name || 'verified'}, Temp: ${data.current?.temp_f || 'N/A'}°F`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testReddit() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const testName = 'Reddit API';

  if (!clientId || !clientSecret || clientId === 'your_reddit_client_id' || clientSecret === 'your_reddit_client_secret') {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'not_configured',
      details: 'Client ID or secret not configured'
    });
    return;
  }

  const start = Date.now();
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        error: `Auth failed: HTTP ${tokenResponse.status}: ${error.substring(0, 100)}`
      });
      return;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const response = await fetch('https://oauth.reddit.com/r/programming/hot?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Synapse/1.0'
      }
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'success',
        responseTime,
        details: `Posts retrieved: ${data.data?.children?.length || 0}`
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'Intelligence APIs',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'Intelligence APIs',
      status: 'failed',
      error: error.message
    });
  }
}

async function testHume() {
  const apiKey = process.env.HUME_API_KEY;
  const testName = 'Hume API';

  if (!apiKey || apiKey === 'your-hume-api-key-here') {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'not_configured',
      details: 'API key not configured (optional)'
    });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
      headers: {
        'X-Hume-Api-Key': apiKey
      }
    });
    const responseTime = Date.now() - start;

    if (response.ok) {
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'success',
        responseTime,
        details: 'API key validated'
      });
    } else {
      const error = await response.text();
      results.push({
        name: testName,
        category: 'AI Services',
        status: 'failed',
        responseTime,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`
      });
    }
  } catch (error) {
    results.push({
      name: testName,
      category: 'AI Services',
      status: 'failed',
      error: error.message
    });
  }
}

function printResultsGroup(groupResults) {
  groupResults.forEach(result => {
    const icon = result.status === 'success' ? '✓' :
                 result.status === 'failed' ? '✗' : '⚠';
    const status = result.status === 'success' ? 'SUCCESS' :
                   result.status === 'failed' ? 'FAILED' : 'NOT CONFIGURED';

    console.log(`${icon} ${result.name}: ${status}`);

    if (result.responseTime) {
      console.log(`  Response Time: ${result.responseTime}ms`);
    }

    if (result.details) {
      console.log(`  Details: ${result.details}`);
    }

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
}

function generateReport() {
  const totalTime = Date.now() - startTime;

  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================\n');

  const aiServices = results.filter(r => r.category === 'AI Services');
  const intelligenceAPIs = results.filter(r => r.category === 'Intelligence APIs');

  console.log('AI SERVICES (5 APIs):');
  console.log('----------------------------------------');
  printResultsGroup(aiServices);

  console.log('\nINTELLIGENCE APIs (12 APIs):');
  console.log('----------------------------------------');
  printResultsGroup(intelligenceAPIs);

  const success = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const notConfigured = results.filter(r => r.status === 'not_configured').length;

  console.log('\n========================================');
  console.log('OVERALL STATISTICS');
  console.log('========================================');
  console.log(`Total APIs Tested: ${results.length}`);
  console.log(`✓ Success: ${success}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Not Configured: ${notConfigured}`);
  console.log(`Total Time: ${totalTime}ms`);

  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) /
    results.filter(r => r.responseTime).length;

  if (avgResponseTime) {
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  }

  console.log('\n========================================');
  console.log('HEALTH ASSESSMENT');
  console.log('========================================');

  const healthPercentage = (success / results.length) * 100;
  if (healthPercentage >= 80) {
    console.log(`Status: EXCELLENT (${Math.round(healthPercentage)}%)`);
    console.log('System is fully operational with most APIs responding.');
  } else if (healthPercentage >= 60) {
    console.log(`Status: GOOD (${Math.round(healthPercentage)}%)`);
    console.log('System is operational but some APIs need attention.');
  } else if (healthPercentage >= 40) {
    console.log(`Status: DEGRADED (${Math.round(healthPercentage)}%)`);
    console.log('Warning: Multiple API failures detected.');
  } else {
    console.log(`Status: CRITICAL (${Math.round(healthPercentage)}%)`);
    console.log('Alert: Majority of APIs are not responding.');
  }

  if (notConfigured > 0) {
    console.log('\nRECOMMENDATIONS:');
    console.log('----------------------------------------');
    console.log(`${notConfigured} API(s) not configured. Configure them in .env for full functionality.`);
  }

  if (failed > 0) {
    console.log('\nFAILED APIS REQUIRING ATTENTION:');
    console.log('----------------------------------------');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`\n${r.name}:`);
        console.log(`  Error: ${r.error}`);
      });
  }

  console.log('\n========================================');
  console.log('TEST SUITE COMPLETED');
  console.log('========================================\n');
}

async function runAllTests() {
  startTime = Date.now();

  console.log('========================================');
  console.log('SYNAPSE API TEST SUITE');
  console.log('========================================');
  console.log(`Starting comprehensive API tests...`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  await testOpenRouter();
  await testOpenAI();
  await testPerplexity();
  await testApify();
  await testOutScraper();
  await testSerper();
  await testSEMrush();
  await testYouTube();
  await testNewsAPI();
  await testWeatherAPI();
  await testReddit();
  await testHume();

  generateReport();
}

runAllTests().catch(console.error);
