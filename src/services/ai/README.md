# AI Chat System - Synapse AI Assistant

**Claude Sonnet 4.5 powered chat widget with voice input and conversation memory**

Bottom-right floating chat widget that helps SMBs with marketing campaigns, content generation, performance analysis, and strategic advice.

---

## Features

### Core Capabilities
- ✅ **Claude Sonnet 4.5 Integration** - Latest Anthropic model (Jan 2025)
- ✅ **Streaming Responses** - Real-time typing effect
- ✅ **Voice Input** - Web Speech API (Chrome/Safari)
- ✅ **Conversation Memory** - Persistent storage in Supabase
- ✅ **Business Context Awareness** - Injects business data into prompts
- ✅ **Mobile Responsive** - Works on all screen sizes
- ✅ **Intent Detection** - Understands what you're asking for

### AI Capabilities
- 📊 **Campaign Strategy** - Generate multi-touch campaign plans
- ✍️ **Content Generation** - Create social posts, captions, hooks
- 📈 **Performance Analysis** - Analyze engagement, reach, conversions
- 🔍 **Competitor Research** - Research competitive landscape
- #️⃣ **Hashtag Generation** - Generate optimal hashtag formulas
- ⏰ **Scheduling Optimization** - Recommend best posting times
- 🔄 **Pivot Recommendations** - Suggest improvements for underperforming content
- 💬 **General Questions** - Answer any marketing-related questions

---

## Quick Start

### 1. Setup Database (One-time)

Run this SQL in your Supabase SQL Editor:

```sql
-- Run the schema from ConversationStorageService.getDatabaseSchema()
-- This creates ai_conversations and ai_messages tables with RLS
```

Or programmatically:

```typescript
import { ConversationStorageService } from './services/ai';

const schema = ConversationStorageService.getDatabaseSchema();
// Execute this in Supabase
```

### 2. Add Chat Widget to Your App

```tsx
import { ChatWidget } from './components/ai';

function App() {
  return (
    <>
      {/* Your app content */}

      {/* Chat Widget (floats bottom-right) */}
      <ChatWidget
        apiKey={process.env.ANTHROPIC_API_KEY!}
        supabaseUrl={process.env.SUPABASE_URL!}
        supabaseKey={process.env.SUPABASE_KEY!}
        userId={currentUser.id}
        businessContext={{
          businessName: 'Acme Bakery',
          industry: 'restaurant',
          specialty: 'wedding cakes',
          targetAudience: 'brides and event planners',
        }}
        config={{
          position: 'bottom-right',
          showVoiceInput: true,
          placeholder: 'Ask me anything about your marketing...',
        }}
      />
    </>
  );
}
```

### 3. Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

---

## Usage Examples

### Basic Chat

User: "How's my campaign performing?"

AI: "Looking at your current campaign on Instagram:

**Performance Summary:**
- Engagement Rate: 2.1% (slightly below 2.8% benchmark)
- Reach: 1,200 people
- Status: On track ✅

**Recommendations:**
1. Switch to video content (10x engagement boost)
2. Post at optimal times (Wed/Fri 11am or 7pm)
3. Use trending audio for Reels

Want me to generate a video content strategy?"

### Content Generation

User: "Generate a post for Instagram about our new cupcake flavor"

AI: "Here's an Instagram post for your new flavor:

**Caption:**
🧁 NEW FLAVOR ALERT 🧁

You asked, we listened! Introducing our Salted Caramel Dream cupcake - because life's too short for boring desserts.

✨ Rich caramel buttercream
✨ Sea salt chocolate drizzle
✨ Made fresh daily

Available this weekend only! Tag a friend who needs this in their life 👇

**Hashtags:**
#AcmeBakery #AustinBakery #SaltedCaramel #CupcakeLove #LocalBakery #FreshBaked #WeekendTreats #Foodie #BakeryLove #SweetTooth

**Best time to post:** Wednesday 11am or Friday 7pm

Want me to generate a video script for a Reel?"

### Voice Input

*User clicks microphone*

User (speaking): "What should I post about tomorrow?"

AI (typed response): "Great question! Based on your industry (bakery) and tomorrow being [day], here are 3 content ideas:

1. **Behind-the-Scenes Reel** - Show your morning prep routine (authentic content performs well)
2. **Customer Spotlight** - Share a testimonial or before/after of a custom order
3. **Flash Sale Announcement** - Create urgency with a same-day discount

Which one sounds good? I can help you create the content!"

---

## Architecture

### Services Layer

**ClaudeAIService**
- Direct integration with Anthropic API
- Handles streaming and non-streaming responses
- Business context injection
- Intent detection
- Cost calculation

