#!/usr/bin/env node

/**
 * Performance Testing for Optimized API Loading Architecture
 * Tests Netflix/Spotify-style phased loading with cache-first display
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Import our modules
import { optimizedAPILoader } from './src/services/intelligence/optimized-api-loader.service.ts';
import { apiCache } from './src/services/intelligence/api-cache.service.ts';
import { concurrencyLimiter } from './src/services/intelligence/concurrency-limiter.service.ts';
import { streamingApiManager } from './src/services/intelligence/streaming-api-manager.ts';

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test brand
const testBrand = {
  name: 'Starbucks',
  industry: {
    code: 'retail',
    naics_code: '722513', // Coffee shops - should trigger weather API
    description: 'Coffee and Snack Shops'
  },
  location: {
    city: 'Seattle',
    state: 'WA',
    country: 'USA'
  }
};

// Performance targets
const PERFORMANCE_TARGETS = {
  cacheDisplay: 100,      // Phase 0: <100ms
  firstFreshData: 3000,   // Phase 1: <3s
  coreIntelligence: 15000,// Phase 2: <15s
  fullB2CLoad: 30000,     // Phase 3: <30s
  fullB2BLoad: 60000      // Phase 4: <60s (for B2B industries)
};

// Track metrics
const metrics = {
  phaseTimings: new Map(),
  apiTimings: new Map(),
  cacheHits: 0,
  cacheMisses: 0,
  errors: []
};

// ============================================================================
// TEST CACHE-FIRST DISPLAY
// ============================================================================
async function testCacheFirstDisplay() {
  log('\n════════════════════════════════════════════', 'blue');
  log('TESTING PHASE 0: CACHE-FIRST DISPLAY', 'blue');
  log('Target: <100ms', 'cyan');
  log('════════════════════════════════════════════', 'blue');

  // Pre-populate cache for testing
  log('\n1. Pre-populating cache with test data...', 'yellow');

  const cacheData = {
    'serper-search': { results: ['cached search result 1', 'cached search result 2'] },
    'youtube-trending': { videos: ['cached video 1', 'cached video 2'] },
    'semrush-keywords': { keywords: ['cached keyword 1', 'cached keyword 2'] }
  };

  for (const [apiType, data] of Object.entries(cacheData)) {
    const key = apiCache.generateKey(apiType, {
      brand: testBrand.name,
      industry: testBrand.industry.code
    });
    apiCache['set'](key, data);
  }

  log('✅ Cache populated with test data', 'green');

  // Test cache retrieval speed
  log('\n2. Testing cache retrieval speed...', 'yellow');

  const cacheStart = performance.now();
  const cachedData = apiCache.getAllCachedData();
  const cacheTime = performance.now() - cacheStart;

  if (cacheTime < PERFORMANCE_TARGETS.cacheDisplay) {
    log(`✅ Cache retrieved in ${cacheTime.toFixed(2)}ms (Target: <100ms)`, 'green');
  } else {
    log(`❌ Cache retrieval too slow: ${cacheTime.toFixed(2)}ms (Target: <100ms)`, 'red');
  }

  metrics.phaseTimings.set('cache-display', cacheTime);

  return cacheTime < PERFORMANCE_TARGETS.cacheDisplay;
}

// ============================================================================
// TEST PHASED LOADING
// ============================================================================
async function testPhasedLoading() {
  log('\n════════════════════════════════════════════', 'blue');
  log('TESTING PHASED LOADING ARCHITECTURE', 'blue');
  log('════════════════════════════════════════════', 'blue');

  const phaseMetrics = new Map();
  let phaseCount = 0;
  let apiCount = 0;

  // Listen to loader events
  optimizedAPILoader.on('phase-start', (event) => {
    log(`\n📊 Phase Started: ${event.name}`, 'cyan');
    log(`   Priority: ${event.priority}`, 'yellow');
    log(`   APIs: ${event.apis.join(', ')}`, 'yellow');
    phaseMetrics.set(event.name, { start: performance.now() });
    phaseCount++;
  });

  optimizedAPILoader.on('phase-complete', (event) => {
    const phase = phaseMetrics.get(event.name);
    if (phase) {
      phase.end = performance.now();
      phase.duration = event.duration;
      log(`✅ Phase Complete: ${event.name} in ${event.duration.toFixed(0)}ms`, 'green');
    }
  });

  optimizedAPILoader.on('api-update', (event) => {
    apiCount++;
    log(`   📦 ${event.type}: ${event.isStale ? 'STALE' : 'FRESH'} data`, event.isStale ? 'yellow' : 'green');
    metrics.apiTimings.set(event.type, performance.now());
  });

  optimizedAPILoader.on('progress', (event) => {
    if (event.totalProgress % 25 === 0) {
      log(`⏳ Progress: ${event.totalProgress.toFixed(0)}% (${event.loaded}/${event.total} APIs)`, 'cyan');
    }
  });

  optimizedAPILoader.on('load-complete', (event) => {
    log('\n════════════════════════════════════════════', 'magenta');
    log('LOAD COMPLETE - FINAL METRICS', 'magenta');
    log('════════════════════════════════════════════', 'magenta');

    const summary = event.metrics.summary;
    log(`\n📈 Performance Summary:`, 'cyan');
    log(`   Total Time: ${summary.totalTime.toFixed(0)}ms`, 'yellow');
    log(`   APIs Loaded: ${summary.apisLoaded}`, 'yellow');
    log(`   Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`, 'yellow');
    log(`   Average API Time: ${summary.averageAPITime.toFixed(0)}ms`, 'yellow');

    if (event.metrics.firstDataTime) {
      log(`   First Data: ${event.metrics.firstDataTime.toFixed(0)}ms`, 'yellow');
    }
    if (event.metrics.fiftyPercentTime) {
      log(`   50% Loaded: ${event.metrics.fiftyPercentTime.toFixed(0)}ms`, 'yellow');
    }
    if (event.metrics.ninetyPercentTime) {
      log(`   90% Loaded: ${event.metrics.ninetyPercentTime.toFixed(0)}ms`, 'yellow');
    }
  });

  // Start the optimized load
  log('\n🚀 Starting optimized load for:', 'cyan');
  log(`   Brand: ${testBrand.name}`, 'yellow');
  log(`   Industry: ${testBrand.industry.description} (NAICS: ${testBrand.industry.naics_code})`, 'yellow');

  const loadStart = performance.now();

  try {
    await optimizedAPILoader.loadDataOptimized(testBrand);

    const loadTime = performance.now() - loadStart;
    log(`\n✅ Full load completed in ${loadTime.toFixed(0)}ms`, 'green');

    return {
      success: true,
      totalTime: loadTime,
      phaseCount,
      apiCount,
      phases: phaseMetrics
    };
  } catch (error) {
    log(`\n❌ Load failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// TEST CONCURRENCY LIMITING
// ============================================================================
async function testConcurrencyLimiter() {
  log('\n════════════════════════════════════════════', 'blue');
  log('TESTING CONCURRENCY LIMITER', 'blue');
  log('Target: Max 6 parallel connections', 'cyan');
  log('════════════════════════════════════════════', 'blue');

  // Create 20 test tasks
  const tasks = Array.from({ length: 20 }, (_, i) => ({
    fn: () => new Promise(resolve => {
      const delay = Math.random() * 1000 + 500; // 500-1500ms
      setTimeout(() => resolve(`Task ${i + 1} complete`), delay);
    }),
    id: `task-${i + 1}`,
    priority: Math.floor(Math.random() * 4) + 1 // Random priority 1-4
  }));

  log('\n📊 Testing with 20 tasks...', 'yellow');

  let maxConcurrent = 0;
  let currentConcurrent = 0;

  // Monitor concurrency
  const originalExecute = concurrencyLimiter['executeItem'];
  concurrencyLimiter['executeItem'] = async function(item) {
    currentConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    log(`   Active: ${currentConcurrent} (Max: ${maxConcurrent})`, 'cyan');

    const result = await originalExecute.call(this, item);
    currentConcurrent--;
    return result;
  };

  const start = performance.now();
  await concurrencyLimiter.executeMany(tasks, (completed, total) => {
    if (completed % 5 === 0) {
      log(`   Progress: ${completed}/${total} tasks`, 'yellow');
    }
  });
  const duration = performance.now() - start;

  // Restore original method
  concurrencyLimiter['executeItem'] = originalExecute;

  log(`\n✅ All tasks completed in ${duration.toFixed(0)}ms`, 'green');

  if (maxConcurrent <= 6) {
    log(`✅ Concurrency properly limited: Max ${maxConcurrent} parallel`, 'green');
  } else {
    log(`❌ Concurrency limit exceeded: ${maxConcurrent} parallel (should be ≤6)`, 'red');
  }

  return maxConcurrent <= 6;
}

// ============================================================================
// TEST SWR PATTERN
// ============================================================================
async function testSWRPattern() {
  log('\n════════════════════════════════════════════', 'blue');
  log('TESTING STALE-WHILE-REVALIDATE PATTERN', 'blue');
  log('════════════════════════════════════════════', 'blue');

  const testKey = 'test-swr-key';
  let fetchCount = 0;

  // Mock fetcher that tracks calls
  const mockFetcher = async () => {
    fetchCount++;
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: `Fresh data #${fetchCount}`, timestamp: Date.now() };
  };

  log('\n1. Testing initial fetch...', 'yellow');
  const result1 = await apiCache.getWithSWR(testKey, mockFetcher);
  log(`   Data: ${JSON.stringify(result1.data)}`, 'cyan');
  log(`   Is Stale: ${result1.isStale}`, 'cyan');
  log(`   Fetch count: ${fetchCount}`, 'yellow');

  log('\n2. Testing cached response (should be immediate)...', 'yellow');
  const start = performance.now();
  const result2 = await apiCache.getWithSWR(testKey, mockFetcher);
  const cacheTime = performance.now() - start;
  log(`   Retrieved in: ${cacheTime.toFixed(2)}ms`, 'cyan');
  log(`   Is Stale: ${result2.isStale}`, 'cyan');
  log(`   Fetch count: ${fetchCount} (should not increase)`, 'yellow');

  if (cacheTime < 10) {
    log('✅ Cache returned immediately', 'green');
  } else {
    log('❌ Cache retrieval too slow', 'red');
  }

  // Make data stale
  log('\n3. Forcing stale state...', 'yellow');
  apiCache['cache'].get(testKey).timestamp = Date.now() - 7200000; // 2 hours ago

  log('\n4. Testing stale-while-revalidate...', 'yellow');
  let staleReceived = false;
  let freshReceived = false;

  const result3 = await apiCache.getWithSWR(testKey, mockFetcher, {
    onStale: (data) => {
      staleReceived = true;
      log('   📦 Received STALE data immediately', 'yellow');
    },
    onFresh: (data) => {
      freshReceived = true;
      log('   📦 Received FRESH data from background revalidation', 'green');
    }
  });

  // Wait for background revalidation
  await new Promise(resolve => setTimeout(resolve, 600));

  if (staleReceived) {
    log('✅ SWR pattern working: Stale data served immediately', 'green');
  } else {
    log('❌ SWR pattern failed: No stale data served', 'red');
  }

  return staleReceived;
}

// ============================================================================
// PERFORMANCE REPORT
// ============================================================================
function generatePerformanceReport(results) {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║             PERFORMANCE TEST REPORT                        ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\n📊 Target vs Actual Performance:', 'cyan');
  log('┌────────────────────────────────────────────────────────────┐', 'blue');

  // Cache Display
  const cacheTime = metrics.phaseTimings.get('cache-display') || 0;
  const cacheStatus = cacheTime < PERFORMANCE_TARGETS.cacheDisplay ? '✅' : '❌';
  log(`│ Cache Display:     ${cacheStatus} ${cacheTime.toFixed(0)}ms / ${PERFORMANCE_TARGETS.cacheDisplay}ms     │`,
      cacheTime < PERFORMANCE_TARGETS.cacheDisplay ? 'green' : 'red');

  // First Fresh Data
  const firstDataTime = results.phased?.phases?.get('critical-context')?.duration || 0;
  const firstDataStatus = firstDataTime < PERFORMANCE_TARGETS.firstFreshData ? '✅' : '❌';
  log(`│ First Fresh Data:  ${firstDataStatus} ${firstDataTime.toFixed(0)}ms / ${PERFORMANCE_TARGETS.firstFreshData}ms  │`,
      firstDataTime < PERFORMANCE_TARGETS.firstFreshData ? 'green' : 'red');

  // Core Intelligence
  const coreTime = results.phased?.phases?.get('psychological-triggers')?.duration || 0;
  const coreStatus = coreTime < PERFORMANCE_TARGETS.coreIntelligence ? '✅' : '❌';
  log(`│ Core Intelligence: ${coreStatus} ${coreTime.toFixed(0)}ms / ${PERFORMANCE_TARGETS.coreIntelligence}ms │`,
      coreTime < PERFORMANCE_TARGETS.coreIntelligence ? 'green' : 'red');

  log('└────────────────────────────────────────────────────────────┘', 'blue');

  log('\n🎯 Test Results Summary:', 'cyan');
  log(`• Cache-First Display: ${results.cache ? 'PASSED' : 'FAILED'}`, results.cache ? 'green' : 'red');
  log(`• Concurrency Limiting: ${results.concurrency ? 'PASSED' : 'FAILED'}`, results.concurrency ? 'green' : 'red');
  log(`• SWR Pattern: ${results.swr ? 'PASSED' : 'FAILED'}`, results.swr ? 'green' : 'red');
  log(`• Phased Loading: ${results.phased?.success ? 'PASSED' : 'FAILED'}`, results.phased?.success ? 'green' : 'red');

  const allPassed = results.cache && results.concurrency && results.swr && results.phased?.success;

  log('\n════════════════════════════════════════════', 'magenta');
  if (allPassed) {
    log('🎉 ALL PERFORMANCE TESTS PASSED!', 'green');
    log('The optimized loading architecture is working correctly.', 'green');
  } else {
    log('⚠️  SOME TESTS FAILED', 'red');
    log('Review the results above for details.', 'yellow');
  }
  log('════════════════════════════════════════════', 'magenta');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runPerformanceTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║     OPTIMIZED API LOADING PERFORMANCE TEST SUITE           ║', 'magenta');
  log('║     Netflix/Spotify-Style Architecture Validation          ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  const results = {};

  try {
    // Test 1: Cache-First Display
    results.cache = await testCacheFirstDisplay();
  } catch (error) {
    log(`\n❌ Cache test failed: ${error.message}`, 'red');
    results.cache = false;
  }

  try {
    // Test 2: Concurrency Limiting
    results.concurrency = await testConcurrencyLimiter();
  } catch (error) {
    log(`\n❌ Concurrency test failed: ${error.message}`, 'red');
    results.concurrency = false;
  }

  try {
    // Test 3: SWR Pattern
    results.swr = await testSWRPattern();
  } catch (error) {
    log(`\n❌ SWR test failed: ${error.message}`, 'red');
    results.swr = false;
  }

  try {
    // Test 4: Phased Loading
    results.phased = await testPhasedLoading();
  } catch (error) {
    log(`\n❌ Phased loading test failed: ${error.message}`, 'red');
    results.phased = { success: false, error: error.message };
  }

  // Generate report
  generatePerformanceReport(results);

  // Return exit code
  const allPassed = results.cache && results.concurrency && results.swr && results.phased?.success;
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runPerformanceTests().catch(error => {
  log('\n❌ Test runner failed:', 'red');
  console.error(error);
  process.exit(1);
});