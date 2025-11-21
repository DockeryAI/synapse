/**
 * API Test Runner
 *
 * Executes the comprehensive API test suite
 */

import { apiTestSuite } from './src/services/intelligence/api-test-suite.service';

async function main() {
  try {
    await apiTestSuite.runAllTests();
  } catch (error) {
    console.error('Fatal error running test suite:', error);
    process.exit(1);
  }
}

main();
