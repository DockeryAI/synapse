/**
 * Twitter Sales Intelligence Edge Function
 *
 * Extended Twitter API v2 for sales intelligence use cases:
 * - Buyer intent signals ("looking for", "recommend", etc.)
 * - Competitor sentiment tracking
 * - Company/executive account intelligence
 * - Mention monitoring
 *
 * Uses OAuth 2.0 App-Only authentication (Basic tier: 15K reads/month)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting: Basic tier = 60 requests per 15 min window
const RATE_LIMIT_MS = 250; // 4 req/sec max to stay safe
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
}

/**
 * Get OAuth 2.0 Bearer Token using App-Only authentication
 */
async function getBearerToken(apiKey: string, apiSecret: string): Promise<string> {
  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const response = await fetch('https://api.twitter.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Bearer token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Search recent tweets with full field expansion
 */
async function searchTweets(
  bearerToken: string,
  query: string,
  maxResults: number = 20
): Promise<any> {
  const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
  searchUrl.searchParams.set('query', `${query} -is:retweet lang:en`);
  searchUrl.searchParams.set('max_results', Math.min(maxResults, 100).toString());
  searchUrl.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics,context_annotations,entities');
  searchUrl.searchParams.set('expansions', 'author_id');
  searchUrl.searchParams.set('user.fields', 'name,username,description,verified,public_metrics');

  const response = await rateLimitedFetch(searchUrl.toString(), {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'SalesIntel/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TwitterIntel] Search failed:', response.status, errorText);
    return { data: [], users: {} };
  }

  const result = await response.json();

  // Build user lookup map
  const users: Record<string, any> = {};
  if (result.includes?.users) {
    for (const user of result.includes.users) {
      users[user.id] = user;
    }
  }

  return { data: result.data || [], users, meta: result.meta };
}

/**
 * Lookup user by username
 */
async function lookupUser(
  bearerToken: string,
  username: string
): Promise<any> {
  const url = new URL(`https://api.twitter.com/2/users/by/username/${username}`);
  url.searchParams.set('user.fields', 'name,username,description,verified,public_metrics,created_at,location,url');

  const response = await rateLimitedFetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'SalesIntel/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get recent tweets from a specific user
 */
async function getUserTweets(
  bearerToken: string,
  userId: string,
  maxResults: number = 10
): Promise<any[]> {
  const url = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
  url.searchParams.set('max_results', Math.min(maxResults, 100).toString());
  url.searchParams.set('tweet.fields', 'created_at,public_metrics,context_annotations');
  url.searchParams.set('exclude', 'retweets,replies');

  const response = await rateLimitedFetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'SalesIntel/1.0',
    },
  });

  if (!response.ok) {
    return [];
  }

  const result = await response.json();
  return result.data || [];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY');
  const TWITTER_API_SECRET = Deno.env.get('TWITTER_API_SECRET');

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
    return new Response(
      JSON.stringify({ success: false, error: 'Twitter API credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, params } = await req.json();
    console.log(`[TwitterIntel] Action: ${action}`, params);

    const bearerToken = await getBearerToken(TWITTER_API_KEY, TWITTER_API_SECRET);
    let result: any;

    switch (action) {
      case 'search-intent-signals': {
        /**
         * Search for buyer intent signals in an industry/category
         * Finds people actively looking for solutions
         */
        const { industry, category, competitors = [] } = params;

        const intentQueries = [
          `"looking for ${category || industry} software"`,
          `"anyone recommend" ${category || industry}`,
          `"need help with" ${category || industry}`,
          `"searching for" ${category || industry} tool`,
        ];

        // Add competitor frustration queries
        for (const competitor of competitors.slice(0, 3)) {
          intentQueries.push(`"frustrated with ${competitor}"`);
          intentQueries.push(`"switching from ${competitor}"`);
          intentQueries.push(`"${competitor} sucks" OR "hate ${competitor}"`);
        }

        const allTweets: any[] = [];
        const seenIds = new Set<string>();

        for (const query of intentQueries) {
          const { data, users } = await searchTweets(bearerToken, query, 20);

          for (const tweet of data) {
            if (!seenIds.has(tweet.id)) {
              seenIds.add(tweet.id);
              const author = users[tweet.author_id];
              allTweets.push({
                id: tweet.id,
                text: tweet.text,
                createdAt: tweet.created_at,
                url: `https://twitter.com/i/status/${tweet.id}`,
                author: author ? {
                  name: author.name,
                  username: author.username,
                  followers: author.public_metrics?.followers_count,
                  verified: author.verified,
                } : null,
                engagement: tweet.public_metrics,
                matchedQuery: query,
                signalType: query.includes('frustrated') || query.includes('sucks') || query.includes('hate')
                  ? 'competitor_complaint'
                  : 'purchase_intent',
              });
            }
          }
        }

        // Sort by engagement (likes + retweets)
        allTweets.sort((a, b) => {
          const engA = (a.engagement?.like_count || 0) + (a.engagement?.retweet_count || 0);
          const engB = (b.engagement?.like_count || 0) + (b.engagement?.retweet_count || 0);
          return engB - engA;
        });

        result = {
          intentSignals: allTweets.slice(0, 50),
          totalFound: allTweets.length,
          queriesRun: intentQueries.length,
        };
        break;
      }

      case 'search-company-mentions': {
        /**
         * Search for mentions of a specific company
         * Captures sentiment and context
         */
        const { companyName, includeSentiment = true } = params;

        const queries = [
          `"${companyName}"`,
          `@${companyName.toLowerCase().replace(/\s+/g, '')}`,
          `"${companyName}" problem OR issue OR broken OR love OR amazing`,
        ];

        const allMentions: any[] = [];
        const seenIds = new Set<string>();

        for (const query of queries) {
          const { data, users } = await searchTweets(bearerToken, query, 30);

          for (const tweet of data) {
            if (!seenIds.has(tweet.id)) {
              seenIds.add(tweet.id);
              const author = users[tweet.author_id];

              // Simple sentiment detection
              const text = tweet.text.toLowerCase();
              let sentiment = 'neutral';
              if (text.match(/love|amazing|great|awesome|best|excellent|fantastic/)) {
                sentiment = 'positive';
              } else if (text.match(/hate|sucks|terrible|awful|worst|broken|issue|problem|frustrated/)) {
                sentiment = 'negative';
              }

              allMentions.push({
                id: tweet.id,
                text: tweet.text,
                createdAt: tweet.created_at,
                url: `https://twitter.com/i/status/${tweet.id}`,
                author: author ? {
                  name: author.name,
                  username: author.username,
                  followers: author.public_metrics?.followers_count,
                } : null,
                engagement: tweet.public_metrics,
                sentiment,
              });
            }
          }
        }

        // Calculate sentiment summary
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        for (const mention of allMentions) {
          sentimentCounts[mention.sentiment as keyof typeof sentimentCounts]++;
        }

        result = {
          mentions: allMentions.slice(0, 50),
          totalFound: allMentions.length,
          sentimentSummary: sentimentCounts,
          overallSentiment: sentimentCounts.positive > sentimentCounts.negative ? 'positive'
            : sentimentCounts.negative > sentimentCounts.positive ? 'negative'
            : 'neutral',
        };
        break;
      }

      case 'search-competitor-sentiment': {
        /**
         * Track what people say about competitors
         * Identifies switching opportunities
         */
        const { competitors } = params;

        if (!competitors || competitors.length === 0) {
          result = { competitors: [], error: 'No competitors provided' };
          break;
        }

        const competitorResults: any[] = [];

        for (const competitor of competitors.slice(0, 5)) {
          const queries = [
            `"${competitor}" hate OR sucks OR terrible OR awful`,
            `"${competitor}" love OR amazing OR great OR best`,
            `"switching from ${competitor}"`,
            `"${competitor}" vs OR alternative`,
          ];

          const mentions: any[] = [];
          let positive = 0, negative = 0;

          for (const query of queries) {
            const { data, users } = await searchTweets(bearerToken, query, 15);

            for (const tweet of data) {
              const text = tweet.text.toLowerCase();
              const sentiment = text.match(/hate|sucks|terrible|awful|worst|broken|frustrated/) ? 'negative'
                : text.match(/love|amazing|great|awesome|best|excellent/) ? 'positive'
                : 'neutral';

              if (sentiment === 'positive') positive++;
              if (sentiment === 'negative') negative++;

              const author = users[tweet.author_id];
              mentions.push({
                text: tweet.text,
                url: `https://twitter.com/i/status/${tweet.id}`,
                sentiment,
                author: author?.username,
              });
            }
          }

          competitorResults.push({
            name: competitor,
            mentionCount: mentions.length,
            sentiment: {
              positive,
              negative,
              ratio: positive + negative > 0 ? (negative / (positive + negative)).toFixed(2) : 0,
            },
            topComplaints: mentions.filter(m => m.sentiment === 'negative').slice(0, 5),
            switchingSignals: mentions.filter(m => m.text.toLowerCase().includes('switch')).slice(0, 3),
          });
        }

        result = { competitors: competitorResults };
        break;
      }

      case 'get-account-intel': {
        /**
         * Get intelligence on a specific Twitter account
         * For executive or company account monitoring
         */
        const { username } = params;

        if (!username) {
          result = { error: 'Username required' };
          break;
        }

        const user = await lookupUser(bearerToken, username.replace('@', ''));

        if (!user) {
          result = { found: false, username };
          break;
        }

        const tweets = await getUserTweets(bearerToken, user.id, 20);

        // Extract topics from recent tweets
        const topics: Record<string, number> = {};
        const hashtags: Record<string, number> = {};

        for (const tweet of tweets) {
          // Count hashtags
          const tags = tweet.text.match(/#\w+/g) || [];
          for (const tag of tags) {
            hashtags[tag.toLowerCase()] = (hashtags[tag.toLowerCase()] || 0) + 1;
          }

          // Extract context annotations as topics
          if (tweet.context_annotations) {
            for (const annotation of tweet.context_annotations) {
              const topic = annotation.entity?.name;
              if (topic) {
                topics[topic] = (topics[topic] || 0) + 1;
              }
            }
          }
        }

        result = {
          found: true,
          profile: {
            name: user.name,
            username: user.username,
            description: user.description,
            location: user.location,
            url: user.url,
            verified: user.verified,
            followers: user.public_metrics?.followers_count,
            following: user.public_metrics?.following_count,
            tweetCount: user.public_metrics?.tweet_count,
            createdAt: user.created_at,
          },
          recentTweets: tweets.slice(0, 10).map(t => ({
            text: t.text,
            createdAt: t.created_at,
            engagement: t.public_metrics,
          })),
          topHashtags: Object.entries(hashtags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count })),
          interests: Object.entries(topics)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count })),
        };
        break;
      }

      case 'search-hiring-signals': {
        /**
         * Find hiring-related tweets from a company
         * Indicates investment areas and pain points
         */
        const { companyName } = params;

        const queries = [
          `"${companyName}" hiring OR "we're hiring" OR "join our team"`,
          `"${companyName}" "open role" OR "open position"`,
          `from:${companyName.toLowerCase().replace(/\s+/g, '')} hiring`,
        ];

        const hiringTweets: any[] = [];

        for (const query of queries) {
          const { data, users } = await searchTweets(bearerToken, query, 20);

          for (const tweet of data) {
            const author = users[tweet.author_id];
            hiringTweets.push({
              text: tweet.text,
              url: `https://twitter.com/i/status/${tweet.id}`,
              createdAt: tweet.created_at,
              author: author?.username,
            });
          }
        }

        // Extract role keywords
        const roleKeywords = ['engineer', 'developer', 'manager', 'sales', 'marketing',
          'product', 'design', 'data', 'devops', 'security', 'support', 'success'];
        const detectedRoles: string[] = [];

        for (const tweet of hiringTweets) {
          for (const role of roleKeywords) {
            if (tweet.text.toLowerCase().includes(role) && !detectedRoles.includes(role)) {
              detectedRoles.push(role);
            }
          }
        }

        result = {
          hiringTweets: hiringTweets.slice(0, 20),
          detectedRoles,
          investmentAreas: detectedRoles.length > 0
            ? `Company appears to be investing in: ${detectedRoles.join(', ')}`
            : 'No clear hiring signals found',
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}. Valid: search-intent-signals, search-company-mentions, search-competitor-sentiment, get-account-intel, search-hiring-signals`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[TwitterIntel] Success for action: ${action}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        source: 'twitter-intel',
        metadata: { action, timestamp: new Date().toISOString() },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TwitterIntel] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        source: 'twitter-intel',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
