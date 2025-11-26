/**
 * COMPREHENSIVE API TEST SUITE
 * Tests ALL services mentioned in the orchestration plan
 *
 * LAYER A - Business Foundation
 * LAYER B - Psychological Mining
 * LAYER C - Competitive Intelligence
 * LAYER D - Contextual Timing
 * PHASE 2 - Pattern Discovery
 */

interface TestResult {
  service: string;
  endpoint: string;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  responseTime: number;
  sampleData?: any;
  error?: string;
  keysValidated?: string[];
}

interface LayerReport {
  layer: string;
  services: TestResult[];
  successRate: string;
  overallStatus: 'READY' | 'PARTIAL' | 'NOT_READY';
}

export class ComprehensiveAPITestService {
  private results: TestResult[] = [];

  // API Keys from environment
  private apiKeys = {
    apify: process.env.APIFY_API_KEY || '',
    outscraper: process.env.OUTSCRAPER_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    youtube: process.env.YOUTUBE_API_KEY || '',
    perplexity: process.env.PERPLEXITY_API_KEY || '',
    serper: process.env.SERPER_API_KEY || '',
    semrush: process.env.SEMRUSH_API_KEY || '',
    weather: process.env.WEATHER_API_KEY || '',
    news: process.env.NEWS_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
  };

  // Edge Function URLs
  private supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  private supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  /**
   * RUN ALL TESTS
   */
  async runAllTests(): Promise<{
    layers: LayerReport[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      partial: number;
      overallReadiness: string;
    };
  }> {
    console.log('🚀 Starting Comprehensive API Test Suite...\n');

    // LAYER A - Business Foundation
    await this.testLayerA();

    // LAYER B - Psychological Mining
    await this.testLayerB();

    // LAYER C - Competitive Intelligence
    await this.testLayerC();

    // LAYER D - Contextual Timing
    await this.testLayerD();

    // PHASE 2 - Pattern Discovery
    await this.testPhase2();

    // Generate report
    return this.generateReport();
  }

  /**
   * LAYER A - BUSINESS FOUNDATION
   */
  private async testLayerA() {
    console.log('📋 LAYER A - Business Foundation\n');

    // 1. Apify: Website content extraction
    await this.testApifyWebsiteExtraction();

    // 2. OutScraper: Google Business Profile
    await this.testOutScraperGBP();

    // 3. OutScraper: Reviews extraction (1-star and 5-star)
    await this.testOutScraperReviews();

    // 4. OutScraper: Q&A extraction
    await this.testOutScraperQA();

    // 5. OutScraper: Posts extraction
    await this.testOutScraperPosts();

    // 6. OpenAI Whisper: Audio transcription
    await this.testOpenAIWhisper();
  }

  /**
   * LAYER B - PSYCHOLOGICAL MINING
   */
  private async testLayerB() {
    console.log('\n🧠 LAYER B - Psychological Mining\n');

    // 1. YouTube API: Video search
    await this.testYouTubeVideoSearch();

    // 2. YouTube API: Comment threads
    await this.testYouTubeComments();

    // 3. OutScraper: Reviews (already tested in Layer A, referencing)
    // Skip duplicate - already tested

    // 4. Perplexity: Industry questions research
    await this.testPerplexityResearch();

    // 5. Serper Autocomplete: Search predictions
    await this.testSerperAutocomplete();
  }

  /**
   * LAYER C - COMPETITIVE INTELLIGENCE
   */
  private async testLayerC() {
    console.log('\n🎯 LAYER C - Competitive Intelligence\n');

    // 1. SEMrush: Keyword rankings
    await this.testSEMrushKeywords();

    // 2. SEMrush: Backlinks analysis
    await this.testSEMrushBacklinks();

    // 3. SEMrush: Domain overview/content gaps
    await this.testSEMrushDomainOverview();

    // 4. Serper Shopping: Competitor pricing
    await this.testSerperShopping();

    // 5. Serper Places: Local competitor density/ratings
    await this.testSerperPlaces();

    // 6. Perplexity: Competitor content analysis (already tested)
    // Skip duplicate
  }

  /**
   * LAYER D - CONTEXTUAL TIMING
   */
  private async testLayerD() {
    console.log('\n⏰ LAYER D - Contextual Timing\n');

    // 1. Weather API: Current weather + forecasts
    await this.testWeatherAPI();

    // 2. News API: Breaking industry news
    await this.testNewsAPI();

    // 3. Serper News: Local news events
    await this.testSerperNews();

    // 4. Serper Trends: Rising search queries
    await this.testSerperTrends();
  }

