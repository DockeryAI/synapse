# AI Commands System - Natural Language → Actions

**Transform chat into full command center. AI parses natural language and executes actions.**

---

## Overview

The AI Commands system enables users to control Synapse entirely through natural language. Instead of navigating menus and forms, users simply tell the AI what they want:

- "Create a viral campaign for my bakery" → Full 7-day campaign generated
- "Make this week's posts more casual" → All content updated
- "Find trending topics about shoes" → 10 content ideas with hashtags
- "Why did this post do well?" → AI explains patterns
- "Post more in the mornings" → Schedule automatically adjusted

## Features

### 1. Command Parser

Converts natural language into executable actions using Claude AI.

**Supported command types:**
- `campaign_creation` - Create new campaigns
- `content_modification` - Modify existing content
- `topic_exploration` - Discover trending topics
- `performance_analysis` - Analyze campaign performance
- `schedule_changes` - Adjust posting schedule
- `visual_analysis` - Analyze images for content ideas

**Usage:**
```typescript
import { createCommandParser } from './services/ai/commands';

const parser = createCommandParser(ANTHROPIC_API_KEY);

// Parse command
const result = await parser.parse("Create a campaign for my taco truck");

if (result.success) {
  const command = result.data;
  console.log('Intent:', command.intent);
  console.log('Confidence:', command.confidence);
  console.log('Actions:', command.actions);

  // Execute command
  if (command.requiresConfirmation) {
    // Show user what will happen
    console.log('This will:', command.actions.map(a => a.description));
  }

  const execution = await parser.execute(command);
  console.log('Result:', execution.data?.message);
}
```

### 2. Topic Explorer

Discovers trending topics and generates content ideas using Perplexity API.

**Features:**
- Real-time trend research
- 5-10 actionable content ideas per topic
- Trending hashtag recommendations
- Platform-specific suggestions
- Content idea bank storage

**Usage:**
```typescript
import { createTopicExplorer } from './services/ai/commands';

const explorer = createTopicExplorer(ANTHROPIC_API_KEY, PERPLEXITY_API_KEY);

// Explore topics
const result = await explorer.explore({
  topics: ['sustainable fashion', 'eco-friendly products'],
  industry: 'retail',
  trendingOnly: true,
  ideasPerTopic: 5,
  businessContext: 'Boutique clothing store specializing in sustainable brands',
});

if (result.success) {
  result.data?.topics.forEach(topic => {
    console.log(`Topic: ${topic.topic} (Trending: ${topic.isTrending})`);
    console.log(`Ideas: ${topic.contentIdeas.length}`);
    console.log(`Hashtags: ${topic.hashtags.join(', ')}`);
  });
}

// Get trending topics for industry
const trending = await explorer.getTrendingTopics('restaurant', 10);
```

### 3. Campaign Idea Generator

Generates complete campaign concepts from natural language.

**Features:**
- 3-5 ready-to-launch campaign ideas
- Complete 7-day plans with key posts
- Expected outcomes (engagement, reach, conversions)
- One-click campaign creation
- Difficulty assessment

**Usage:**
```typescript
import { createCampaignIdeaService } from './services/ai/commands';

const ideaService = createCampaignIdeaService(ANTHROPIC_API_KEY);

// Generate ideas
const result = await ideaService.generate({
  context: 'New taco offerings with seasonal ingredients',
  businessName: 'Taco Truck',
  industry: 'restaurant',
  targetAudience: 'Millennials who love food trucks',
  platforms: ['instagram', 'tiktok'],
  goal: 'awareness',
  count: 3,
});

if (result.success) {
  result.data?.ideas.forEach(idea => {
    console.log(`Campaign: ${idea.title}`);
    console.log(`Type: ${idea.type}`);
    console.log(`Duration: ${idea.duration} days`);
    console.log(`Expected engagement: ${idea.expectedOutcomes.engagementRate}%`);
    console.log(`Key posts: ${idea.keyPosts.length}`);

    if (idea.canCreateNow) {
      // One-click creation
      const campaign = await ideaService.createFromIdea(idea.id);
    }
  });
}
```

### 4. Proactive Suggestions

Continuously monitors performance and suggests improvements.

**Suggestion triggers:**
- **Engagement drops** → "Try video content"
- **Competitor activity** → "Respond to trending topic"
- **Local events** → "Create community content"
- **Seasonal opportunities** → "Launch holiday campaign"
- **Content gaps** → "Time to post again"
- **Platform opportunities** → "Consider TikTok"

