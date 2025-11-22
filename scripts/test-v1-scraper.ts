/**
 * Test V1 Scraper Integration
 * Quick test to verify the V1 scraper works with Phoenix Insurance URL
 */

import { scrapeWebsite } from '../src/services/scraping/websiteScraper';

async function testScraper() {
  console.log('Testing V1 scraper with Phoenix Insurance URL...\n');

  const testUrls = [
    'https://www.thephoenixinsurancecompany.com',
    'https://google.com',
    'https://example.com'
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    console.log('=' .repeat(50));

    try {
      const startTime = Date.now();
      const result = await scrapeWebsite(url);
      const duration = Date.now() - startTime;

      console.log(`✅ Success (${duration}ms)`);
      console.log(`Title: ${result.metadata.title || 'N/A'}`);
      console.log(`Description: ${result.metadata.description?.slice(0, 100) || 'N/A'}...`);
      console.log(`Headings found: ${result.content.headings.length}`);
      console.log(`Paragraphs found: ${result.content.paragraphs.length}`);
      console.log(`Total content length: ${JSON.stringify(result).length} chars`);

      // Show first few headings
      if (result.content.headings.length > 0) {
        console.log('\nFirst 3 headings:');
        result.content.headings.slice(0, 3).forEach(h => {
          console.log(`  - ${h.slice(0, 60)}...`);
        });
      }

    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n\nTest complete!');
  process.exit(0);
}

// Run test
testScraper().catch(console.error);