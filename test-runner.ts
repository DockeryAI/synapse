/**
 * TEST RUNNER - Executes comprehensive API test suite
 * Run with: npx tsx test-runner.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { comprehensiveAPITest } from './src/services/intelligence/comprehensive-api-test.service';

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE API TEST SUITE - ORCHESTRATION PLAN VALIDATION ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const report = await comprehensiveAPITest.runAllTests();

  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                         TEST REPORT SUMMARY                        ');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Print each layer
  for (const layer of report.layers) {
    console.log(`\n${layer.layer}`);
    console.log('─'.repeat(70));
    console.log(`Status: ${layer.overallStatus} | Success Rate: ${layer.successRate}\n`);

    for (const service of layer.services) {
      const statusIcon = service.status === 'SUCCESS' ? '✓' : service.status === 'PARTIAL' ? '⚠' : '✗';
      const statusColor = service.status === 'SUCCESS' ? '\x1b[32m' : service.status === 'PARTIAL' ? '\x1b[33m' : '\x1b[31m';

      console.log(`${statusColor}${statusIcon}\x1b[0m ${service.service} - ${service.endpoint}`);
      console.log(`  Response Time: ${service.responseTime}ms`);

      if (service.status === 'SUCCESS') {
        console.log(`  Keys Validated: ${service.keysValidated?.join(', ') || 'N/A'}`);
        if (service.sampleData) {
          console.log(`  Sample Data: ${JSON.stringify(service.sampleData, null, 2).substring(0, 300)}...`);
        }
      } else {
        console.log(`  Error: ${service.error}`);
      }
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                         OVERALL SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`\x1b[32mPassed: ${report.summary.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${report.summary.failed}\x1b[0m`);
  console.log(`\x1b[33mPartial: ${report.summary.partial}\x1b[0m`);
  console.log(`\nOverall Readiness: ${report.summary.overallReadiness}\n`);

  console.log('═══════════════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