**Usage:**
```typescript
import { createProactiveSuggestions } from './services/ai/commands';

const suggestions = createProactiveSuggestions(ANTHROPIC_API_KEY, {
  monitoringInterval: 60, // Check every 60 minutes
  engagementDropThreshold: 20, // Alert on 20% drop
  contentGapDays: 3, // Alert if no post for 3 days
  monitorLocalEvents: true,
  enableSeasonalSuggestions: true,
});

// Monitor and get suggestions
const result = await suggestions.monitor();

if (result.success) {
  const urgentSuggestions = result.data?.filter(s => s.priority === 'urgent');

  urgentSuggestions?.forEach(suggestion => {
    console.log(`⚠️ ${suggestion.title}`);
    console.log(suggestion.message);
    console.log(`Expected impact: ${suggestion.expectedImpact.improvement}`);

    if (suggestion.canAutoApply) {
      // One-click apply
      await suggestions.applySuggestion(suggestion.id);
    }
  });
}

// Get suggestions for specific user
const userSuggestions = await suggestions.getSuggestions('user_123');
```

### 5. Visual Understanding

Analyzes images using Claude Vision to generate content suggestions.

**Features:**
- Image analysis with Claude Vision
- Caption generation (casual, professional, creative)
- Campaign type recommendations
- Brand color extraction
- Platform and hashtag suggestions
- Quality assessment

**Usage:**
```typescript
import { createVisualUnderstanding } from './services/ai/commands';

const visualAI = createVisualUnderstanding(ANTHROPIC_API_KEY);

// Analyze image from URL
const result = await visualAI.analyze({
  imageUrl: 'https://example.com/product.jpg',
  businessContext: 'Boutique bakery specializing in custom cakes',
  analysisGoal: 'all', // or 'caption', 'campaign_type', 'brand_colors', 'product_suggestion'
});

if (result.success) {
  const analysis = result.data!;

  console.log('Description:', analysis.description);
  console.log('Elements:', analysis.detectedElements);
  console.log('Quality Score:', analysis.qualityScore);

  console.log('\nSuggested Captions:');
  console.log('Casual:', analysis.suggestedCaptions.casual);
  console.log('Professional:', analysis.suggestedCaptions.professional);
  console.log('Creative:', analysis.suggestedCaptions.creative);

  console.log('\nRecommended Campaign Type:', analysis.recommendedCampaignType?.type);
  console.log('Reasoning:', analysis.recommendedCampaignType?.reasoning);

  console.log('\nBrand Colors:');
  console.log('Primary:', analysis.brandColors?.primary);
  console.log('Secondary:', analysis.brandColors?.secondary);
  console.log('Accent:', analysis.brandColors?.accent);

  console.log('\nHashtags:', analysis.recommendedHashtags.join(', '));
  console.log('Platforms:', analysis.recommendedPlatforms.join(', '));
}

// Analyze uploaded file
const fileResult = await visualAI.analyze({
  imageFile: uploadedFile,
  businessContext: 'Coffee shop',
});
```

---

## Complete Example: Natural Language Command Flow

