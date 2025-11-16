# Brand Voice Detection & Matching - Worktree Task

**Feature:** Brand Voice Detection & Matching
**Worktree:** `feature/brand-voice-detection`
**Estimated Time:** 8 hours
**Dependencies:** Website Analyzer, UVP Wizard 2.0, Business Profile Management
**Status:** 🟡 Not Started

---

## Overview

Analyze customer's existing website content to identify their brand voice and tone, then match that style in all generated content. This makes AI-generated content feel authentic and consistent with their existing marketing materials rather than generic AI output.

---

## Implementation Tasks

### 1. Tone Analysis Service (4 hours)

**Goal:** Extract and classify tone/voice from website content

**Tasks:**
- [ ] Create `BrandVoiceAnalyzer.ts` service (2h)
  - Extract text from key website sections (hero, about, services, blog)
  - Analyze writing patterns: formality level, sentence structure, vocabulary complexity
  - Detect emotional tone (professional, friendly, authoritative, caring, etc.)
  - Identify common phrases and linguistic patterns
  - Calculate tone confidence scores

- [ ] Build tone classifier (1h)
  - Define 7 tone presets with characteristics
  - Map analyzed patterns to closest preset
  - Generate tone description and examples
  - Extract 2-3 example sentences from their site

- [ ] Create tone profile data structure (1h)
  - Store detected tone preset
  - Save example phrases from their content
  - Track formality score (1-10)
  - Store vocabulary preferences (technical vs simple)
  - Save writing style attributes (sentence length, active/passive voice ratio)

**Files Created:**
- `src/services/brand-voice/BrandVoiceAnalyzer.ts`
- `src/services/brand-voice/ToneClassifier.ts`
- `src/types/brand-voice.types.ts`

**Acceptance Criteria:**
- Correctly identifies tone from 100+ words of website content
- Classifies into one of 7 tone presets with >70% confidence
- Extracts 2-3 representative example sentences
- Analysis completes in <5 seconds

---

### 2. UVP Wizard Integration (2 hours)

**Goal:** Add tone confirmation step to UVP Wizard after product/service detection

**Tasks:**
- [ ] Add tone confirmation UI step (1.5h)
  - Display detected tone preset with description
  - Show "Example from your site" quote
  - Show "How we'd write for you" generated sample
  - Provide [✓ Keep This Tone] button
  - Provide [Choose Different →] option that expands preset selector

- [ ] Build tone preset selector (0.5h)
  - Grid of 7 tone cards (Professional Authority, Warm & Friendly, etc.)
  - Each card shows: Name, Description, Example snippet, Industries
  - User can select any preset to override AI detection
  - Selection updates live preview

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Step 3: Confirm Your Brand Voice                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📝 We've analyzed your website and identified:    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Professional & Trustworthy                 │    │
│  │                                             │    │
│  │ You speak with authority while remaining   │    │
│  │ approachable. Your content educates        │    │
│  │ without overwhelming.                       │    │
│  │                                             │    │
│  │ Example from your site:                     │    │
│  │ "We deliver comprehensive solutions that    │    │
│  │  transform businesses through..."           │    │
│  │                                             │    │
│  │ How we'd write for you:                     │    │
│  │ "Transform your business with proven        │    │
│  │  strategies that deliver measurable..."     │    │
│  │                                             │    │
│  │  [✓ Keep This Tone]  [Choose Different →] │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Files Modified:**
- `src/contexts/UVPWizardContext.tsx` (add tone state)
- `src/components/onboarding-v5/UVPWizard.tsx` (add step)
- `src/components/onboarding-v5/BrandVoiceStep.tsx` (new component)
- `src/components/onboarding-v5/TonePresetSelector.tsx` (new component)

**Acceptance Criteria:**
- Tone step appears after product/service detection
- Displays detected tone with examples
- User can confirm or choose different preset
- Selected tone persists through wizard completion

---

### 3. Tone Preset Library (1 hour)

**Goal:** Define 7 standard tone presets with characteristics

**Tone Presets:**

1. **Professional Authority**
   - **Formality:** High (8/10)
   - **Style:** Educational, data-driven, credible
   - **Voice:** Third-person friendly, active voice
   - **Vocabulary:** Industry jargon acceptable, clear explanations
   - **Industries:** B2B, Consulting, Legal, Finance
   - **Example:** "Our proven methodology transforms complex challenges into measurable outcomes. With 15+ years of experience, we deliver solutions that drive sustainable growth."

