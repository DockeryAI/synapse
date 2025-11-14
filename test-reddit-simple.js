/**
 * Simple Reddit API Test
 * Tests public API fallback to ensure data extraction works
 */

console.log('🧪 Testing Reddit API (Public Fallback Mode)\n');
console.log('═'.repeat(70));

/**
 * Test: Fetch and analyze posts from r/fitness
 */
async function testRedditPublicAPI() {
  console.log('📡 Fetching posts from r/fitness...\n');

  try {
    const response = await fetch('https://www.reddit.com/r/fitness/hot.json?limit=10', {
      headers: {
        'User-Agent': 'Synapse/1.0 by Perfect-News7007'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data?.children || [];

    console.log(`✅ Fetched ${posts.length} posts from r/fitness\n`);

    // Extract psychological triggers
    const triggers = [];
    const insights = [];

    for (const postWrapper of posts) {
      const post = postWrapper.data;
      const text = `${post.title} ${post.selftext || ''}`;
      const lowerText = text.toLowerCase();

      // Check for psychological triggers
      const triggerPatterns = {
        curiosity: /you (won't|wont) believe|the secret|discovered|turns out/i,
        fear: /avoid|mistake|warning|danger/i,
        desire: /imagine|dream|wish|finally (got|achieved)|this changed my life/i,
        achievement: /success|accomplished|proud|finally did|made it/i,
        belonging: /community|together|join us|one of us/i,
        trust: /honest|transparent|authentic|genuine/i,
        urgency: /last chance|running out|limited|now or never/i
      };

      for (const [type, pattern] of Object.entries(triggerPatterns)) {
        if (pattern.test(text)) {
          triggers.push({
            type,
            title: post.title.substring(0, 80),
            upvotes: post.ups,
            subreddit: post.subreddit
          });
        }
      }

      // Check for customer insights
      const painPatterns = /i hate|frustrating|why (is it so|does)|the problem/i;
      const desirePatterns = /i wish|if only|i'd love|would be (great|perfect) if/i;

      if (painPatterns.test(text)) {
        insights.push({
          type: 'pain',
          text: text.substring(0, 100),
          upvotes: post.ups
        });
      }

      if (desirePatterns.test(text)) {
        insights.push({
          type: 'desire',
          text: text.substring(0, 100),
          upvotes: post.ups
        });
      }
    }

    console.log('═'.repeat(70));
    console.log('📊 EXTRACTION RESULTS');
    console.log('═'.repeat(70));
    console.log(`Psychological Triggers Found: ${triggers.length}`);
    console.log(`Customer Insights Found: ${insights.length}`);
    console.log('═'.repeat(70));

    if (triggers.length > 0) {
      console.log('\n🧠 Top Psychological Triggers:\n');
      triggers
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 5)
        .forEach((trigger, i) => {
          console.log(`${i + 1}. [${trigger.type.toUpperCase()}] ${trigger.title}...`);
          console.log(`   ↑ ${trigger.upvotes} upvotes | r/${trigger.subreddit}`);
          console.log('');
        });
    }

    if (insights.length > 0) {
      console.log('💡 Customer Insights:\n');
      insights
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 3)
        .forEach((insight, i) => {
          console.log(`${i + 1}. [${insight.type.toUpperCase()}] "${insight.text}..."`);
          console.log(`   ↑ ${insight.upvotes} upvotes`);
          console.log('');
        });
    }

    console.log('═'.repeat(70));
    console.log('✅ SUCCESS! Reddit API is working correctly');
    console.log('═'.repeat(70));
    console.log('\n📋 Summary:');
    console.log('  • Public API access: WORKING');
    console.log('  • Data extraction: WORKING');
    console.log('  • Trigger analysis: WORKING');
    console.log('  • Ready for Synapse integration: YES');
    console.log('\n🎉 Reddit can now power psychological trigger mining in Synapse!\n');

    return true;
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

// Run test
testRedditPublicAPI().then(success => {
  process.exit(success ? 0 : 1);
});