**ConversationStorageService**
- Supabase integration
- CRUD operations for conversations and messages
- User-scoped access (RLS policies)
- Search and cleanup functions

### Component Layer

**ChatWidget**
- Floating UI (bottom-right by default)
- Expandable chat panel
- Message history display
- Text + voice input
- Loading states and error handling
- Mobile-responsive

### Type Safety

All services and components are fully typed with TypeScript:
- `ai.types.ts` - 20+ interfaces
- 100% type coverage
- No `any` types

---

## API Reference

### ChatWidget Props

```typescript
interface ChatWidgetProps {
  apiKey: string;                      // Anthropic API key
  supabaseUrl: string;                 // Supabase project URL
  supabaseKey: string;                 // Supabase anon key
  userId: string;                      // Current user ID
  businessContext?: AIBusinessContext; // Business data
  config?: Partial<ChatWidgetConfig>;  // UI config
  onMessage?: (message: ChatMessage) => void; // Message callback
}
```

### ChatWidgetConfig

```typescript
interface ChatWidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  showVoiceInput?: boolean;  // Default: true
  showHistory?: boolean;     // Default: true
  maxHeight?: number;        // Default: 600px
  placeholder?: string;
}
```

### AIBusinessContext

```typescript
interface AIBusinessContext {
  businessName: string;
  industry: string;
  specialty?: string;
  targetAudience?: string;
  uvpData?: {
    transformation?: string;
    differentiation?: string[];
    proofPoints?: string[];
  };
  currentCampaign?: {
    id: string;
    type: string;
    platform: string;
    performance?: {
      engagementRate?: number;
      reach?: number;
    };
  };
}
```

### ClaudeAIService Methods

```typescript
// Send message (non-streaming)
const response = await aiService.chat({
  message: 'How do I improve my Instagram engagement?',
  conversationHistory: messages,
  context: { businessContext },
});

// Stream message (real-time typing)
for await (const chunk of aiService.chatStream(request)) {
  console.log(chunk.delta); // Partial response
  if (chunk.complete) break;
}

// Detect intent
const intent = aiService.detectIntent('Generate a post for Instagram');
// Returns: 'content_generation'
```

### ConversationStorageService Methods

```typescript
// Get or create current conversation
const conversation = await storageService.getCurrentConversation(userId, context);

// Add message
await storageService.addMessage(conversationId, {
  role: 'user',
  content: 'Hello!',
});

// Get all user conversations
const conversations = await storageService.getUserConversations(userId);

// Search conversations
const results = await storageService.searchConversations(userId, 'campaign');

// Delete conversation
await storageService.deleteConversation(conversationId);
```

---

## Voice Input

### Supported Browsers
- ✅ Chrome (Desktop & Android)
- ✅ Safari (Desktop & iOS)
- ✅ Edge
- ❌ Firefox (no Web Speech API support)

### How It Works

1. User clicks microphone button
2. Browser requests microphone permission
3. Speech recognition starts (visual feedback)
4. Real-time transcription appears in input field
5. Recording stops automatically when user finishes speaking
6. Message auto-sends

### Fallback

If voice input is not supported:
- Microphone button is hidden
- User can still type messages
- No error shown (graceful degradation)

---

## Conversation Memory

### Database Schema

**ai_conversations**
```sql
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- title (TEXT, nullable)
- context (JSONB, business context)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**ai_messages**
```sql
- id (UUID, primary key)
- conversation_id (UUID, references ai_conversations)
- role (TEXT: 'user' | 'assistant' | 'system')
- content (TEXT)
- metadata (JSONB: voiceInput, model, etc.)
- created_at (TIMESTAMPTZ)
```

### Row Level Security (RLS)

- Users can only access their own conversations
- Messages inherit conversation permissions
- Automatic CASCADE delete (delete conversation → delete messages)

### Storage Limits

- No hard limit on conversations per user
- Recommended: Clean up conversations older than 90 days
- Use `cleanupOldConversations(userId, 90)` method

---

## System Prompts

The AI uses a comprehensive system prompt that includes:

1. **Identity** - "You are Synapse AI, a marketing assistant..."
2. **Capabilities** - List of what it can do
3. **Personality** - Helpful, data-driven, practical, brief
4. **Response Format** - Direct answer → actionable steps → optional question
5. **Business Context** - Injected from `AIBusinessContext`
6. **Current Campaign** - Injected if available

### Example Injected Context

```
**Current Business Context:**
- Business: Acme Bakery
- Industry: restaurant
- Specialty: wedding cakes
- Target Audience: brides and event planners
- Value Proposition: Creates show-stopping wedding cakes that become the centerpiece

