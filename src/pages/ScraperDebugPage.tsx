/**
 * Scraper Debug Page
 * Test the V1 scraper in browser environment
 */

import { useState } from 'react';
import { scrapeWebsite } from '@/services/scraping/websiteScraper';

export default function ScraperDebugPage() {
  const [url, setUrl] = useState('https://www.thephoenixinsurancecompany.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testScraper = async () => {
    console.log('[ScraperDebug] Starting test with:', url);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const scrapedData = await scrapeWebsite(url);
      const duration = Date.now() - startTime;

      console.log('[ScraperDebug] Success:', {
        url,
        duration,
        metadata: scrapedData.metadata,
        headingsCount: scrapedData.content.headings.length,
        paragraphsCount: scrapedData.content.paragraphs.length,
      });

      setResult({
        ...scrapedData,
        duration,
      });
    } catch (err) {
      console.error('[ScraperDebug] Error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Scraper Debug Tool</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL to Scrape
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter URL..."
            />
          </div>

          <button
            onClick={testScraper}
            disabled={loading || !url}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
              loading || !url
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Scraping...' : 'Test Scraper'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
                <p className="text-green-700">Scraped in {result.duration}ms</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Metadata</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex">
                    <dt className="font-medium w-24">Title:</dt>
                    <dd className="flex-1 text-gray-700">{result.metadata?.title || 'N/A'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium w-24">Description:</dt>
                    <dd className="flex-1 text-gray-700">{result.metadata?.description || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Content</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex">
                    <dt className="font-medium w-24">Headings:</dt>
                    <dd className="flex-1 text-gray-700">{result.content?.headings?.length || 0}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-medium w-24">Paragraphs:</dt>
                    <dd className="flex-1 text-gray-700">{result.content?.paragraphs?.length || 0}</dd>
                  </div>
                </dl>
              </div>

              {result.content?.headings?.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">First 5 Headings</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {result.content.headings.slice(0, 5).map((heading: string, i: number) => (
                      <li key={i}>• {heading}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}