2. **Warm & Friendly**
   - **Formality:** Low (3/10)
   - **Style:** Conversational, personal, relatable
   - **Voice:** First-person, you/we language
   - **Vocabulary:** Simple, everyday words
   - **Industries:** Local businesses, Services, Hospitality
   - **Example:** "We love helping our neighbors find solutions that make life easier. Whether you're dealing with a small issue or a big project, we're here to help every step of the way."

3. **Bold & Disruptive**
   - **Formality:** Medium (5/10)
   - **Style:** Provocative, challenging status quo, confident
   - **Voice:** Direct, punchy sentences
   - **Vocabulary:** Strong action words, contrarian statements
   - **Industries:** Startups, Tech, Innovation
   - **Example:** "The old way is broken. While others cling to outdated methods, we're building the future. Join us or get left behind."

4. **Caring & Supportive**
   - **Formality:** Low-Medium (4/10)
   - **Style:** Empathetic, reassuring, understanding
   - **Voice:** Second-person (you), compassionate
   - **Vocabulary:** Gentle, encouraging, non-technical
   - **Industries:** Healthcare, Education, Nonprofits
   - **Example:** "We understand how overwhelming this can feel. You're not alone in this journey. Our team is here to support you with compassionate care every step of the way."

5. **Energetic & Fun**
   - **Formality:** Low (2/10)
   - **Style:** Upbeat, playful, enthusiastic
   - **Voice:** Exclamatory, casual
   - **Vocabulary:** Pop culture references, emojis acceptable
   - **Industries:** Retail, Entertainment, Food & Beverage
   - **Example:** "Ready to level up your style? Our latest collection is 🔥 and we can't wait for you to see it! Get ready to turn heads and feel amazing."

6. **Luxurious & Exclusive**
   - **Formality:** High (9/10)
   - **Style:** Sophisticated, refined, aspirational
   - **Voice:** Third-person, elegant
   - **Vocabulary:** Premium descriptors, sensory language
   - **Industries:** Luxury goods, High-end services
   - **Example:** "Experience the pinnacle of craftsmanship. Each piece is meticulously curated to exceed the expectations of the most discerning clientele."

7. **Direct & Action-Oriented**
   - **Formality:** Medium (6/10)
   - **Style:** Results-focused, no-nonsense, urgent
   - **Voice:** Imperative commands, benefit-driven
   - **Vocabulary:** Action verbs, numbers, specifics
   - **Industries:** Sales, Marketing, Coaching
   - **Example:** "Stop losing leads. Start converting 40% more prospects in 30 days. Book your demo now and see real results immediately."

**Files Created:**
- `src/data/tone-presets.ts`

---

### 4. Content Generation Integration (1 hour)

**Goal:** Pass tone profile to all content generators and adjust output accordingly

**Tasks:**
- [ ] Update content generator prompts (0.5h)
  - Add tone profile to PremiumContentWriter prompt
  - Include example phrases from customer's site as few-shot examples
  - Specify formality level and vocabulary preferences
  - Add instruction to match detected writing patterns

- [ ] Store tone in business profile (0.5h)
  - Add `brandVoice` field to BusinessProfile type
  - Save selected tone preset to database
  - Include example phrases and formality score
  - Make tone editable in Business Profile Management

**Prompt Enhancement Example:**
```typescript
BRAND VOICE GUIDELINES:
- Tone: ${toneProfile.presetName} (${toneProfile.description})
- Formality Level: ${toneProfile.formalityScore}/10
- Writing Style: ${toneProfile.styleAttributes.join(', ')}

Examples of their existing voice:
${toneProfile.examplePhrases.map(p => `"${p}"`).join('\n')}

CRITICAL: Match this tone and style in your writing. Use similar:
- Sentence structure and length
- Vocabulary complexity
- Emotional resonance
- Voice (first/second/third person)
```

**Files Modified:**
- `src/services/synapse/generation/formats/PremiumContentWriter.ts`
- `src/types/index.ts` (BusinessProfile type)
- Database schema: Add `brand_voice` JSONB column to `business_profiles`

**Acceptance Criteria:**
- Tone profile passed to all content generators
- Generated content matches selected tone preset
- Tone persists across sessions
- User can edit tone in profile settings

---

## Database Schema Updates

### Updated Table

