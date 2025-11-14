/**
 * Reddit API Integration Test
 * Tests OAuth authentication and psychological trigger extraction
 */

import dotenv from 'dotenv';
dotenv.config();

const REDDIT_CLIENT_ID = process.env.VITE_REDDIT_CLIENT_ID || process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.VITE_REDDIT_CLIENT_SECRET || process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.VITE_REDDIT_USER_AGENT || process.env.REDDIT_USER_AGENT || 'Synapse/1.0';

console.log('🧪 Testing Reddit API Integration for Synapse\n');
console.log('═'.repeat(70));
console.log('CLIENT_ID:', REDDIT_CLIENT_ID ? `${REDDIT_CLIENT_ID.substring(0, 10)}...` : 'NOT FOUND');
console.log('CLIENT_SECRET:', REDDIT_CLIENT_SECRET ? `${REDDIT_CLIENT_SECRET.substring(0, 10)}...` : 'NOT FOUND');
console.log('USER_AGENT:', REDDIT_USER_AGENT);
console.log('═'.repeat(70));

if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
  console.error('\n❌ Missing Reddit credentials in .env file');
  process.exit(1);
}

/**
 * Test 1: OAuth Authentication
 */
async function testOAuthAuthentication() {
  console.log('\n📡 Test 1: OAuth 2.0 Authentication...');

  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT
      },
      body: 'grant_type=client_credentials'
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ FAILED');
      console.log('Error:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ SUCCESS! OAuth working correctly');
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in, 'seconds');
    console.log('Scope:', data.scope);

    return data.access_token;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return null;
  }
}

/**
 * Test 2: Search Fitness Subreddit
 */
async function testSubredditSearch(accessToken) {
  console.log('\n📡 Test 2: Searching r/fitness for psychological triggers...');

  if (!accessToken) {
    console.log('⏭️  Skipping (no access token)');
    return null;
  }

  try {
    const query = 'motivation transformation';
    const response = await fetch(
      `https://oauth.reddit.com/r/fitness/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=month&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': REDDIT_USER_AGENT
        }
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.log('❌ FAILED');
      return null;
    }

    const data = await response.json();
    const posts = data.data?.children || [];

    console.log('✅ SUCCESS! Found', posts.length, 'posts');

    return posts;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return null;
  }
}

/**
 * Test 3: Extract Psychological Triggers
 */
function testPsychologicalTriggerExtraction(posts) {
  console.log('\n📡 Test 3: Extracting Psychological Triggers...');

  if (!posts || posts.length === 0) {
    console.log('⏭️  Skipping (no posts)');
    return;
  }

  const triggers = [];

  for (const postWrapper of posts) {
    const post = postWrapper.data;
    const text = `${post.title} ${post.selftext || ''}`;
    const lowerText = text.toLowerCase();

    // Check for trigger patterns
    const patterns = {
      curiosity: /you (won't|wont) believe|the secret|turns out|discovered/i,
      fear: /avoid|mistake|warning|danger/i,
      desire: /imagine|dream|wish|finally (got|achieved)|this changed my life/i,
      achievement: /success|accomplished|proud|finally did|made it/i,
      belonging: /community|together|join us|one of us/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        triggers.push({
          type,
          title: post.title.substring(0, 80),
          upvotes: post.ups,
          subreddit: post.subreddit
        });
      }
    }
  }

  console.log('✅ Extracted', triggers.length, 'psychological triggers');

  if (triggers.length > 0) {
    console.log('\nTop 3 Triggers:');
    triggers
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3)
      .forEach((trigger, i) => {
        console.log(`\n${i + 1}. [${trigger.type.toUpperCase()}] ${trigger.title}...`);
        console.log(`   Upvotes: ${trigger.upvotes} | r/${trigger.subreddit}`);
      });
  }

  return triggers;
}

/**
 * Test 4: Extract Customer Insights
 */
function testCustomerInsightExtraction(posts) {
  console.log('\n📡 Test 4: Extracting Customer Pain Points & Desires...');

  if (!posts || posts.length === 0) {
    console.log('⏭️  Skipping (no posts)');
    return;
  }

  const insights = [];

  for (const postWrapper of posts) {
    const post = postWrapper.data;
    const text = `${post.title} ${post.selftext || ''}`;

    // Pain points
    const painPatterns = [
      /i hate (when|how|that)/i,
      /frustrating (when|how)/i,
      /why (is it so|does)/i
    ];

    for (const pattern of painPatterns) {
      const match = text.match(pattern);
      if (match) {
        const index = match.index || 0;
        insights.push({
          type: 'pain',
          text: text.substring(index, Math.min(text.length, index + 100)),
          upvotes: post.ups
        });
      }
    }

    // Desires
    const desirePatterns = [
      /i wish (there was|i could)/i,
      /if only/i,
      /i'd love (to|if)/i
    ];

    for (const pattern of desirePatterns) {
      const match = text.match(pattern);
      if (match) {
        const index = match.index || 0;
        insights.push({
          type: 'desire',
          text: text.substring(index, Math.min(text.length, index + 100)),
          upvotes: post.ups
        });
      }
    }
  }

  console.log('✅ Extracted', insights.length, 'customer insights');

  if (insights.length > 0) {
    console.log('\nTop Insights:');
    insights
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3)
      .forEach((insight, i) => {
        console.log(`\n${i + 1}. [${insight.type.toUpperCase()}] "${insight.text}..."`);
        console.log(`   Upvotes: ${insight.upvotes}`);
      });
  }

  return insights;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting Reddit Integration Tests...\n');

  const accessToken = await testOAuthAuthentication();
  const posts = await testSubredditSearch(accessToken);
  const triggers = testPsychologicalTriggerExtraction(posts);
  const insights = testCustomerInsightExtraction(posts);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(70));
  console.log('OAuth Authentication:', accessToken ? '✅ WORKING' : '❌ FAILED');
  console.log('Subreddit Search:', posts ? `✅ WORKING (${posts.length} posts)` : '❌ FAILED');
  console.log('Trigger Extraction:', triggers ? `✅ WORKING (${triggers.length} triggers)` : '⏭️  SKIPPED');
  console.log('Insight Extraction:', insights ? `✅ WORKING (${insights.length} insights)` : '⏭️  SKIPPED');
  console.log('═'.repeat(70));

  if (accessToken && posts && triggers && insights) {
    console.log('\n🎉 SUCCESS! Reddit API is fully integrated with Synapse!');
    console.log('\n✅ Ready to use for:');
    console.log('  • Psychological trigger mining from customer conversations');
    console.log('  • Extracting authentic customer language for content');
    console.log('  • Identifying pain points and desires by industry');
    console.log('  • Finding trending topics in niche communities');
    console.log('\n📈 Next Step: Integrate into DeepContext Builder as 17th data source');
  } else if (accessToken) {
    console.log('\n⚠️  PARTIAL SUCCESS: OAuth works, but search/extraction needs debugging');
  } else {
    console.log('\n❌ FAILED: Cannot authenticate with Reddit API');
    console.log('\nTroubleshooting:');
    console.log('  1. Verify CLIENT_ID and CLIENT_SECRET in .env file');
    console.log('  2. Check Reddit app status at https://www.reddit.com/prefs/apps');
    console.log('  3. Ensure app type is "personal use script"');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
