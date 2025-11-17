# Week 6 Atomic Task List: AI Assistant - Full Implementation

**Focus:** Claude-powered business partner with persistent memory and proactive intelligence
**Duration:** 5 days (Mon-Fri)
**Worktrees:** 2 parallel tracks
**Prerequisites:** Week 5 merged (Chat widget, conversation memory, voice input)

---

## Worktree 1: Persistent Memory + Learning (Mon-Wed, 24h)
**Branch:** `feature/ai-persistent-memory`
**Path:** `../synapse-ai-memory`

### Atomic Tasks:

1. **Setup & Dependencies (1h)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/ai/memory/`
   - [ ] Create types: `src/types/ai-memory.types.ts`
   - [ ] Review existing conversation history schema

2. **Business Context Memory (4h)**
   - [ ] Create `src/services/ai/memory/BusinessContextService.ts`
   - [ ] Store business profile (name, industry, location, type)
   - [ ] Store tone preferences (casual, professional, funny, formal)
   - [ ] Store successful content patterns (high-performing posts)
   - [ ] Store brand voice samples (customer-provided examples)
   - [ ] Store campaign preferences (preferred platforms, content types)
   - [ ] Retrieve and inject into every AI conversation

3. **Tone Preference System (4h)**
   - [ ] Create `src/services/ai/memory/TonePreferenceService.ts`
   - [ ] Natural language tone commands: "make it funnier", "more professional"
   - [ ] Tone adjustment persists for all future content
   - [ ] Tone presets: Casual, Professional, Funny, Inspirational, Bold
   - [ ] Custom tone descriptions (free text)
   - [ ] Apply tone to all campaign content generation
   - [ ] UI: Tone slider + natural language input

4. **Content Pattern Learning (5h)**
   - [ ] Create `src/services/ai/memory/ContentLearningService.ts`
   - [ ] Track high-performing content (engagement > benchmark)
   - [ ] Identify patterns: topics, formats, hooks, CTAs
   - [ ] Store successful patterns by campaign type
   - [ ] Apply learnings to future content generation
   - [ ] "More like this" feature for successful posts
   - [ ] Show learnings in dashboard: "Posts about X get 3x engagement"

5. **Preference Persistence (4h)**
   - [ ] Create Supabase tables: `ai_business_context`, `ai_tone_preferences`, `ai_learnings`
   - [ ] Schema for business context (industry, tone, voice samples)
   - [ ] Schema for tone preferences (tone_id, description, examples)
   - [ ] Schema for learnings (pattern, performance, confidence)
   - [ ] Auto-save preferences on every change
   - [ ] Retrieve preferences on app load
   - [ ] Migration for existing users

6. **Context Injection System (4h)**
   - [ ] Create `src/services/ai/memory/ContextInjector.ts`
   - [ ] Inject business context into every AI prompt
   - [ ] Include tone preferences
   - [ ] Include successful content patterns
   - [ ] Include recent campaign performance
   - [ ] Include brand voice samples
   - [ ] Format context for Claude API (system message)

7. **Testing & Verification (2h)**
   - [ ] Test tone preference persistence
   - [ ] Verify content pattern learning
   - [ ] Test context injection
   - [ ] Verify preferences apply to all content
   - [ ] Test with multiple user scenarios
   - [ ] Commit when complete

---

## Worktree 2: Natural Language Commands + Proactive Intelligence (Thu-Fri, 16h)
**Branch:** `feature/ai-commands`
**Path:** `../synapse-ai-commands`

### Atomic Tasks:

1. **Setup & Dependencies (1h)**
   - [ ] Create worktree from main
   - [ ] Create directory: `src/services/ai/commands/`
   - [ ] Create types: `src/types/ai-commands.types.ts`

2. **Command Parser (5h)**
   - [ ] Create `src/services/ai/commands/CommandParser.ts`
   - [ ] Parse natural language → platform API calls
   - [ ] Command categories:
     - Campaign creation: "Create a viral campaign for my bakery"
     - Content modification: "Make this week's posts more casual"
     - Topic exploration: "Find trending topics about shoes"
     - Performance analysis: "Why did this post do well?"
     - Schedule changes: "Post more in the mornings"
   - [ ] Intent detection using Claude
   - [ ] Parameter extraction (campaign type, tone, topics, etc.)
   - [ ] Execute API calls based on parsed intent
   - [ ] Error handling and clarification requests

3. **Topic Explorer (3h)**
   - [ ] Create `src/services/ai/commands/TopicExplorerService.ts`
   - [ ] Natural language: "Find topics about current shoe trends"
   - [ ] Use Perplexity API for real-time trend research
   - [ ] Generate content ideas based on topics
   - [ ] Return 5-10 actionable content suggestions
   - [ ] Include trending hashtags
   - [ ] Store topics in content idea bank

4. **Campaign Idea Generator (3h)**
   - [ ] Create `src/services/ai/commands/CampaignIdeaService.ts`
   - [ ] Natural language: "Give me campaign ideas for my taco truck's new offerings"
   - [ ] Generate 3-5 complete campaign concepts
   - [ ] Each concept: goal, duration, platform, key posts
   - [ ] Include expected outcomes (engagement, reach)
   - [ ] One-click "Create Campaign" from idea
   - [ ] Store ideas for later use

5. **Proactive Suggestions (3h)**
   - [ ] Create `src/services/ai/ProactiveSuggestionsService.ts`
   - [ ] Monitor campaign performance continuously
   - [ ] Trigger suggestions:
     - Engagement drops → suggest video content
     - Competitor activity → suggest response
     - Local events → suggest community content
     - Seasonal opportunities → suggest campaigns
   - [ ] Display suggestions in dashboard
   - [ ] One-click apply suggestion
   - [ ] Track suggestion acceptance rate

6. **Visual Understanding (Stretch Goal, 2h)**
   - [ ] Upload image → analyze and suggest content
   - [ ] Use Claude's vision capabilities
   - [ ] Generate captions based on image
   - [ ] Suggest campaign type based on product
   - [ ] Extract brand colors from image

7. **Testing & Verification (1h)**
   - [ ] Test command parsing (all categories)
   - [ ] Verify topic explorer
   - [ ] Test campaign idea generation
   - [ ] Verify proactive suggestions
   - [ ] Test visual understanding (if implemented)
   - [ ] Commit when complete

---

## Integration & Testing (Fri afternoon, 4h)

**All Worktrees Merged:**

1. **Cross-Feature Integration (2h)**
   - [ ] Merge Worktree 1 (Persistent Memory)
   - [ ] Merge Worktree 2 (Natural Language Commands)
   - [ ] Resolve any merge conflicts
   - [ ] Verify no breaking changes
   - [ ] Test chat widget with full memory system

2. **End-to-End Testing (2h)**
   - [ ] Test: Tone preference → all content updated
   - [ ] Test: "Make it funnier" → content changes
   - [ ] Test: "Find topics about X" → content ideas generated
   - [ ] Test: "Create campaign for Y" → full campaign created
   - [ ] Test: Proactive suggestions appear and work
   - [ ] Test: Conversation memory persists across sessions
   - [ ] Test: Voice input → commands executed
   - [ ] Verify AI learns from successful content

3. **Documentation & Review (30min)**
   - [ ] Update README with AI assistant features
   - [ ] Document natural language commands
   - [ ] Create user guide for AI assistant
   - [ ] Prepare demo video for marketing

---

## Success Criteria

**Persistent Memory:**
- ✅ Tone preferences persist and apply to all content
- ✅ Business context remembered across sessions
- ✅ Successful content patterns learned and applied
- ✅ Brand voice samples stored and used
- ✅ Preferences auto-save on every change

**Natural Language Commands:**
- ✅ Campaign creation from natural language
- ✅ Content modification from simple commands
- ✅ Topic exploration generates content ideas
- ✅ Campaign ideas generated on demand
- ✅ Proactive suggestions based on performance
- ✅ Voice input works for all commands

**Learning System:**
- ✅ AI learns what works for each business
- ✅ High-performing content patterns identified
- ✅ Learnings applied automatically to future content
- ✅ Dashboard shows insights: "Posts about X perform better"

---

## Week 6 Deliverables

**SMBs can now:**
1. Talk to AI assistant like a marketing expert
2. Set tone once ("make it funnier") → applies to all content
3. Ask "Find trending topics about [X]" → get content ideas
4. Say "Create campaign for [Y]" → complete campaign generated
5. Receive proactive suggestions based on performance
6. Upload images → AI suggests campaigns
7. AI learns from their successful content
8. Preferences persist forever (no re-configuration)
9. Voice commands work everywhere
10. AI acts as 24/7 business partner

**Killer Features:**
- **"Business Coach" Mode:** AI suggests strategy, not just posts
- **Continuous Learning:** Gets smarter about YOUR specific business
- **Zero Configuration:** Just talk about your goals
- **Proactive Intelligence:** AI alerts on opportunities

**Ready for:** Beta expansion + public launch

---

## Post-Week 6 Enhancements (Future)

**Auto-Pilot Mode:**
- "Run my social media this week, I'm swamped"
- AI creates, schedules, adjusts autonomously
- Owner approves via text message

**Cross-Business Learning:**
- Learn from all Synapse users (anonymized)
- "Posts like this get 5x engagement in your industry"
- Apply proven patterns without copying

**Business Growth Advisor:**
- "You're ready for Instagram Shopping"
- "Time to try video content"
- "Your email list could drive more sales"

**Local Expert Mode:**
- Knows their neighborhood
- "The city festival is perfect for you because..."
- "Other downtown businesses are doing X"