```sql
-- Add brand voice to business profiles
ALTER TABLE business_profiles ADD COLUMN brand_voice JSONB;

-- Example structure:
{
  "presetName": "Professional Authority",
  "description": "Educational, data-driven, credible",
  "formalityScore": 8,
  "examplePhrases": [
    "We deliver comprehensive solutions that transform...",
    "Our proven methodology drives measurable outcomes..."
  ],
  "styleAttributes": ["active voice", "industry jargon", "data-driven"],
  "confidence": 0.82,
  "detectedAt": "2025-11-15T10:30:00Z"
}
```

---

## Integration Points

### With Website Analyzer
- Run tone analysis during initial website scan
- Extract text from multiple pages (homepage, about, services)
- Minimum 100 words needed for accurate detection
- Falls back to neutral "Professional & Friendly" if insufficient content

### With UVP Wizard
- New step after product/service detection
- Displays detected tone with examples
- Allows user to confirm or override
- Saves selection to business profile

### With Content Generators
- All generators receive tone profile in context
- Prompts adjusted to match tone characteristics
- Example phrases used as few-shot learning
- Maintains consistency across all content types

### With Business Profile Management
- Tone editable in settings
- Can re-analyze website to update tone
- History tracking of tone changes
- Preview how different tones would look

---

## UI/UX Specifications

### Tone Confirmation Card
- **Size:** Full-width card with rounded corners
- **Background:** Light gradient matching detected tone (blue for professional, warm for friendly, etc.)
- **Icon:** 📝 or tone-specific emoji
- **Typography:** Large preset name (text-xl), medium description (text-base)
- **Examples:** Italicized quotes with attribution
- **Buttons:** Primary CTA "Keep This Tone", Secondary "Choose Different"

### Tone Preset Grid
- **Layout:** 2 columns on mobile, 3-4 on desktop
- **Cards:** Hover effect with subtle shadow
- **Selection:** Border highlight in brand color
- **Preview:** Click to see instant preview of that tone applied to sample content
- **Comparison:** Side-by-side view of original vs new tone

---

## Testing Requirements

### Unit Tests
- [ ] BrandVoiceAnalyzer correctly classifies sample texts
- [ ] ToneClassifier maps to appropriate presets
- [ ] Tone profile structure validation
- [ ] Edge cases: insufficient content, multiple languages

### Integration Tests
- [ ] Tone detection runs during website analysis
- [ ] UVP Wizard displays detected tone
- [ ] User can change tone selection
- [ ] Content generators receive and use tone profile
- [ ] Tone persists in database and reloads correctly

### Manual Testing
- [ ] Test with 10 real business websites
- [ ] Verify tone matches human perception
- [ ] Generated content feels authentic to brand
- [ ] Tone changes reflect in content immediately

---

## Performance Targets

- Tone analysis: <5 seconds
- UI step load: <100ms
- Tone change preview: <1 second
- No impact on content generation speed

---

## Success Metrics

### Detection Accuracy
- 75%+ user acceptance of detected tone (don't click "Choose Different")
- Tone confidence scores >70% for clear brands
- Correct preset classification in blind A/B tests

### Content Quality
- User feedback: "sounds like us" >80%
- Reduced manual editing of AI content
- Higher content publishing rate (less friction)

---

## Future Enhancements (Phase 2+)

- **Multi-Tone Support:** Different tones for different platforms (LinkedIn professional, Instagram casual)
- **Tone Evolution:** Track how brand voice changes over time
- **Competitor Tone Analysis:** Show how your tone compares to competitors
- **A/B Testing:** Test different tones to see which performs better
- **Industry Benchmarks:** "90% of healthcare brands use Caring & Supportive tone"
- **Tone Drift Detection:** Alert if generated content strays from brand voice

---

## Dependencies

**Required Before Starting:**
- Website Analyzer functional
- UVP Wizard 2.0 structure ready
- Business Profile database schema

**API/Library Requirements:**
- OpenAI/Claude for tone classification (already integrated)
- Natural language processing for text analysis (built-in)
- No new external dependencies

---

## Deployment Checklist

- [ ] Database migration for brand_voice column
- [ ] Tone presets data file committed
- [ ] BrandVoiceAnalyzer tested on 10+ real sites
- [ ] UVP Wizard step UI reviewed
- [ ] Content generators updated with tone integration
- [ ] Documentation updated
- [ ] User guide for tone selection
- [ ] Beta testing with 5 customers
- [ ] Analytics tracking tone selection patterns

---

**Last Updated:** 2025-11-15
**Status:** Ready to Build
**Parallel Work:** Can be built alongside Product Scanner & UVP Wizard (integrates at the end)