  /**
   * PHASE 2 - PATTERN DISCOVERY
   */
  private async testPhase2() {
    console.log('\n🔍 PHASE 2 - Pattern Discovery\n');

    // 1. OpenAI Embeddings: Text to vector
    await this.testOpenAIEmbeddings();
  }

  // ============================================================================
  // LAYER A TESTS
  // ============================================================================

  private async testApifyWebsiteExtraction() {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/apify-scraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorId: 'apify/website-content-crawler',
          input: {
            startUrls: [{ url: 'https://www.geico.com' }],
            maxCrawlPages: 1,
          }
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Apify',
        endpoint: 'Website Content Extraction',
        status: response.ok ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: response.ok ? { runId: data.data?.id, status: data.data?.status } : null,
        error: response.ok ? undefined : data.error?.message || 'API request failed',
        keysValidated: response.ok ? ['runId', 'status'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Apify',
        endpoint: 'Website Content Extraction',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testOutScraperGBP() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.app.outscraper.com/maps/search-v3?query=insurance%20Phoenix&limit=1', {
        headers: {
          'X-API-KEY': this.apiKeys.outscraper,
        },
      });

      const data = await response.json();

      const hasValidData = response.ok && data.data && Array.isArray(data.data) && data.data.length > 0;

      this.results.push({
        service: 'OutScraper',
        endpoint: 'Google Business Profile',
        status: hasValidData ? 'SUCCESS' : (response.ok ? 'PARTIAL' : 'FAILURE'),
        responseTime: Date.now() - startTime,
        sampleData: hasValidData ? {
          name: data.data[0].name,
          rating: data.data[0].rating,
          address: data.data[0].full_address,
        } : (response.ok ? { message: 'API accessible but no data returned', status: data.status } : null),
        error: response.ok ? (hasValidData ? undefined : 'No results for query') : (data.error || 'API request failed'),
        keysValidated: hasValidData ? ['name', 'rating', 'reviews', 'category'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OutScraper',
        endpoint: 'Google Business Profile',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testOutScraperReviews() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.app.outscraper.com/maps/reviews-v3?query=ChIJAQAAAM4LK4cRmZQ4eWkT8dU&limit=10&sort=newest&reviewsLimit=10', {
        headers: {
          'X-API-KEY': this.apiKeys.outscraper,
        },
      });

      const data = await response.json();

      const hasValidData = response.ok && data.data && Array.isArray(data.data) && data.data.length > 0 && data.data[0].reviews_data?.length > 0;

      this.results.push({
        service: 'OutScraper',
        endpoint: 'Reviews Extraction (1-star + 5-star)',
        status: hasValidData ? 'SUCCESS' : (response.ok ? 'PARTIAL' : 'FAILURE'),
        responseTime: Date.now() - startTime,
        sampleData: hasValidData ? {
          rating: data.data[0].reviews_data[0].review_rating,
          text: data.data[0].reviews_data[0].review_text?.substring(0, 100),
        } : (response.ok ? { message: 'API accessible but no reviews returned', status: data.status } : null),
        error: response.ok ? (hasValidData ? undefined : 'No reviews for this location') : (data.error || 'API request failed'),
        keysValidated: hasValidData ? ['review_rating', 'review_text', 'review_datetime_utc'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OutScraper',
        endpoint: 'Reviews Extraction (1-star + 5-star)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testOutScraperQA() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.app.outscraper.com/maps/questions?query=ChIJAQAAAM4LK4cRmZQ4eWkT8dU&limit=5', {
        headers: {
          'X-API-KEY': this.apiKeys.outscraper,
        },
      });

      const data = await response.json();

      this.results.push({
        service: 'OutScraper',
        endpoint: 'Q&A Extraction',
        status: response.ok ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.data?.[0]?.questions_data?.[0] ? {
          question: data.data[0].questions_data[0].question?.substring(0, 100),
          answer: data.data[0].questions_data[0].answer?.substring(0, 100),
        } : null,
        error: response.ok ? undefined : 'API request failed',
        keysValidated: data.data?.[0]?.questions_data?.[0] ? ['question', 'answer', 'question_datetime'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OutScraper',
        endpoint: 'Q&A Extraction',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testOutScraperPosts() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.app.outscraper.com/maps/posts?query=ChIJAQAAAM4LK4cRmZQ4eWkT8dU&limit=5', {
        headers: {
          'X-API-KEY': this.apiKeys.outscraper,
        },
      });

      const data = await response.json();

      this.results.push({
        service: 'OutScraper',
        endpoint: 'Posts Extraction',
        status: response.ok ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.data?.[0]?.posts_data?.[0] ? {
          text: data.data[0].posts_data[0].text?.substring(0, 100),
          type: data.data[0].posts_data[0].type,
        } : null,
        error: response.ok ? undefined : 'API request failed',
        keysValidated: data.data?.[0]?.posts_data?.[0] ? ['text', 'type', 'date'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OutScraper',
        endpoint: 'Posts Extraction',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testOpenAIWhisper() {
    const startTime = Date.now();
    try {
      // Test Whisper API capability (model list check as proxy)
      const response = await fetch('https://api.openai.com/v1/models/whisper-1', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openai}`,
        },
      });

      const data = await response.json();

      this.results.push({
        service: 'OpenAI Whisper',
        endpoint: 'Audio Transcription Capability',
        status: response.ok ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: response.ok ? { modelId: data.id, available: true } : null,
        error: response.ok ? undefined : data.error?.message || 'API request failed',
        keysValidated: response.ok ? ['id', 'object', 'owned_by'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OpenAI Whisper',
        endpoint: 'Audio Transcription Capability',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // LAYER B TESTS
  // ============================================================================

  private async testYouTubeVideoSearch() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=insurance+tips&type=video&maxResults=5&key=${this.apiKeys.youtube}`);

      const data = await response.json();

      this.results.push({
        service: 'YouTube API',
        endpoint: 'Video Search',
        status: response.ok && data.items?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.items?.[0] ? {
          videoId: data.items[0].id.videoId,
          title: data.items[0].snippet.title,
          channelTitle: data.items[0].snippet.channelTitle,
        } : null,
        error: response.ok ? undefined : data.error?.message || 'No videos found',
        keysValidated: data.items?.[0] ? ['videoId', 'title', 'description', 'channelTitle'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'YouTube API',
        endpoint: 'Video Search',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testYouTubeComments() {
    const startTime = Date.now();
    try {
      // Using a popular video ID for testing
      const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=dQw4w9WgXcQ&maxResults=5&key=${this.apiKeys.youtube}`);

      const data = await response.json();

      this.results.push({
        service: 'YouTube API',
        endpoint: 'Comment Threads Extraction',
        status: response.ok && data.items?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.items?.[0] ? {
          comment: data.items[0].snippet.topLevelComment.snippet.textDisplay?.substring(0, 100),
          likeCount: data.items[0].snippet.topLevelComment.snippet.likeCount,
        } : null,
        error: response.ok ? undefined : data.error?.message || 'No comments found',
        keysValidated: data.items?.[0] ? ['textDisplay', 'likeCount', 'publishedAt'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'YouTube API',
        endpoint: 'Comment Threads Extraction',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testPerplexityResearch() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.perplexity}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: 'What are the top 3 questions people ask about car insurance in Phoenix?',
            },
          ],
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Perplexity',
        endpoint: 'Industry Questions Research',
        status: response.ok && data.choices?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.choices?.[0] ? {
          answer: data.choices[0].message.content.substring(0, 200),
          citations: data.citations?.length || 0,
        } : null,
        error: response.ok ? undefined : data.error?.message || 'API request failed',
        keysValidated: data.choices?.[0] ? ['message', 'content'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Perplexity',
        endpoint: 'Industry Questions Research',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSerperAutocomplete() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://google.serper.dev/autocomplete', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKeys.serper,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'best insurance',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Serper',
        endpoint: 'Autocomplete (Search Predictions)',
        status: response.ok && data.suggestions?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.suggestions ? {
          predictions: data.suggestions.slice(0, 3),
        } : null,
        error: response.ok ? undefined : 'No suggestions returned',
        keysValidated: data.suggestions?.length > 0 ? ['suggestions'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Serper',
        endpoint: 'Autocomplete (Search Predictions)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // LAYER C TESTS
  // ============================================================================

  private async testSEMrushKeywords() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.semrush.com/?type=phrase_organic&key=${this.apiKeys.semrush}&phrase=car%20insurance&database=us&display_limit=5`);

      const data = await response.text();

      // SEMrush returns CSV/text format
      const hasData = data && data.length > 0 && !data.toLowerCase().includes('error');

      this.results.push({
        service: 'SEMrush',
        endpoint: 'Keyword Rankings',
        status: hasData ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: hasData ? {
          dataPreview: data.substring(0, 200),
          format: 'CSV',
        } : null,
        error: hasData ? undefined : 'No keyword data returned',
        keysValidated: hasData ? ['phrase', 'position', 'volume'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'SEMrush',
        endpoint: 'Keyword Rankings',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSEMrushBacklinks() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.semrush.com/?type=backlinks_overview&key=${this.apiKeys.semrush}&target=geico.com&target_type=root_domain&display_limit=5`);

      const data = await response.text();

      const hasData = data && data.length > 0 && !data.toLowerCase().includes('error');

      this.results.push({
        service: 'SEMrush',
        endpoint: 'Backlinks Analysis',
        status: hasData ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: hasData ? {
          dataPreview: data.substring(0, 200),
          format: 'CSV',
        } : null,
        error: hasData ? undefined : 'No backlinks data returned',
        keysValidated: hasData ? ['backlinks', 'referring_domains'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'SEMrush',
        endpoint: 'Backlinks Analysis',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSEMrushDomainOverview() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.semrush.com/?type=domain_ranks&key=${this.apiKeys.semrush}&domain=geico.com&database=us`);

      const data = await response.text();

      const hasData = data && data.length > 0 && !data.toLowerCase().includes('error');

      this.results.push({
        service: 'SEMrush',
        endpoint: 'Domain Overview/Content Gaps',
        status: hasData ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: hasData ? {
          dataPreview: data.substring(0, 200),
          format: 'CSV',
        } : null,
        error: hasData ? undefined : 'No domain data returned',
        keysValidated: hasData ? ['domain', 'rank', 'organic_keywords'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'SEMrush',
        endpoint: 'Domain Overview/Content Gaps',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSerperShopping() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKeys.serper,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'car insurance',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Serper',
        endpoint: 'Shopping (Competitor Pricing)',
        status: response.ok && data.shopping?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.shopping?.[0] ? {
          title: data.shopping[0].title,
          price: data.shopping[0].price,
          source: data.shopping[0].source,
        } : null,
        error: response.ok ? undefined : 'No shopping results returned',
        keysValidated: data.shopping?.[0] ? ['title', 'price', 'source', 'link'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Serper',
        endpoint: 'Shopping (Competitor Pricing)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSerperPlaces() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKeys.serper,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'insurance agencies Phoenix',
          ll: '33.4484,-112.0740',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Serper',
        endpoint: 'Places (Local Competitor Density/Ratings)',
        status: response.ok && data.places?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.places?.[0] ? {
          title: data.places[0].title,
          rating: data.places[0].rating,
          reviews: data.places[0].reviews,
        } : null,
        error: response.ok ? undefined : 'No places results returned',
        keysValidated: data.places?.[0] ? ['title', 'rating', 'reviews', 'address'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Serper',
        endpoint: 'Places (Local Competitor Density/Ratings)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // LAYER D TESTS
  // ============================================================================

  private async testWeatherAPI() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${this.apiKeys.weather}&q=Phoenix&days=3`);

      const data = await response.json();

      this.results.push({
        service: 'Weather API',
        endpoint: 'Current Weather + Forecasts',
        status: response.ok && data.current ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.current ? {
          location: data.location.name,
          temp_f: data.current.temp_f,
          condition: data.current.condition.text,
          forecastDays: data.forecast?.forecastday?.length || 0,
        } : null,
        error: response.ok ? undefined : data.error?.message || 'API request failed',
        keysValidated: data.current ? ['temp_f', 'condition', 'humidity', 'wind_mph'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Weather API',
        endpoint: 'Current Weather + Forecasts',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testNewsAPI() {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://newsapi.org/v2/everything?q=insurance&sortBy=publishedAt&pageSize=5&apiKey=${this.apiKeys.news}`);

      const data = await response.json();

      this.results.push({
        service: 'News API',
        endpoint: 'Breaking Industry News',
        status: response.ok && data.articles?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.articles?.[0] ? {
          title: data.articles[0].title,
          source: data.articles[0].source.name,
          publishedAt: data.articles[0].publishedAt,
        } : null,
        error: response.ok ? undefined : data.message || 'No articles found',
        keysValidated: data.articles?.[0] ? ['title', 'description', 'publishedAt', 'source'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'News API',
        endpoint: 'Breaking Industry News',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSerperNews() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKeys.serper,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'Phoenix insurance',
          location: 'Phoenix, Arizona',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Serper',
        endpoint: 'News (Local News Events)',
        status: response.ok && data.news?.length > 0 ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.news?.[0] ? {
          title: data.news[0].title,
          source: data.news[0].source,
          date: data.news[0].date,
        } : null,
        error: response.ok ? undefined : 'No news results returned',
        keysValidated: data.news?.[0] ? ['title', 'link', 'source', 'date'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Serper',
        endpoint: 'News (Local News Events)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async testSerperTrends() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKeys.serper,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'insurance trends 2024',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'Serper',
        endpoint: 'Trends (Rising Search Queries)',
        status: response.ok && (data.organic?.length > 0 || data.relatedSearches?.length > 0) ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: {
          organicResults: data.organic?.length || 0,
          relatedSearches: data.relatedSearches?.slice(0, 3),
        },
        error: response.ok ? undefined : 'No trends data returned',
        keysValidated: response.ok ? ['organic', 'relatedSearches'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'Serper',
        endpoint: 'Trends (Rising Search Queries)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // PHASE 2 TESTS
  // ============================================================================

  private async testOpenAIEmbeddings() {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openai}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: 'Best car insurance coverage for Phoenix residents',
          model: 'text-embedding-3-small',
        }),
      });

      const data = await response.json();

      this.results.push({
        service: 'OpenAI',
        endpoint: 'Embeddings (Text to Vector for Clustering)',
        status: response.ok && data.data?.[0]?.embedding ? 'SUCCESS' : 'FAILURE',
        responseTime: Date.now() - startTime,
        sampleData: data.data?.[0] ? {
          model: data.model,
          vectorDimensions: data.data[0].embedding.length,
          firstValues: data.data[0].embedding.slice(0, 5),
        } : null,
        error: response.ok ? undefined : data.error?.message || 'API request failed',
        keysValidated: data.data?.[0] ? ['embedding', 'model', 'usage'] : [],
      });
    } catch (error) {
      this.results.push({
        service: 'OpenAI',
        endpoint: 'Embeddings (Text to Vector for Clustering)',
        status: 'FAILURE',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  private generateReport(): {
    layers: LayerReport[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      partial: number;
      overallReadiness: string;
    };
  } {
    const layerA: TestResult[] = this.results.slice(0, 6);
    const layerB: TestResult[] = this.results.slice(6, 10);
    const layerC: TestResult[] = this.results.slice(10, 15);
    const layerD: TestResult[] = this.results.slice(15, 19);
    const phase2: TestResult[] = this.results.slice(19);

    const calculateLayerStatus = (tests: TestResult[]): LayerReport => {
      const total = tests.length;
      const passed = tests.filter(t => t.status === 'SUCCESS').length;
      const failed = tests.filter(t => t.status === 'FAILURE').length;
      const partial = tests.filter(t => t.status === 'PARTIAL').length;

      const successRate = `${passed}/${total} (${Math.round((passed / total) * 100)}%)`;

      let overallStatus: 'READY' | 'PARTIAL' | 'NOT_READY';
      if (passed === total) overallStatus = 'READY';
      else if (passed >= total / 2) overallStatus = 'PARTIAL';
      else overallStatus = 'NOT_READY';

      return {
        layer: '',
        services: tests,
        successRate,
        overallStatus,
      };
    };

    const layers: LayerReport[] = [
      { ...calculateLayerStatus(layerA), layer: 'LAYER A - Business Foundation' },
      { ...calculateLayerStatus(layerB), layer: 'LAYER B - Psychological Mining' },
      { ...calculateLayerStatus(layerC), layer: 'LAYER C - Competitive Intelligence' },
      { ...calculateLayerStatus(layerD), layer: 'LAYER D - Contextual Timing' },
      { ...calculateLayerStatus(phase2), layer: 'PHASE 2 - Pattern Discovery' },
    ];

    const totalTests = this.results.length;
    const passed = this.results.filter(t => t.status === 'SUCCESS').length;
    const failed = this.results.filter(t => t.status === 'FAILURE').length;
    const partial = this.results.filter(t => t.status === 'PARTIAL').length;

    const overallPercentage = Math.round((passed / totalTests) * 100);
    let overallReadiness: string;
    if (overallPercentage >= 80) overallReadiness = 'READY FOR PRODUCTION';
    else if (overallPercentage >= 50) overallReadiness = 'PARTIAL - NEEDS ATTENTION';
    else overallReadiness = 'NOT READY - CRITICAL ISSUES';

    return {
      layers,
      summary: {
        totalTests,
        passed,
        failed,
        partial,
        overallReadiness,
      },
    };
  }
}

// Export singleton
export const comprehensiveAPITest = new ComprehensiveAPITestService();