```typescript
import {
  createCommandParser,
  createTopicExplorer,
  createCampaignIdeaService,
  createProactiveSuggestions,
} from './services/ai/commands';

// Initialize services
const parser = createCommandParser(ANTHROPIC_API_KEY);
const explorer = createTopicExplorer(ANTHROPIC_API_KEY, PERPLEXITY_API_KEY);
const ideas = createCampaignIdeaService(ANTHROPIC_API_KEY);
const suggestions = createProactiveSuggestions(ANTHROPIC_API_KEY);

// User says: "Find me trending topics about sustainable fashion and create a campaign"
const userInput = "Find me trending topics about sustainable fashion and create a campaign";

// 1. Parse command
const parseResult = await parser.parse(userInput, {
  businessName: 'EcoWear',
  industry: 'retail',
});

if (!parseResult.success) {
  console.error('Failed to parse command');
  return;
}

const command = parseResult.data!;
console.log('Detected intent:', command.intent); // "topic_exploration" + "campaign_creation"

// 2. If clarification needed
if (command.intent === 'clarification_needed') {
  console.log('Questions:', command.clarificationQuestions);
  // Ask user for clarification
  return;
}

// 3. Show what will happen (confirmation)
if (command.requiresConfirmation) {
  console.log('This command will:');
  command.actions.forEach(action => {
    console.log(`- ${action.description}`);
  });

  const confirmed = await getUserConfirmation();
  if (!confirmed) return;
}

// 4. Execute: Explore topics
const topicResult = await explorer.explore({
  topics: ['sustainable fashion'],
  industry: 'retail',
  trendingOnly: true,
  ideasPerTopic: 5,
});

// 5. Execute: Generate campaign ideas
const campaignResult = await ideas.generate({
  context: `Based on trending topic: ${topicResult.data?.topics[0].topic}`,
  businessName: 'EcoWear',
  industry: 'retail',
  targetAudience: 'Eco-conscious millennials',
  count: 3,
});

// 6. Display results
console.log('\n✅ Command executed successfully!\n');
console.log(`Found ${topicResult.data?.totalIdeas} content ideas`);
console.log(`Generated ${campaignResult.data?.ideas.length} campaign concepts`);

// 7. Proactively monitor and suggest
setTimeout(async () => {
  const monitorResult = await suggestions.monitor();

  if (monitorResult.success && monitorResult.data) {
    const urgentItems = monitorResult.data.filter(s => s.priority === 'urgent');

    if (urgentItems.length > 0) {
      console.log('\n💡 Proactive Suggestion:');
      console.log(urgentItems[0].title);
      console.log(urgentItems[0].message);
    }
  }
}, 60000); // Check every minute
```

---

## Integration with Chat Widget

The command system integrates seamlessly with the existing ChatWidget:

```typescript
import { ChatWidget } from './components/ai';
import { createCommandParser } from './services/ai/commands';

function App() {
  const parser = createCommandParser(ANTHROPIC_API_KEY);

  const handleMessage = async (message: ChatMessage) => {
    if (message.role === 'user') {
      // Parse message as command
      const result = await parser.parse(message.content, businessContext);

      if (result.success && result.data!.intent !== 'general_question') {
        // Execute command
        const execution = await parser.execute(result.data!);

        if (execution.success) {
          // Show success message in chat
          addChatMessage({
            role: 'assistant',
            content: execution.data!.message,
          });
        }
      }
    }
  };

  return (
    <ChatWidget
      apiKey={ANTHROPIC_API_KEY}
      supabaseUrl={SUPABASE_URL}
      supabaseKey={SUPABASE_KEY}
      userId={currentUser.id}
      businessContext={businessContext}
      onMessage={handleMessage}
    />
  );
}
```

---

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for Topic Explorer)
PERPLEXITY_API_KEY=pplx-...

# Required (for storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

---

## Cost Estimates

**Per command (typical):**
- Command parsing: $0.005
- Topic exploration: $0.015 (with Perplexity) or $0.010 (without)
- Campaign idea generation: $0.020
- Visual analysis: $0.012
- Proactive suggestions (per check): $0.003

**Monthly (active user):**
- 50 commands: $1-2
- 10 topic explorations: $0.15
- 20 campaign ideas: $0.40
- 10 image analyses: $0.12
- 1,440 proactive checks (24/day): $4.30
- **Total: ~$6-8/month per active user**

---

## Testing

```bash
# Run tests
npm test src/services/ai/commands/

# Test command parsing
npm test CommandParser.test.ts

# Test topic explorer
npm test TopicExplorerService.test.ts

# Test campaign ideas
npm test CampaignIdeaService.test.ts

# Test proactive suggestions
npm test ProactiveSuggestionsService.test.ts

# Test visual understanding
npm test VisualUnderstandingService.test.ts
```

---

## Troubleshooting

**"Failed to parse command"**
- Check ANTHROPIC_API_KEY is valid
- Verify Claude API is accessible
- Check network connection

**"No topics found"**
- PERPLEXITY_API_KEY may be missing (service will fall back to mocks)
- Check Perplexity API status
- Verify API key has sufficient credits

**"Cannot auto-apply suggestion"**
- Some suggestions require manual configuration
- Check `canAutoApply` flag on suggestion
- Review `actions` array for required parameters

**"Visual analysis failed"**
- Ensure image is accessible (URL) or properly encoded (base64)
- Check image format (JPEG, PNG supported)
- Verify Claude Vision API is enabled

---

Built to make Synapse feel like a proactive business partner, not just a tool.
