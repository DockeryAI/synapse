/**
 * V4 Prompt Library
 *
 * Breakthrough prompts for high-quality content generation.
 * Extracted and refined from V1 BreakthroughPromptLibrary.
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  PromptTemplate,
  PromptCategory,
  PsychologyFramework
} from './types';

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const PROMPT_TEMPLATES: PromptTemplate[] = [
  // LATERAL THINKING - Unexpected connections
  {
    id: 'lateral-connection',
    name: 'Lateral Connection Finder',
    category: 'lateral_thinking',
    framework: 'CuriosityGap',
    template: `You are a lateral thinking expert that finds genuinely unexpected connections that reveal deeper truths.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation: {transformation}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}

YOUR TASK: Find 3 unexpected connections between this brand and:
1. Current cultural moments or trends
2. Other industries that solved similar problems differently
3. Psychological principles that explain customer behavior

QUALITY CRITERIA:
✓ Genuinely unexpected (not obvious industry connection)
✓ Reveals a deeper truth about human behavior
✓ Actionable today (can create content immediately)
✓ Natural connection (not forced or gimmicky)

OUTPUT FORMAT (JSON array):
[
  {
    "connection": "What is the unexpected link?",
    "whyProfound": "What deeper truth does this reveal?",
    "contentAngle": "Specific content angle to pursue",
    "hook": "Attention-grabbing opening line",
    "expectedReaction": "What reaction will this get?"
  }
]`,
    variables: ['targetCustomer', 'transformation', 'uniqueSolution', 'keyBenefit', 'valueProposition'],
    outputFormat: 'json_array'
  },

  // COUNTER-INTUITIVE - Challenge conventional wisdom
  {
    id: 'counter-intuitive',
    name: 'Contrarian Truth Finder',
    category: 'counter_intuitive',
    framework: 'PatternInterrupt',
    template: `You are an analytical expert that finds counter-intuitive truths by examining what everyone believes vs. what actually works.

BRAND UVP:
Target Customer: {targetCustomer}
Their Pain Points: {painPoints}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

YOUR TASK: Generate 3 counter-intuitive insights that challenge industry conventional wisdom.

Focus on:
- What everyone believes but customer behavior contradicts
- Hidden opportunities in common complaints
- Obvious truths that everyone ignores because they seem "too simple"

OUTPUT FORMAT (JSON array):
[
  {
    "counterIntuitiveTruth": "The surprising truth",
    "conventionalWisdom": "What everyone believes",
    "evidence": ["Why this is true 1", "Why this is true 2"],
    "contentHook": "Compelling content angle",
    "openingLine": "Scroll-stopping first sentence"
  }
]`,
    variables: ['targetCustomer', 'painPoints', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json_array'
  },

  // DEEP PSYCHOLOGY - Uncover hidden wants
  {
    id: 'deep-psychology',
    name: 'Hidden Wants Uncoverer',
    category: 'deep_psychology',
    framework: 'BAB',
    template: `You are a depth psychology expert that uncovers what customers REALLY want but can't articulate.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}

YOUR TASK: Uncover 3 deep psychological insights about what customers REALLY want.

Focus on:
- Identity desires they don't admit publicly
- Emotional jobs they're hiring this brand to do
- Permission they need to be granted
- The real reason they buy (vs. stated reason)

OUTPUT FORMAT (JSON array):
[
  {
    "hiddenWant": "What they really want (deeper level)",
    "surfaceWant": "What they say they want",
    "emotionalJob": "Job they're hiring this brand for",
    "contentStrategy": "How to address this in content",
    "permissionGrant": "What permission they need",
    "openingLine": "Emotionally resonant opening"
  }
]`,
    variables: ['targetCustomer', 'transformation', 'keyBenefit', 'valueProposition'],
    outputFormat: 'json_array'
  },

  // STORY POST
  {
    id: 'story-post',
    name: 'Transformation Story',
    category: 'deep_psychology',
    framework: 'StoryBrand',
    template: `You are a master storyteller creating content that connects emotionally.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create a compelling story post that:
1. Opens with a relatable struggle (the BEFORE)
2. Shows the transformation journey
3. Reveals the AFTER state
4. Positions the brand as the guide (not hero)

OUTPUT FORMAT (JSON):
{
  "hook": "Attention-grabbing first line that creates curiosity",
  "struggle": "Relatable pain point story (2-3 sentences)",
  "turning_point": "The moment of discovery (1-2 sentences)",
  "transformation": "The after state with specific results (2-3 sentences)",
  "lesson": "Key takeaway for the reader",
  "cta": "Soft call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // DATA POST
  {
    id: 'data-post',
    name: 'Authority Data Post',
    category: 'pattern_recognition',
    framework: 'SocialProof',
    template: `You are a data storyteller creating content that establishes authority through statistics.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}
Industry: {industry}

Create a data-driven post that:
1. Opens with a surprising statistic or data point
2. Explains why this matters to the target customer
3. Provides actionable insight
4. Positions the brand as knowledgeable authority

OUTPUT FORMAT (JSON):
{
  "hook": "Surprising statistic or data point opening",
  "context": "Why this data matters (2-3 sentences)",
  "insight": "What most people miss about this data",
  "actionable_tip": "What to do with this information",
  "cta": "Authority-building call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'valueProposition', 'industry'],
    outputFormat: 'json'
  },

  // CONTROVERSIAL POST
  {
    id: 'controversial-post',
    name: 'Contrarian Take Post',
    category: 'counter_intuitive',
    framework: 'PatternInterrupt',
    template: `You are a thought leader creating content that challenges the status quo (safely).

BRAND UVP:
Target Customer: {targetCustomer}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}
Industry: {industry}

Create a contrarian post that:
1. Opens with a bold statement that challenges conventional wisdom
2. Backs it up with reasoning
3. Offers a better alternative
4. Remains professional and defensible

IMPORTANT: The controversy should be about ideas/practices, not people.

OUTPUT FORMAT (JSON):
{
  "hook": "Bold contrarian statement that stops scroll",
  "conventional_wisdom": "What most people believe",
  "why_wrong": "Why this belief is outdated or incorrect (2-3 points)",
  "better_approach": "The alternative approach that works better",
  "proof_points": ["Evidence 1", "Evidence 2"],
  "cta": "Engaging call-to-action (invite discussion)",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'uniqueSolution', 'keyBenefit', 'industry'],
    outputFormat: 'json'
  },

  // HOOK POST
  {
    id: 'hook-post',
    name: 'Curiosity Hook Post',
    category: 'lateral_thinking',
    framework: 'CuriosityGap',
    template: `You are a hook specialist creating content that maximizes scroll-stopping power.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}

Create a hook-first post that:
1. Opens with an irresistible hook that creates curiosity gap
2. Builds tension before the reveal
3. Delivers valuable insight
4. Closes with engagement prompt

OUTPUT FORMAT (JSON):
{
  "hook": "Irresistible opening that creates curiosity gap",
  "buildup": "Build tension/anticipation (2-3 sentences)",
  "reveal": "The valuable insight or answer",
  "value_add": "Additional context or tip",
  "engagement_prompt": "Question or CTA that drives comments",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'keyBenefit', 'valueProposition'],
    outputFormat: 'json'
  },

  // EDUCATIONAL TIP POST
  {
    id: 'tip-post',
    name: 'Quick Value Tip',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are a value-first content creator focused on immediate usefulness.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Unique Solution: {uniqueSolution}

Create a quick tip post that:
1. Opens with a clear benefit promise
2. Delivers actionable tip immediately
3. Shows simple implementation
4. Closes with encouragement

OUTPUT FORMAT (JSON):
{
  "hook": "Clear benefit promise (what they'll learn)",
  "tip": "The actual tip in 1-2 sentences",
  "how_to": "Simple steps to implement (3-5 steps max)",
  "why_it_works": "Brief explanation of why this works",
  "encouragement": "Motivating close",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // ============================================================================
  // EXPANDED TEMPLATES - Content Mix Categories
  // ============================================================================

  // VALUE POST - Educational/Helpful
  {
    id: 'value-educational',
    name: 'Educational Value Post',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are an expert educator creating high-value content that establishes thought leadership.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}
Industry: {industry}

Create educational content that:
1. Teaches something genuinely useful in 60 seconds
2. Uses the "What → Why → How" framework
3. Provides a concrete takeaway they can use TODAY
4. Positions brand as trusted expert

OUTPUT FORMAT (JSON):
{
  "hook": "Promise of valuable knowledge",
  "what": "The concept or insight being taught",
  "why": "Why this matters to the reader",
  "how": "Step-by-step implementation",
  "takeaway": "One-line summary they'll remember",
  "cta": "Engagement prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'valueProposition', 'industry'],
    outputFormat: 'json'
  },

  // VALUE POST - Problem-Solution
  {
    id: 'value-problem-solution',
    name: 'Problem-Solution Value Post',
    category: 'deep_psychology',
    framework: 'PAS',
    template: `You are a problem-solving expert creating content that resonates with pain points.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Key Benefit: {keyBenefit}
Pain Points: {painPoints}

Create a problem-solution post using PAS (Problem-Agitate-Solution):
1. Problem: Name the specific struggle
2. Agitate: Show you understand the real pain
3. Solution: Provide actionable relief

OUTPUT FORMAT (JSON):
{
  "hook": "Problem-focused opening that creates recognition",
  "problem": "Specific pain point description (1-2 sentences)",
  "agitation": "Emotional connection to the frustration (2-3 sentences)",
  "solution": "Clear, actionable solution (3-4 sentences)",
  "result": "What life looks like after solving this",
  "cta": "Soft call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'keyBenefit', 'painPoints'],
    outputFormat: 'json'
  },

  // VALUE POST - Myth Buster
  {
    id: 'value-myth-buster',
    name: 'Myth Buster Post',
    category: 'counter_intuitive',
    framework: 'PatternInterrupt',
    template: `You are an industry insider exposing common myths and misconceptions.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Unique Solution: {uniqueSolution}

Create a myth-busting post that:
1. Identifies a widely-believed misconception
2. Explains why it's wrong (with evidence)
3. Reveals the truth
4. Shows what to do instead

OUTPUT FORMAT (JSON):
{
  "hook": "Myth statement that stops scroll",
  "myth": "The common belief (what people think is true)",
  "why_believed": "Why this myth persists",
  "truth": "What the reality actually is",
  "evidence": ["Evidence point 1", "Evidence point 2"],
  "what_to_do": "Actionable alternative approach",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // VALUE POST - Framework
  {
    id: 'value-framework',
    name: 'Framework Post',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are a strategic thinker who creates memorable frameworks.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Unique Solution: {uniqueSolution}

Create a framework post that:
1. Names a memorable framework (acronym or number-based)
2. Explains each component clearly
3. Shows how to apply it
4. Makes complex ideas simple

OUTPUT FORMAT (JSON):
{
  "hook": "Framework promise (e.g., 'The 3-step framework for...')",
  "framework_name": "Memorable name for the framework",
  "components": [
    {"name": "Component 1", "explanation": "What it means and how to use it"},
    {"name": "Component 2", "explanation": "What it means and how to use it"},
    {"name": "Component 3", "explanation": "What it means and how to use it"}
  ],
  "application": "Quick example of using this framework",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // VALUE POST - Case Study
  {
    id: 'value-case-study',
    name: 'Mini Case Study Post',
    category: 'deep_psychology',
    framework: 'SocialProof',
    template: `You are a results-focused storyteller creating compelling case studies.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Transformation Goal: {transformation}

Create a mini case study post that:
1. Sets up the initial challenge
2. Shows what was done
3. Reveals specific results
4. Extracts the lesson

OUTPUT FORMAT (JSON):
{
  "hook": "Result-focused opening (e.g., 'From X to Y in Z time')",
  "situation": "The challenge/starting point",
  "approach": "What was done differently",
  "results": ["Result 1 (specific)", "Result 2 (specific)", "Result 3 (specific)"],
  "lesson": "Key takeaway others can apply",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'transformation'],
    outputFormat: 'json'
  },

  // ENGAGEMENT POST - Question
  {
    id: 'engagement-question',
    name: 'Thought-Provoking Question',
    category: 'lateral_thinking',
    framework: 'CuriosityGap',
    template: `You are a community builder who sparks meaningful conversations.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Value Proposition: {valueProposition}

Create a question post that:
1. Asks something genuinely thought-provoking
2. Is easy to answer (low friction)
3. Reveals insights about the audience
4. Creates conversation, not just likes

OUTPUT FORMAT (JSON):
{
  "hook": "Context-setting opener",
  "question": "The main thought-provoking question",
  "follow_up": "Secondary question or prompt",
  "your_take": "Share your own perspective briefly",
  "cta": "Invitation to respond",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'valueProposition'],
    outputFormat: 'json'
  },

  // ENGAGEMENT POST - This or That
  {
    id: 'engagement-this-or-that',
    name: 'This or That Poll',
    category: 'lateral_thinking',
    framework: 'CuriosityGap',
    template: `You are an engagement specialist creating interactive content.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Key Benefit: {keyBenefit}

Create a "This or That" engagement post that:
1. Presents two relatable options
2. Both options feel valid
3. Reveals something about the chooser
4. Ties back to brand values

OUTPUT FORMAT (JSON):
{
  "hook": "Context for the choice",
  "option_a": "First choice (relatable)",
  "option_b": "Second choice (relatable)",
  "why_it_matters": "What this choice reveals",
  "cta": "Vote prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'keyBenefit'],
    outputFormat: 'json'
  },

  // ENGAGEMENT POST - Opinion
  {
    id: 'engagement-hot-take',
    name: 'Hot Take Post',
    category: 'counter_intuitive',
    framework: 'PatternInterrupt',
    template: `You are a thought leader sharing bold but defensible opinions.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Unique Solution: {uniqueSolution}

Create a hot take post that:
1. States a bold opinion
2. Backs it with reasoning
3. Invites debate (respectfully)
4. Stays professional

OUTPUT FORMAT (JSON):
{
  "hook": "Bold statement that stops scroll",
  "take": "The controversial opinion (1-2 sentences)",
  "reasoning": "Why you believe this (2-3 points)",
  "caveat": "Acknowledgment of the other side",
  "cta": "Invite discussion",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // ENGAGEMENT POST - Prediction
  {
    id: 'engagement-prediction',
    name: 'Industry Prediction Post',
    category: 'pattern_recognition',
    framework: 'Authority',
    template: `You are an industry analyst making informed predictions.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Value Proposition: {valueProposition}

Create a prediction post that:
1. Makes a bold but reasonable prediction
2. Explains the signals supporting it
3. Shows what it means for the audience
4. Positions you as forward-thinking

OUTPUT FORMAT (JSON):
{
  "hook": "Prediction hook (timeframe + bold claim)",
  "prediction": "The specific prediction",
  "signals": ["Signal 1", "Signal 2", "Signal 3"],
  "implications": "What this means for the target audience",
  "preparation": "How to prepare for this shift",
  "cta": "Engagement prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'valueProposition'],
    outputFormat: 'json'
  },

  // PROMO POST - Soft Sell
  {
    id: 'promo-soft-sell',
    name: 'Soft Sell Promo',
    category: 'deep_psychology',
    framework: 'AIDA',
    template: `You are a persuasion expert creating promotional content that doesn't feel salesy.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Key Benefit: {keyBenefit}
Unique Solution: {uniqueSolution}

Create a soft-sell promotional post that:
1. Leads with value or story
2. Naturally introduces the solution
3. Shows transformation
4. Has gentle CTA

OUTPUT FORMAT (JSON):
{
  "hook": "Value or story-first opening",
  "value_content": "Educational or entertaining middle",
  "bridge": "Natural transition to solution",
  "solution_intro": "How your solution fits",
  "transformation": "Before/after contrast",
  "cta": "Soft call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'keyBenefit', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // PROMO POST - Testimonial Story
  {
    id: 'promo-testimonial',
    name: 'Testimonial Story Post',
    category: 'deep_psychology',
    framework: 'SocialProof',
    template: `You are a social proof specialist creating compelling testimonial content.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Key Benefit: {keyBenefit}

Create a testimonial-style post that:
1. Tells a customer story (anonymized if needed)
2. Shows specific transformation
3. Includes emotional elements
4. Inspires action

OUTPUT FORMAT (JSON):
{
  "hook": "Transformation hook",
  "before_state": "Where they started (struggles)",
  "turning_point": "What changed",
  "after_state": "Where they are now (specific results)",
  "customer_quote": "What they said (or would say)",
  "cta": "Invitation for similar results",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'keyBenefit'],
    outputFormat: 'json'
  },

  // PROMO POST - Feature Highlight
  {
    id: 'promo-feature',
    name: 'Feature Benefit Post',
    category: 'pattern_recognition',
    framework: 'FAB',
    template: `You are a product marketer highlighting features through benefits.

BRAND UVP:
Target Customer: {targetCustomer}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create a feature-benefit post using FAB (Feature-Advantage-Benefit):
1. Introduce the feature
2. Explain the advantage
3. Show the real benefit
4. Connect to customer desire

OUTPUT FORMAT (JSON):
{
  "hook": "Benefit-first opening",
  "feature": "What it is",
  "advantage": "What it does better",
  "benefit": "What it means for the customer",
  "use_case": "Specific example of this in action",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // PROMO POST - Problem-Agitate-Solution
  {
    id: 'promo-pas',
    name: 'PAS Promotional Post',
    category: 'deep_psychology',
    framework: 'PAS',
    template: `You are a direct response copywriter using the PAS framework.

BRAND UVP:
Target Customer: {targetCustomer}
Pain Points: {painPoints}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create a PAS promotional post:
1. Problem: Name the pain clearly
2. Agitate: Amplify the consequences
3. Solution: Present your answer

OUTPUT FORMAT (JSON):
{
  "hook": "Pain-point hook",
  "problem": "The specific problem (relatable)",
  "agitation": "Why this problem is worse than they think",
  "consequences": "What happens if nothing changes",
  "solution": "Your unique approach",
  "benefit": "The outcome they'll get",
  "cta": "Strong call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'painPoints', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // BRAND STORY - Behind the Scenes
  {
    id: 'brand-behind-scenes',
    name: 'Behind the Scenes Post',
    category: 'deep_psychology',
    framework: 'StoryBrand',
    template: `You are a brand storyteller creating authentic behind-the-scenes content.

BRAND UVP:
Target Customer: {targetCustomer}
Unique Solution: {uniqueSolution}
Value Proposition: {valueProposition}

Create a behind-the-scenes post that:
1. Shows the human side
2. Reveals process or values
3. Builds connection and trust
4. Maintains professionalism

OUTPUT FORMAT (JSON):
{
  "hook": "Peek behind the curtain opening",
  "context": "What's being shown and why",
  "story": "The narrative or insight (2-3 sentences)",
  "lesson": "What this reveals about values",
  "vulnerability": "Honest moment or challenge",
  "cta": "Connection prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'uniqueSolution', 'valueProposition'],
    outputFormat: 'json'
  },

  // BRAND STORY - Origin/Mission
  {
    id: 'brand-origin',
    name: 'Origin Story Post',
    category: 'deep_psychology',
    framework: 'StoryBrand',
    template: `You are a brand storyteller sharing compelling origin narratives.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Value Proposition: {valueProposition}

Create an origin story post that:
1. Shares the "why" behind the brand
2. Creates emotional connection
3. Demonstrates shared values
4. Inspires trust

OUTPUT FORMAT (JSON):
{
  "hook": "Origin hook (what sparked it all)",
  "struggle": "The challenge that led to this",
  "insight": "The realization or breakthrough",
  "mission": "What drives the brand today",
  "connection": "How this relates to customers",
  "cta": "Community-building prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'valueProposition'],
    outputFormat: 'json'
  },

  // BRAND STORY - Team/Culture
  {
    id: 'brand-culture',
    name: 'Team Culture Post',
    category: 'deep_psychology',
    framework: 'SocialProof',
    template: `You are showcasing team and culture to humanize the brand.

BRAND UVP:
Target Customer: {targetCustomer}
Value Proposition: {valueProposition}
Industry: {industry}

Create a team/culture post that:
1. Highlights people or culture
2. Shows values in action
3. Builds relatability
4. Stays authentic

OUTPUT FORMAT (JSON):
{
  "hook": "Human-interest opening",
  "spotlight": "Who/what is being featured",
  "story": "The narrative or moment",
  "values": "What this shows about culture",
  "impact": "How this benefits customers",
  "cta": "Engagement prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'valueProposition', 'industry'],
    outputFormat: 'json'
  },

  // TREND/NEWS POST - Commentary
  {
    id: 'trend-commentary',
    name: 'Trend Commentary Post',
    category: 'lateral_thinking',
    framework: 'Authority',
    template: `You are an industry commentator providing insights on trends.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Value Proposition: {valueProposition}

Create a trend commentary post that:
1. References a current trend or news
2. Provides unique perspective
3. Explains implications
4. Offers actionable insight

OUTPUT FORMAT (JSON):
{
  "hook": "Trend/news reference",
  "context": "What's happening (brief)",
  "analysis": "Your unique take",
  "implications": "What this means for the audience",
  "action": "What to do about it",
  "cta": "Discussion prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'valueProposition'],
    outputFormat: 'json'
  },

  // TREND/NEWS - Industry Update
  {
    id: 'trend-industry-update',
    name: 'Industry Update Post',
    category: 'pattern_recognition',
    framework: 'Authority',
    template: `You are an industry insider keeping your audience informed.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Key Benefit: {keyBenefit}

Create an industry update post that:
1. Shares important news or changes
2. Explains the significance
3. Provides expert analysis
4. Maintains thought leadership

OUTPUT FORMAT (JSON):
{
  "hook": "Breaking/important news angle",
  "update": "What happened/changed",
  "significance": "Why this matters",
  "expert_take": "Your informed perspective",
  "next_steps": "What audience should do/watch",
  "cta": "Follow for updates prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'keyBenefit'],
    outputFormat: 'json'
  },

  // LISTICLE POST
  {
    id: 'listicle-tips',
    name: 'Tips Listicle Post',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are creating highly shareable listicle content.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Industry: {industry}

Create a tips listicle post that:
1. Has a compelling number
2. Each tip is actionable
3. Builds to the most valuable
4. Easy to scan

OUTPUT FORMAT (JSON):
{
  "hook": "Number-based hook (e.g., '5 ways to...')",
  "tips": [
    {"tip": "Tip 1 title", "explanation": "Brief explanation"},
    {"tip": "Tip 2 title", "explanation": "Brief explanation"},
    {"tip": "Tip 3 title", "explanation": "Brief explanation"},
    {"tip": "Tip 4 title", "explanation": "Brief explanation"},
    {"tip": "Tip 5 title", "explanation": "Brief explanation"}
  ],
  "bonus": "Bonus tip or summary",
  "cta": "Save/share prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'industry'],
    outputFormat: 'json'
  },

  // LISTICLE - Mistakes
  {
    id: 'listicle-mistakes',
    name: 'Common Mistakes Post',
    category: 'counter_intuitive',
    framework: 'PAS',
    template: `You are helping people avoid costly errors.

BRAND UVP:
Target Customer: {targetCustomer}
Pain Points: {painPoints}
Unique Solution: {uniqueSolution}

Create a mistakes listicle post that:
1. Identifies real mistakes people make
2. Explains why they're harmful
3. Shows how to avoid them
4. Positions you as expert

OUTPUT FORMAT (JSON):
{
  "hook": "Mistakes hook (e.g., '3 mistakes that cost...')",
  "mistakes": [
    {"mistake": "Mistake 1", "why_bad": "Why this hurts", "instead": "What to do instead"},
    {"mistake": "Mistake 2", "why_bad": "Why this hurts", "instead": "What to do instead"},
    {"mistake": "Mistake 3", "why_bad": "Why this hurts", "instead": "What to do instead"}
  ],
  "summary": "Key takeaway",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'painPoints', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // COMPARISON POST
  {
    id: 'comparison-then-now',
    name: 'Then vs Now Post',
    category: 'pattern_recognition',
    framework: 'BAB',
    template: `You are creating contrast content that shows evolution.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Industry: {industry}

Create a then vs now comparison post that:
1. Shows clear before/after contrast
2. Highlights positive change
3. Creates relatability
4. Inspires action

OUTPUT FORMAT (JSON):
{
  "hook": "Contrast hook",
  "then": ["Old way 1", "Old way 2", "Old way 3"],
  "now": ["New way 1", "New way 2", "New way 3"],
  "change_driver": "What made this shift possible",
  "lesson": "What this means for the audience",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'industry'],
    outputFormat: 'json'
  },

  // COMPARISON - Beginner vs Pro
  {
    id: 'comparison-beginner-pro',
    name: 'Beginner vs Pro Post',
    category: 'pattern_recognition',
    framework: 'Authority',
    template: `You are showing the difference between amateur and expert approaches.

BRAND UVP:
Target Customer: {targetCustomer}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create a beginner vs pro post that:
1. Contrasts amateur and expert behaviors
2. Teaches through comparison
3. Shows the path to improvement
4. Positions expertise

OUTPUT FORMAT (JSON):
{
  "hook": "Comparison hook",
  "comparisons": [
    {"beginner": "What beginners do", "pro": "What pros do", "why": "Why it matters"},
    {"beginner": "What beginners do", "pro": "What pros do", "why": "Why it matters"},
    {"beginner": "What beginners do", "pro": "What pros do", "why": "Why it matters"}
  ],
  "transition": "How to go from beginner to pro",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // QUOTE POST
  {
    id: 'quote-insight',
    name: 'Insight Quote Post',
    category: 'deep_psychology',
    framework: 'Authority',
    template: `You are sharing wisdom that resonates and inspires.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Value Proposition: {valueProposition}

Create a quote/insight post that:
1. Shares a powerful quote or insight
2. Adds personal context
3. Makes it relevant to audience
4. Inspires reflection or action

OUTPUT FORMAT (JSON):
{
  "quote": "The powerful quote or insight",
  "attribution": "Source or 'Original' if yours",
  "context": "Why this resonates with you",
  "application": "How the audience can apply this",
  "reflection_prompt": "Question for the audience",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'valueProposition'],
    outputFormat: 'json'
  },

  // CAROUSEL/THREAD - Deep Dive
  {
    id: 'carousel-deep-dive',
    name: 'Deep Dive Carousel',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are creating comprehensive carousel/thread content.

BRAND UVP:
Target Customer: {targetCustomer}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}
Industry: {industry}

Create a deep-dive carousel/thread that:
1. Covers a topic comprehensively
2. Each slide/post stands alone
3. Builds to a conclusion
4. Maximizes save/share

OUTPUT FORMAT (JSON):
{
  "hook_slide": "Attention-grabbing first slide",
  "slides": [
    {"title": "Slide 2 title", "content": "Key point and explanation"},
    {"title": "Slide 3 title", "content": "Key point and explanation"},
    {"title": "Slide 4 title", "content": "Key point and explanation"},
    {"title": "Slide 5 title", "content": "Key point and explanation"},
    {"title": "Slide 6 title", "content": "Key point and explanation"}
  ],
  "conclusion_slide": "Summary and key takeaway",
  "cta_slide": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'uniqueSolution', 'keyBenefit', 'industry'],
    outputFormat: 'json'
  },

  // CAROUSEL - How To
  {
    id: 'carousel-how-to',
    name: 'How-To Carousel',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are creating step-by-step tutorial content.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Unique Solution: {uniqueSolution}

Create a how-to carousel/thread that:
1. Teaches a specific skill
2. Clear, numbered steps
3. Visual-friendly format
4. Actionable immediately

OUTPUT FORMAT (JSON):
{
  "hook_slide": "Promise of what they'll learn",
  "steps": [
    {"step_number": 1, "title": "Step title", "instruction": "Clear instruction"},
    {"step_number": 2, "title": "Step title", "instruction": "Clear instruction"},
    {"step_number": 3, "title": "Step title", "instruction": "Clear instruction"},
    {"step_number": 4, "title": "Step title", "instruction": "Clear instruction"},
    {"step_number": 5, "title": "Step title", "instruction": "Clear instruction"}
  ],
  "result_slide": "What they'll achieve",
  "cta_slide": "Save and follow prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // PERSONAL STORY - Lesson Learned
  {
    id: 'personal-lesson',
    name: 'Lesson Learned Post',
    category: 'deep_psychology',
    framework: 'StoryBrand',
    template: `You are sharing personal experiences that teach valuable lessons.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Value Proposition: {valueProposition}

Create a personal lesson post that:
1. Shares a genuine experience
2. Extracts a universal lesson
3. Shows vulnerability
4. Provides value to readers

OUTPUT FORMAT (JSON):
{
  "hook": "Intriguing opening about the experience",
  "situation": "What happened (context)",
  "challenge": "The difficulty or mistake",
  "realization": "What you learned",
  "lesson": "The universal takeaway",
  "application": "How readers can apply this",
  "cta": "Engagement prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'valueProposition'],
    outputFormat: 'json'
  },

  // PERSONAL STORY - Win/Milestone
  {
    id: 'personal-win',
    name: 'Win/Milestone Post',
    category: 'deep_psychology',
    framework: 'SocialProof',
    template: `You are celebrating achievements while providing value.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Transformation Goal: {transformation}

Create a win/milestone post that:
1. Shares a genuine achievement
2. Shows the journey, not just result
3. Thanks and acknowledges others
4. Inspires without bragging

OUTPUT FORMAT (JSON):
{
  "hook": "Milestone announcement",
  "achievement": "What was accomplished",
  "journey": "The path to get there (challenges overcome)",
  "gratitude": "Who helped along the way",
  "lesson": "What you learned that others can apply",
  "cta": "Inspirational close",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'transformation'],
    outputFormat: 'json'
  },

  // AIDA POST
  {
    id: 'aida-conversion',
    name: 'AIDA Conversion Post',
    category: 'deep_psychology',
    framework: 'AIDA',
    template: `You are a conversion copywriter using the AIDA framework.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create an AIDA post:
1. Attention: Grab attention immediately
2. Interest: Build interest with benefits
3. Desire: Create desire for the solution
4. Action: Drive specific action

OUTPUT FORMAT (JSON):
{
  "attention": "Scroll-stopping opener",
  "interest": "Benefit-focused content that builds interest",
  "desire": "Emotional connection and vision of success",
  "action": "Clear, specific call-to-action",
  "urgency": "Why act now",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // PASTOR POST
  {
    id: 'pastor-persuasion',
    name: 'PASTOR Persuasion Post',
    category: 'deep_psychology',
    framework: 'PASTOR',
    template: `You are using the PASTOR framework for persuasive content.

BRAND UVP:
Target Customer: {targetCustomer}
Pain Points: {painPoints}
Unique Solution: {uniqueSolution}
Key Benefit: {keyBenefit}

Create a PASTOR post:
P - Problem: Identify their pain
A - Amplify: Show the consequences
S - Solution: Present your answer
T - Testimonial: Prove it works
O - Offer: Make it clear
R - Response: Call to action

OUTPUT FORMAT (JSON):
{
  "problem": "The pain they experience",
  "amplify": "Why this problem is serious",
  "solution": "Your unique approach",
  "testimonial": "Social proof or evidence",
  "offer": "What they get",
  "response": "Clear call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'painPoints', 'uniqueSolution', 'keyBenefit'],
    outputFormat: 'json'
  },

  // BAB POST
  {
    id: 'bab-transformation',
    name: 'Before-After-Bridge Post',
    category: 'deep_psychology',
    framework: 'BAB',
    template: `You are using the Before-After-Bridge framework.

BRAND UVP:
Target Customer: {targetCustomer}
Transformation Goal: {transformation}
Unique Solution: {uniqueSolution}

Create a BAB post:
1. Before: Paint their current struggle
2. After: Show the desired outcome
3. Bridge: Your solution that connects them

OUTPUT FORMAT (JSON):
{
  "before": "Current state (struggle, frustration)",
  "before_feelings": "How this makes them feel",
  "after": "Desired state (success, relief)",
  "after_feelings": "How they'll feel when they arrive",
  "bridge": "Your solution that makes this possible",
  "cta": "Call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'transformation', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // SCARCITY POST
  {
    id: 'scarcity-urgency',
    name: 'Scarcity/Urgency Post',
    category: 'deep_psychology',
    framework: 'Scarcity',
    template: `You are creating ethical urgency through genuine scarcity.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Unique Solution: {uniqueSolution}

Create a scarcity post that:
1. Establishes genuine limitation
2. Emphasizes value first
3. Creates FOMO ethically
4. Has clear deadline

OUTPUT FORMAT (JSON):
{
  "hook": "Urgency hook (what's limited)",
  "value": "Why this opportunity matters",
  "scarcity": "What's limited (time, spots, etc.)",
  "social_proof": "Who else is taking action",
  "deadline": "When this ends",
  "cta": "Urgent call-to-action",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // CURIOSITY GAP POST
  {
    id: 'curiosity-teaser',
    name: 'Curiosity Teaser Post',
    category: 'lateral_thinking',
    framework: 'CuriosityGap',
    template: `You are creating curiosity-driven content that compels clicks.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Value Proposition: {valueProposition}

Create a curiosity gap post that:
1. Creates an irresistible question
2. Hints at the answer
3. Delivers real value
4. Rewards the click/read

OUTPUT FORMAT (JSON):
{
  "hook": "Curiosity-creating opening",
  "tease": "Hint at what they'll discover",
  "buildup": "Build anticipation",
  "reveal": "The valuable insight/answer",
  "expansion": "Additional context or depth",
  "cta": "Engagement prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'valueProposition'],
    outputFormat: 'json'
  },

  // RECIPROCITY POST
  {
    id: 'reciprocity-gift',
    name: 'Free Value Gift Post',
    category: 'pattern_recognition',
    framework: 'Reciprocity',
    template: `You are giving away genuine value to build reciprocity.

BRAND UVP:
Target Customer: {targetCustomer}
Key Benefit: {keyBenefit}
Unique Solution: {uniqueSolution}

Create a reciprocity post that:
1. Gives something valuable for free
2. No strings attached feel
3. Demonstrates expertise
4. Builds goodwill

OUTPUT FORMAT (JSON):
{
  "hook": "Gift announcement",
  "gift": "What you're giving away",
  "value": "Why this is valuable",
  "how_to_get": "How to access it (simple)",
  "no_catch": "Reassurance there's no hidden agenda",
  "cta": "Simple access prompt",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'keyBenefit', 'uniqueSolution'],
    outputFormat: 'json'
  },

  // AUTHORITY POST
  {
    id: 'authority-expertise',
    name: 'Authority Expertise Post',
    category: 'pattern_recognition',
    framework: 'Authority',
    template: `You are establishing thought leadership and expertise.

BRAND UVP:
Target Customer: {targetCustomer}
Industry: {industry}
Value Proposition: {valueProposition}

Create an authority-building post that:
1. Demonstrates deep expertise
2. Shares unique insight
3. Backs claims with evidence
4. Positions as go-to expert

OUTPUT FORMAT (JSON):
{
  "hook": "Expert insight hook",
  "credentials": "What qualifies you to speak on this",
  "insight": "The unique perspective or knowledge",
  "evidence": ["Supporting point 1", "Supporting point 2"],
  "application": "How to apply this knowledge",
  "cta": "Follow for more expertise",
  "hashtags": ["relevant", "hashtags"]
}`,
    variables: ['targetCustomer', 'industry', 'valueProposition'],
    outputFormat: 'json'
  }
];

// ============================================================================
// PROMPT LIBRARY CLASS
// ============================================================================

class PromptLibrary {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = new Map();
    PROMPT_TEMPLATES.forEach(t => this.templates.set(t.id, t));
  }

  /**
   * Get all templates
   */
  getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  getByCategory(category: PromptCategory): PromptTemplate[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * Get templates by framework
   */
  getByFramework(framework: PsychologyFramework): PromptTemplate[] {
    return this.getAll().filter(t => t.framework === framework);
  }

  /**
   * Build prompt from template with UVP data
   */
  buildPrompt(templateId: string, uvp: CompleteUVP, extraVars?: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Map UVP to template variables
    const variables: Record<string, string> = {
      targetCustomer: this.formatTargetCustomer(uvp),
      transformation: this.formatTransformation(uvp),
      uniqueSolution: this.formatUniqueSolution(uvp),
      keyBenefit: this.formatKeyBenefit(uvp),
      valueProposition: uvp.valuePropositionStatement || '',
      painPoints: this.formatPainPoints(uvp),
      industry: uvp.targetCustomer?.industry || 'business',
      ...extraVars
    };

    // Replace variables in template
    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return prompt;
  }

  /**
   * Format target customer from UVP
   */
  private formatTargetCustomer(uvp: CompleteUVP): string {
    const tc = uvp.targetCustomer;
    if (!tc) return 'Target customer not defined';

    const parts: string[] = [];
    if (tc.statement) parts.push(tc.statement);
    if (tc.industry) parts.push(`Industry: ${tc.industry}`);
    if (tc.role) parts.push(`Role: ${tc.role}`);
    if (tc.emotionalDrivers?.length) {
      parts.push(`Emotional drivers: ${tc.emotionalDrivers.slice(0, 3).join(', ')}`);
    }
    if (tc.functionalDrivers?.length) {
      parts.push(`Functional needs: ${tc.functionalDrivers.slice(0, 3).join(', ')}`);
    }

    return parts.join('. ') || 'Target customer not defined';
  }

  /**
   * Format transformation goal from UVP
   */
  private formatTransformation(uvp: CompleteUVP): string {
    const tg = uvp.transformationGoal;
    if (!tg) return 'Transformation not defined';

    const parts: string[] = [];
    if (tg.before) parts.push(`From: ${tg.before}`);
    if (tg.after) parts.push(`To: ${tg.after}`);
    if (tg.statement) parts.push(tg.statement);
    if (tg.emotionalDrivers?.length) {
      parts.push(`Emotional drivers: ${tg.emotionalDrivers.slice(0, 2).join(', ')}`);
    }

    return parts.join('. ') || 'Transformation not defined';
  }

  /**
   * Format unique solution from UVP
   */
  private formatUniqueSolution(uvp: CompleteUVP): string {
    const us = uvp.uniqueSolution;
    if (!us) return 'Solution not defined';

    const parts: string[] = [];
    if (us.statement) parts.push(us.statement);
    if (us.differentiators?.length) {
      const diffs = us.differentiators.slice(0, 3).map(d => d.statement).join(', ');
      parts.push(`Differentiators: ${diffs}`);
    }
    if (us.methodology) parts.push(`Method: ${us.methodology}`);
    if (us.proprietaryApproach) parts.push(`Proprietary approach: ${us.proprietaryApproach}`);

    return parts.join('. ') || 'Solution not defined';
  }

  /**
   * Format key benefit from UVP
   */
  private formatKeyBenefit(uvp: CompleteUVP): string {
    const kb = uvp.keyBenefit;
    if (!kb) return 'Benefit not defined';

    const parts: string[] = [];
    if (kb.statement) parts.push(kb.statement);
    if (kb.outcomeType) parts.push(`Type: ${kb.outcomeType}`);
    if (kb.metrics?.length) {
      const metricsStr = kb.metrics.slice(0, 2).map(m => `${m.metric}: ${m.value}`).join(', ');
      parts.push(`Metrics: ${metricsStr}`);
    }

    return parts.join('. ') || 'Benefit not defined';
  }

  /**
   * Format pain points from UVP (extracted from emotional/functional drivers)
   */
  private formatPainPoints(uvp: CompleteUVP): string {
    const tc = uvp.targetCustomer;
    const tg = uvp.transformationGoal;

    const painPoints: string[] = [];

    // Get emotional drivers as pain points
    if (tc?.emotionalDrivers?.length) {
      painPoints.push(...tc.emotionalDrivers.slice(0, 2));
    }

    // Get functional drivers as pain points
    if (tc?.functionalDrivers?.length) {
      painPoints.push(...tc.functionalDrivers.slice(0, 2));
    }

    // Also include transformation's emotional drivers
    if (tg?.emotionalDrivers?.length) {
      painPoints.push(...tg.emotionalDrivers.slice(0, 1));
    }

    if (!painPoints.length) return 'Pain points not defined';
    return painPoints.slice(0, 5).join('; ');
  }

  /**
   * Select best template for content goal
   */
  selectTemplate(goal: 'engagement' | 'authority' | 'conversion' | 'awareness'): PromptTemplate {
    const templateMap: Record<string, string> = {
      engagement: 'hook-post',
      authority: 'data-post',
      conversion: 'story-post',
      awareness: 'controversial-post'
    };

    const templateId = templateMap[goal] || 'tip-post';
    return this.templates.get(templateId) || PROMPT_TEMPLATES[0];
  }

  /**
   * Get random template for variety
   */
  getRandomTemplate(): PromptTemplate {
    const templates = this.getAll();
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

// Export singleton instance
export const promptLibrary = new PromptLibrary();

// Export class for testing
export { PromptLibrary };