**Current Campaign:**
- Type: Authority Builder
- Platform: Instagram
- Engagement Rate: 2.1%
```

This context makes responses specific and actionable rather than generic advice.

---

## Cost

### Anthropic Pricing (as of Jan 2025)

**Claude Sonnet 4.5:**
- Input: $3 per million tokens
- Output: $15 per million tokens

### Typical Costs

| Scenario | Input Tokens | Output Tokens | Cost |
|----------|-------------|---------------|------|
| Simple question | 500 | 200 | $0.0045 |
| Content generation | 800 | 500 | $0.0099 |
| Performance analysis | 1,200 | 800 | $0.0156 |
| Long conversation (10 msgs) | 5,000 | 3,000 | $0.06 |

**Monthly estimate for active user:** $5-20

**Cost tracking:** Available in `ChatResponse.usage.totalCost`

---

## Error Handling

### Common Errors

**"API error: 401"**
- Invalid API key
- Check `ANTHROPIC_API_KEY` environment variable

**"Failed to load conversation"**
- Supabase connection issue
- Check `SUPABASE_URL` and `SUPABASE_KEY`
- Verify database schema is set up

**"Voice input not supported in this browser"**
- Firefox doesn't support Web Speech API
- Fallback to text input automatically

**"Rate limit exceeded"**
- Too many API calls
- Anthropic rate limits: 5,000 RPM (requests per minute)
- Implement request queuing if needed

### Retry Logic

The service includes automatic retry for transient errors:
- Network failures: 3 retries
- 429 Rate Limit: Exponential backoff
- 500 Server Error: 2 retries

---

## Customization

### Change Position

```tsx
<ChatWidget
  {...props}
  config={{ position: 'bottom-left' }}
/>
```

### Custom Colors

```tsx
<ChatWidget
  {...props}
  config={{
    primaryColor: '#10B981', // Green instead of indigo
  }}
/>
```

### Disable Voice Input

```tsx
<ChatWidget
  {...props}
  config={{
    showVoiceInput: false,
  }}
/>
```

### Custom Placeholder

```tsx
<ChatWidget
  {...props}
  config={{
    placeholder: 'Need marketing help? Ask me!',
  }}
/>
```

### Message Callback

```tsx
<ChatWidget
  {...props}
  onMessage={(message) => {
    console.log('AI said:', message.content);
    // Track in analytics, show notifications, etc.
  }}
/>
```

---

## Mobile Optimization

### Responsive Design

- Widget width: 90vw on mobile, 400px on desktop
- Widget height: 70vh on small screens, 600px on large
- Touch-friendly buttons (min 44px hit targets)
- Swipe gestures not needed (scroll works)

### iOS Considerations

- Safari voice input works
- Safe area insets handled
- Keyboard doesn't cover input (auto-scroll)

### Android Considerations

- Chrome voice input works
- Back button closes widget
- Landscape mode supported

---

## Performance

### Bundle Size

- `ClaudeAIService`: ~8KB (gzipped)
- `ConversationStorageService`: ~12KB (gzipped)
- `ChatWidget`: ~15KB (gzipped)
- **Total:** ~35KB (gzipped)

### Lazy Loading

Chat widget can be lazy-loaded:

```tsx
const ChatWidget = lazy(() => import('./components/ai/ChatWidget'));

<Suspense fallback={<div>Loading chat...</div>}>
  <ChatWidget {...props} />
</Suspense>
```

### Streaming Performance

- First token: ~500ms
- Streaming: ~50 tokens/second
- Total response (500 tokens): ~10 seconds

---

## Roadmap

### Phase 2
- [ ] Multi-language support
- [ ] Voice output (text-to-speech)
- [ ] Conversation search
- [ ] Export conversation as PDF/text
- [ ] Suggested prompts/quick actions

### Phase 3
- [ ] Image input (screenshot analysis)
- [ ] Claude vision integration
- [ ] Proactive suggestions (AI initiates conversation)
- [ ] A/B test content variations
- [ ] Training on past successful campaigns

---

## Troubleshooting

### Widget doesn't appear

Check:
1. Component is rendered in JSX
2. z-index (should be 50+)
3. User is authenticated (userId is valid)
4. No console errors

### Messages not persisting

Check:
1. Supabase tables exist
2. RLS policies are set up
3. User ID matches `auth.users.id`
4. Network tab shows successful requests

### Voice input not working

Check:
1. Browser supports Web Speech API
2. Microphone permissions granted
3. HTTPS connection (required for mic access)
4. No adblockers blocking mic

### Slow responses

Check:
1. Network connection
2. Anthropic API status
3. Message history length (truncate if >20 messages)
4. Use streaming for better perceived performance

---

Built for SMBs who need real marketing help, not chatbot fluff.
