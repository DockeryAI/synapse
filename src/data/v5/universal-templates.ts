/**
 * V5 Universal Templates
 *
 * Structure-based templates with psychology tags.
 * These are platform-optimized and customer-category-mapped.
 *
 * Each template contains {{variable}} placeholders for UVP substitution.
 *
 * Created: 2025-12-01
 */

import type { UniversalTemplate } from '@/services/v5/types';

export const UNIVERSAL_TEMPLATES: UniversalTemplate[] = [
  // ============================================================================
  // LINKEDIN TEMPLATES
  // ============================================================================

  // Authority / Trust-seeking
  {
    id: 'li-authority-01',
    structure: 'authority',
    contentType: 'educational',
    platform: 'linkedin',
    template: `After helping {{target_customer}} for years, here's what I've learned:

Most {{target_customer}} think they need more [common assumption].

The truth? {{key_benefit}}.

Here's why this matters:

{{transformation}}

If you're ready to {{differentiator}}, let's talk.

#leadership #business`,
    psychologyTags: {
      primaryTrigger: 'authority',
      secondaryTriggers: ['credibility', 'insight'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 78,
  },

  // Transformation / Aspiration-driven
  {
    id: 'li-transform-01',
    structure: 'transformation',
    contentType: 'educational',
    platform: 'linkedin',
    template: `6 months ago, our client was stuck in [problem state].

Today? {{transformation}}.

What changed:

1. They stopped [old approach]
2. They started {{unique_solution}}
3. They committed to consistency

The result: {{key_benefit}}

{{business_name}} helped make it happen.

DM me "TRANSFORM" if you want similar results.`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['transformation', 'proof'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['aspiration-driven', 'value-driven'],
    averageScore: 82,
  },

  // Problem-Agitate-Solve / Pain-driven
  {
    id: 'li-pas-01',
    structure: 'offer',
    contentType: 'promotional',
    platform: 'linkedin',
    template: `{{target_customer}}, are you tired of [pain point]?

You've tried everything:
- [Common solution 1]
- [Common solution 2]
- [Common solution 3]

But nothing works because they all miss the real problem.

{{unique_solution}}

That's how {{business_name}} helps you achieve {{key_benefit}}.

Ready to finally solve this? Link in comments.`,
    psychologyTags: {
      primaryTrigger: 'pain',
      secondaryTriggers: ['frustration', 'solution'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven'],
    averageScore: 75,
  },

  // List / Convenience-driven
  {
    id: 'li-list-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'linkedin',
    template: `5 ways {{target_customer}} can {{key_benefit}} this week:

1. [Action step 1]
2. [Action step 2]
3. [Action step 3]
4. [Action step 4]
5. {{differentiator}}

Number 5 is what separates good from great.

Save this post for later.

Which one will you try first?`,
    psychologyTags: {
      primaryTrigger: 'simplicity',
      secondaryTriggers: ['actionability', 'value'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven', 'value-driven'],
    averageScore: 80,
  },

  // Engagement / Community-driven
  {
    id: 'li-engage-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'linkedin',
    template: `Hot take: [Controversial but true statement about industry].

I used to think the opposite.

Then I realized {{transformation}}.

Now I help {{target_customer}} achieve {{key_benefit}}.

Agree or disagree? Drop your take below.`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['curiosity', 'debate'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven'],
    averageScore: 76,
  },

  // Testimonial / Trust-seeking
  {
    id: 'li-testimonial-01',
    structure: 'testimonial',
    contentType: 'promotional',
    platform: 'linkedin',
    template: `"I wish I had found {{business_name}} sooner."

That's what [Client Name] told me after {{transformation}}.

Before working with us:
- [Pain state 1]
- [Pain state 2]

After {{unique_solution}}:
- {{key_benefit}}
- [Result 2]

We help {{target_customer}} get results like this every day.

Want to be our next success story? DM me.`,
    psychologyTags: {
      primaryTrigger: 'proof',
      secondaryTriggers: ['trust', 'aspiration'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['trust-seeking', 'aspiration-driven'],
    averageScore: 81,
  },

  // ============================================================================
  // FACEBOOK TEMPLATES
  // ============================================================================

  // Story / Community-driven
  {
    id: 'fb-story-01',
    structure: 'storytelling',
    contentType: 'community',
    platform: 'facebook',
    template: `True story about a {{target_customer}} we helped...

They came to us [struggling with pain point].

We said: "Let's try {{unique_solution}}."

3 weeks later? {{transformation}}.

Now they have {{key_benefit}}.

This is why we do what we do at {{business_name}}.

Drop a [emoji] if you've ever felt stuck like this.`,
    psychologyTags: {
      primaryTrigger: 'connection',
      secondaryTriggers: ['story', 'empathy'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'aspiration-driven'],
    averageScore: 79,
  },

  // Question / Engagement
  {
    id: 'fb-question-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'facebook',
    template: `Quick question for {{target_customer}}...

What's the ONE thing stopping you from {{transformation}}?

Is it:
A) Time
B) Budget
C) Not knowing where to start
D) Something else (tell me!)

We've helped hundreds overcome all of these with {{unique_solution}}.

Comment below - I read every response!`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['curiosity', 'participation'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'pain-driven'],
    averageScore: 77,
  },

  // Offer / Pain-driven
  {
    id: 'fb-offer-01',
    structure: 'offer',
    contentType: 'promotional',
    platform: 'facebook',
    template: `ATTENTION {{target_customer}}!

Tired of [pain point]?

{{business_name}} is now offering {{unique_solution}}.

What you get:
- {{key_benefit}}
- [Benefit 2]
- [Benefit 3]

Limited spots available this month.

Comment "INFO" or message us to learn more!`,
    psychologyTags: {
      primaryTrigger: 'urgency',
      secondaryTriggers: ['scarcity', 'solution'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven', 'convenience-driven'],
    averageScore: 74,
  },

  // How-to / Convenience-driven
  {
    id: 'fb-howto-01',
    structure: 'how-to',
    contentType: 'educational',
    platform: 'facebook',
    template: `How {{target_customer}} can {{key_benefit}} in 3 simple steps:

Step 1: [First action]
Step 2: {{unique_solution}}
Step 3: [Final action]

It really is that simple.

{{business_name}} has helped hundreds of people achieve {{transformation}}.

Want help getting started? Drop a [emoji] below!`,
    psychologyTags: {
      primaryTrigger: 'simplicity',
      secondaryTriggers: ['actionability', 'ease'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven', 'value-driven'],
    averageScore: 78,
  },

  // ============================================================================
  // INSTAGRAM TEMPLATES
  // ============================================================================

  // Hook + Value / All categories
  {
    id: 'ig-hook-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'instagram',
    template: `Stop making this mistake [emoji]

Every {{target_customer}} I meet is doing this wrong.

They think [common misconception].

But the truth is {{key_benefit}}.

Here's what to do instead:

{{unique_solution}}

Save this for later!

#tips #business #growth`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['authority', 'value'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['pain-driven', 'convenience-driven', 'value-driven'],
    averageScore: 76,
  },

  // Behind-scenes / Community
  {
    id: 'ig-bts-01',
    structure: 'storytelling',
    contentType: 'community',
    platform: 'instagram',
    template: `Day in the life at {{business_name}} [emoji]

This is what it looks like when we help {{target_customer}} achieve {{transformation}}.

The best part? {{key_benefit}}.

Tag someone who needs to see this!

#behindthescenes #smallbusiness #dayinthelife`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['authenticity', 'connection'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven'],
    averageScore: 75,
  },

  // Transformation / Aspiration
  {
    id: 'ig-transform-01',
    structure: 'transformation',
    contentType: 'promotional',
    platform: 'instagram',
    template: `The transformation is real [emoji]

BEFORE: [Pain state]
AFTER: {{transformation}}

How? {{unique_solution}}

{{business_name}} helps {{target_customer}} get these results.

Ready for your transformation? Link in bio!

#transformation #results #beforeafter`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['proof', 'transformation'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['aspiration-driven', 'value-driven'],
    averageScore: 80,
  },

  // ============================================================================
  // TWITTER TEMPLATES
  // ============================================================================

  // Thread starter / All categories
  {
    id: 'tw-thread-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'twitter',
    template: `{{target_customer}}, here's how to {{key_benefit}} (thread):

1/ Stop [common mistake]
2/ Start {{unique_solution}}
3/ {{transformation}}

Thread [emoji]`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['value', 'actionability'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven', 'value-driven', 'pain-driven'],
    averageScore: 77,
  },

  // Hot take / Community
  {
    id: 'tw-hottake-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'twitter',
    template: `Unpopular opinion:

{{target_customer}} don't need [common belief].

They need {{key_benefit}}.

That's exactly what {{business_name}} delivers.`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['controversy', 'belonging'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'trust-seeking'],
    averageScore: 74,
  },

  // Quick tip / Convenience
  {
    id: 'tw-tip-01',
    structure: 'how-to',
    contentType: 'educational',
    platform: 'twitter',
    template: `Quick tip for {{target_customer}}:

{{unique_solution}}

Result: {{key_benefit}}

You're welcome.`,
    psychologyTags: {
      primaryTrigger: 'simplicity',
      secondaryTriggers: ['actionability', 'value'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven', 'value-driven'],
    averageScore: 76,
  },

  // ============================================================================
  // TIKTOK TEMPLATES
  // ============================================================================

  // Hook-first / Pain-driven
  {
    id: 'tt-hook-01',
    structure: 'storytelling',
    contentType: 'educational',
    platform: 'tiktok',
    template: `POV: You're a {{target_customer}} who finally figured out {{unique_solution}}

[Visual: Reaction/transformation moment]

The result? {{key_benefit}}

{{business_name}} makes this happen.`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['relatability', 'aspiration'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['pain-driven', 'aspiration-driven'],
    averageScore: 78,
  },

  // Trend / Community
  {
    id: 'tt-trend-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'tiktok',
    template: `Things {{target_customer}} are tired of hearing [emoji]

"[Common annoying advice 1]"
"[Common annoying advice 2]"

What actually works: {{unique_solution}}

#relatable #fyp`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['humor', 'relatability'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'pain-driven'],
    averageScore: 75,
  },

  // Educational / Value
  {
    id: 'tt-edu-01',
    structure: 'how-to',
    contentType: 'educational',
    platform: 'tiktok',
    template: `3 things every {{target_customer}} needs to know:

1. [Quick fact 1]
2. {{unique_solution}}
3. {{key_benefit}}

Follow for more tips!

#tips #business #fyp`,
    psychologyTags: {
      primaryTrigger: 'value',
      secondaryTriggers: ['simplicity', 'authority'],
      urgencyLevel: 'low',
    },
    customerCategories: ['value-driven', 'convenience-driven'],
    averageScore: 76,
  },

  // ============================================================================
  // ADDITIONAL LINKEDIN TEMPLATES (for more coverage)
  // ============================================================================

  // Value-driven comparison
  {
    id: 'li-compare-01',
    structure: 'offer',
    contentType: 'educational',
    platform: 'linkedin',
    template: `The difference between average and exceptional {{target_customer}}:

Average: Does [standard approach]
Exceptional: {{unique_solution}}

The result for exceptional? {{key_benefit}}.

At {{business_name}}, we only work with those who want exceptional.

Is that you?`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['comparison', 'identity'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['aspiration-driven', 'value-driven'],
    averageScore: 79,
  },

  // FAQ / Trust-seeking
  {
    id: 'li-faq-01',
    structure: 'faq',
    contentType: 'educational',
    platform: 'linkedin',
    template: `FAQ from {{target_customer}} we work with:

Q: "Can I really achieve {{transformation}}?"

A: Yes, if you:
- Commit to {{unique_solution}}
- Stay consistent
- Trust the process

The result? {{key_benefit}}.

What questions do YOU have? Drop them below.`,
    psychologyTags: {
      primaryTrigger: 'trust',
      secondaryTriggers: ['authority', 'proof'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking'],
    averageScore: 77,
  },

  // Announcement / All categories
  {
    id: 'li-announce-01',
    structure: 'announcement',
    contentType: 'promotional',
    platform: 'linkedin',
    template: `Big news for {{target_customer}}...

{{business_name}} is now offering {{unique_solution}}.

This means you can finally:
- {{key_benefit}}
- [Additional benefit]
- {{transformation}}

Limited availability.

Comment "INTERESTED" to learn more.`,
    psychologyTags: {
      primaryTrigger: 'urgency',
      secondaryTriggers: ['scarcity', 'excitement'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven', 'aspiration-driven', 'convenience-driven'],
    averageScore: 76,
  },

  // ============================================================================
  // ADDITIONAL FACEBOOK TEMPLATES
  // ============================================================================

  // Testimonial / Trust-seeking
  {
    id: 'fb-testimonial-01',
    structure: 'testimonial',
    contentType: 'promotional',
    platform: 'facebook',
    template: `We just got this message from a happy customer:

"{{business_name}} changed everything for me. I went from [pain state] to {{transformation}} in just weeks."

This is what we do for {{target_customer}} every single day.

{{unique_solution}} really works.

Ready to be our next success story? Message us!`,
    psychologyTags: {
      primaryTrigger: 'proof',
      secondaryTriggers: ['trust', 'aspiration'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['trust-seeking', 'aspiration-driven'],
    averageScore: 79,
  },

  // Value comparison / Value-driven
  {
    id: 'fb-value-01',
    structure: 'offer',
    contentType: 'educational',
    platform: 'facebook',
    template: `{{target_customer}}, here's the math:

Option A: Keep doing [old way] → same results
Option B: Try {{unique_solution}} → {{key_benefit}}

The choice seems obvious, right?

{{business_name}} has helped hundreds make the switch.

Which option are you choosing? Comment below!`,
    psychologyTags: {
      primaryTrigger: 'logic',
      secondaryTriggers: ['comparison', 'value'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['value-driven', 'convenience-driven'],
    averageScore: 77,
  },

  // ============================================================================
  // ADDITIONAL INSTAGRAM TEMPLATES
  // ============================================================================

  // Authority / Trust-seeking
  {
    id: 'ig-authority-01',
    structure: 'authority',
    contentType: 'educational',
    platform: 'instagram',
    template: `I've helped 100+ {{target_customer}} achieve {{transformation}} [emoji]

Here's the #1 thing they all did:

{{unique_solution}}

The result? {{key_benefit}}

Follow @{{business_name}} for more tips!

#expert #tips #success`,
    psychologyTags: {
      primaryTrigger: 'authority',
      secondaryTriggers: ['credibility', 'proof'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 78,
  },

  // Pain-point / Pain-driven
  {
    id: 'ig-pain-01',
    structure: 'offer',
    contentType: 'promotional',
    platform: 'instagram',
    template: `Still struggling with [pain point]? [emoji]

You're not alone. Every {{target_customer}} faces this.

But here's what actually works:

{{unique_solution}}

{{business_name}} can help you achieve {{key_benefit}}.

DM "HELP" to get started!

#solution #help #transformation`,
    psychologyTags: {
      primaryTrigger: 'pain',
      secondaryTriggers: ['empathy', 'solution'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven'],
    averageScore: 76,
  },

  // ============================================================================
  // ADDITIONAL TWITTER TEMPLATES
  // ============================================================================

  // Proof / Trust-seeking
  {
    id: 'tw-proof-01',
    structure: 'testimonial',
    contentType: 'promotional',
    platform: 'twitter',
    template: `"{{business_name}} helped me {{transformation}}"

This is what {{target_customer}} say after trying {{unique_solution}}.

Results speak louder than promises.`,
    psychologyTags: {
      primaryTrigger: 'proof',
      secondaryTriggers: ['trust', 'credibility'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 75,
  },

  // Aspiration / Aspiration-driven
  {
    id: 'tw-aspire-01',
    structure: 'transformation',
    contentType: 'educational',
    platform: 'twitter',
    template: `Where you are: [current state]
Where you could be: {{transformation}}

The bridge? {{unique_solution}}

{{business_name}} helps {{target_customer}} cross it daily.`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['transformation', 'possibility'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['aspiration-driven', 'pain-driven'],
    averageScore: 77,
  },

  // ============================================================================
  // ADDITIONAL TIKTOK TEMPLATES
  // ============================================================================

  // Transformation reveal / Aspiration-driven
  {
    id: 'tt-reveal-01',
    structure: 'transformation',
    contentType: 'promotional',
    platform: 'tiktok',
    template: `Wait for it... [emoji]

[Before clip: Pain state]
[After clip: {{transformation}}]

How? {{unique_solution}}

{{business_name}} did this for a {{target_customer}}.

Your turn? Link in bio!

#transformation #glow #fyp`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['curiosity', 'proof'],
      urgencyLevel: 'high',
    },
    customerCategories: ['aspiration-driven', 'trust-seeking'],
    averageScore: 80,
  },

  // Trust-building / Trust-seeking
  {
    id: 'tt-trust-01',
    structure: 'authority',
    contentType: 'educational',
    platform: 'tiktok',
    template: `Why {{target_customer}} trust {{business_name}}:

[emoji] We deliver {{key_benefit}}
[emoji] {{unique_solution}}
[emoji] Real results: {{transformation}}

Don't just take our word for it - see for yourself!

#trustworthy #results #fyp`,
    psychologyTags: {
      primaryTrigger: 'trust',
      secondaryTriggers: ['credibility', 'proof'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 76,
  },

  // ============================================================================
  // PHASE 6 EXPANSION: 20 NEW TEMPLATES FOR FULL COVERAGE
  // ============================================================================

  // LinkedIn - Urgency / Pain-driven
  {
    id: 'li-urgency-01',
    structure: 'offer',
    contentType: 'promotional',
    platform: 'linkedin',
    template: `{{target_customer}}, the clock is ticking.

Every day you wait on [pain point], you're losing:
- Time
- Money
- Opportunity

{{business_name}} offers {{unique_solution}} to help you {{key_benefit}}.

This week only: Free strategy session.

Comment "READY" to claim your spot.`,
    psychologyTags: {
      primaryTrigger: 'urgency',
      secondaryTriggers: ['fear', 'scarcity'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven'],
    averageScore: 77,
  },

  // LinkedIn - Behind the scenes / Community-driven
  {
    id: 'li-bts-01',
    structure: 'storytelling',
    contentType: 'community',
    platform: 'linkedin',
    template: `Here's what really happens at {{business_name}}...

[Photo/Video of team or process]

This is us helping {{target_customer}} achieve {{transformation}}.

It's not glamorous. It's not always easy.

But when we see {{key_benefit}} happen for our clients?

That's why we do this.

What drives YOUR work? Share below.`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['authenticity', 'connection'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven'],
    averageScore: 78,
  },

  // LinkedIn - ROI Focus / Value-driven
  {
    id: 'li-roi-01',
    structure: 'offer',
    contentType: 'educational',
    platform: 'linkedin',
    template: `Let's talk ROI, {{target_customer}}.

Investment: {{unique_solution}}
Return: {{key_benefit}}

Here's the math our clients love:

- Before: [Quantifiable pain point]
- After: {{transformation}}
- Timeline: [Realistic timeframe]

The numbers don't lie.

Want to run YOUR numbers? DM me "ROI"`,
    psychologyTags: {
      primaryTrigger: 'logic',
      secondaryTriggers: ['value', 'proof'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['value-driven'],
    averageScore: 79,
  },

  // Facebook - Local Hero / Community-driven
  {
    id: 'fb-local-01',
    structure: 'storytelling',
    contentType: 'community',
    platform: 'facebook',
    template: `Proud to serve our local {{target_customer}} right here in [Location]!

{{business_name}} has been helping neighbors achieve {{transformation}} for [time period].

We love being part of this community.

{{key_benefit}} isn't just what we do - it's who we are.

Tag a local business owner who deserves a shoutout!`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['pride', 'community'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven'],
    averageScore: 76,
  },

  // Facebook - Myth-buster / Trust-seeking
  {
    id: 'fb-myth-01',
    structure: 'educational',
    contentType: 'educational',
    platform: 'facebook',
    template: `MYTH: [Common misconception about industry]

TRUTH: {{key_benefit}} when you {{unique_solution}}.

{{target_customer}} have been told the wrong thing for years.

At {{business_name}}, we set the record straight.

The result? {{transformation}}

What myth would YOU like us to bust? Drop it below!`,
    psychologyTags: {
      primaryTrigger: 'trust',
      secondaryTriggers: ['authority', 'education'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 77,
  },

  // Facebook - Urgency sale / Pain-driven
  {
    id: 'fb-urgency-01',
    structure: 'offer',
    contentType: 'promotional',
    platform: 'facebook',
    template: `⚡ FLASH ANNOUNCEMENT for {{target_customer}} ⚡

For the next 48 hours only:

{{unique_solution}} → {{key_benefit}}

Why the rush? Because we know waiting costs you more.

{{business_name}} wants you to start {{transformation}} NOW.

Comment "IN" before spots fill up!`,
    psychologyTags: {
      primaryTrigger: 'urgency',
      secondaryTriggers: ['scarcity', 'fear'],
      urgencyLevel: 'high',
    },
    customerCategories: ['pain-driven', 'convenience-driven'],
    averageScore: 74,
  },

  // Instagram - Carousel preview / Educational
  {
    id: 'ig-carousel-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'instagram',
    template: `Swipe to learn how {{target_customer}} can {{key_benefit}} →

Slide 1: The problem [pain point]
Slide 2: Why it matters
Slide 3: {{unique_solution}}
Slide 4: {{transformation}}
Slide 5: Get started with {{business_name}}

Save this for later!

#education #tips #howto`,
    psychologyTags: {
      primaryTrigger: 'value',
      secondaryTriggers: ['education', 'actionability'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven', 'value-driven'],
    averageScore: 79,
  },

  // Instagram - Quote / Aspiration-driven
  {
    id: 'ig-quote-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'instagram',
    template: `"{{transformation}}" - Our client

This is what's possible when {{target_customer}} work with {{business_name}}.

{{unique_solution}} leads to {{key_benefit}}.

Your success story is waiting.

Double tap if you're ready to write yours!

#motivation #success #transformation`,
    psychologyTags: {
      primaryTrigger: 'aspiration',
      secondaryTriggers: ['inspiration', 'proof'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['aspiration-driven', 'trust-seeking'],
    averageScore: 77,
  },

  // Instagram - Reel script / Pain-driven
  {
    id: 'ig-reel-01',
    structure: 'storytelling',
    contentType: 'promotional',
    platform: 'instagram',
    template: `[Reel Script]

HOOK: "{{target_customer}}, you need to see this"

PROBLEM: [Show pain point]

SOLUTION: {{unique_solution}}

RESULT: {{transformation}}

CTA: Follow {{business_name}} for more!

#reels #viral #fyp`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['pain', 'solution'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['pain-driven', 'convenience-driven'],
    averageScore: 78,
  },

  // Twitter - Contrarian / Trust-seeking
  {
    id: 'tw-contrarian-01',
    structure: 'engagement',
    contentType: 'educational',
    platform: 'twitter',
    template: `Everyone tells {{target_customer}} to [common advice].

That's wrong.

Instead: {{unique_solution}}

The result: {{key_benefit}}

{{business_name}} has proven this 100+ times.`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['authority', 'controversy'],
      urgencyLevel: 'low',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 76,
  },

  // Twitter - Celebration / Community-driven
  {
    id: 'tw-celebrate-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'twitter',
    template: `Just helped another {{target_customer}} achieve {{transformation}} 🎉

That's [number] this month alone.

{{unique_solution}} + {{business_name}} = {{key_benefit}}

Who's next?`,
    psychologyTags: {
      primaryTrigger: 'proof',
      secondaryTriggers: ['belonging', 'celebration'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['community-driven', 'trust-seeking'],
    averageScore: 75,
  },

  // Twitter - One-liner / Convenience-driven
  {
    id: 'tw-oneliner-01',
    structure: 'how-to',
    contentType: 'educational',
    platform: 'twitter',
    template: `{{target_customer}}: {{unique_solution}} = {{key_benefit}}

That's it. That's the tweet.`,
    psychologyTags: {
      primaryTrigger: 'simplicity',
      secondaryTriggers: ['directness', 'value'],
      urgencyLevel: 'low',
    },
    customerCategories: ['convenience-driven'],
    averageScore: 74,
  },

  // TikTok - Storytime / Community-driven
  {
    id: 'tt-storytime-01',
    structure: 'storytelling',
    contentType: 'community',
    platform: 'tiktok',
    template: `Storytime: How we helped a {{target_customer}} go from [disaster] to {{transformation}} 🎬

[Visual: Before/after or reenactment]

The secret? {{unique_solution}}

Now they have {{key_benefit}}.

Follow {{business_name}} for more stories!

#storytime #fyp #success`,
    psychologyTags: {
      primaryTrigger: 'connection',
      secondaryTriggers: ['story', 'proof'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'aspiration-driven'],
    averageScore: 79,
  },

  // TikTok - Duet/Reply / Pain-driven
  {
    id: 'tt-duet-01',
    structure: 'engagement',
    contentType: 'educational',
    platform: 'tiktok',
    template: `Reply to @someone who asked "How do I [pain point]?"

Here's what {{target_customer}} need to know:

{{unique_solution}}

Result: {{key_benefit}}

{{business_name}} can help you get {{transformation}}.

#stitch #duet #advice #fyp`,
    psychologyTags: {
      primaryTrigger: 'helpfulness',
      secondaryTriggers: ['authority', 'engagement'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['pain-driven', 'trust-seeking'],
    averageScore: 77,
  },

  // TikTok - Mistake callout / Value-driven
  {
    id: 'tt-mistake-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'tiktok',
    template: `3 mistakes every {{target_customer}} makes:

❌ [Mistake 1]
❌ [Mistake 2]
❌ Not using {{unique_solution}}

The fix? {{key_benefit}}

{{business_name}} shows you how.

#mistakes #tips #learnontiktok`,
    psychologyTags: {
      primaryTrigger: 'fear',
      secondaryTriggers: ['education', 'value'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['value-driven', 'pain-driven'],
    averageScore: 78,
  },

  // LinkedIn - Poll / Community-driven
  {
    id: 'li-poll-01',
    structure: 'engagement',
    contentType: 'community',
    platform: 'linkedin',
    template: `Quick poll for {{target_customer}}:

What's your biggest challenge right now?

A) [Option 1 - relates to pain point]
B) [Option 2]
C) [Option 3]
D) Other (comment below!)

At {{business_name}}, we help with ALL of these through {{unique_solution}}.

Vote and I'll share insights on the top answer!`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['participation', 'curiosity'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'pain-driven'],
    averageScore: 76,
  },

  // LinkedIn - Contrarian / Aspiration-driven
  {
    id: 'li-contrarian-01',
    structure: 'authority',
    contentType: 'educational',
    platform: 'linkedin',
    template: `I'm going to say something unpopular:

{{target_customer}} don't need [commonly believed solution].

What they actually need: {{unique_solution}}.

Here's why:

{{transformation}} doesn't come from doing more.

It comes from doing {{differentiator}}.

That's why {{business_name}} focuses on {{key_benefit}}.

Agree? Disagree? Let's discuss.`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['authority', 'controversy'],
      urgencyLevel: 'low',
    },
    customerCategories: ['aspiration-driven', 'value-driven'],
    averageScore: 80,
  },

  // Facebook - Appreciation / Trust-seeking
  {
    id: 'fb-appreciation-01',
    structure: 'testimonial',
    contentType: 'community',
    platform: 'facebook',
    template: `We have to give a shoutout to our amazing clients!

Thanks to you, {{business_name}} has been able to help {{target_customer}} achieve {{transformation}}.

YOUR trust means everything to us.

{{unique_solution}} works because of people like you.

Tag someone who deserves appreciation today! 💙`,
    psychologyTags: {
      primaryTrigger: 'belonging',
      secondaryTriggers: ['gratitude', 'trust'],
      urgencyLevel: 'low',
    },
    customerCategories: ['community-driven', 'trust-seeking'],
    averageScore: 77,
  },

  // Instagram - Mini case study / Trust-seeking
  {
    id: 'ig-casestudy-01',
    structure: 'testimonial',
    contentType: 'promotional',
    platform: 'instagram',
    template: `CASE STUDY: How [Client Type] achieved {{transformation}}

📍 Starting Point: [Pain state]
🎯 Goal: {{key_benefit}}
🔧 Solution: {{unique_solution}}
📈 Result: {{transformation}}

Timeline: [Realistic timeframe]

{{business_name}} makes this happen for {{target_customer}}.

DM "CASE STUDY" for the full breakdown!

#casestudy #results #success`,
    psychologyTags: {
      primaryTrigger: 'proof',
      secondaryTriggers: ['trust', 'aspiration'],
      urgencyLevel: 'medium',
    },
    customerCategories: ['trust-seeking', 'value-driven'],
    averageScore: 81,
  },

  // Twitter - Thread teaser / Educational
  {
    id: 'tw-teaser-01',
    structure: 'list',
    contentType: 'educational',
    platform: 'twitter',
    template: `I spent [time] studying what makes {{target_customer}} successful.

Here's what I found:

{{unique_solution}} → {{key_benefit}}

(A thread on {{transformation}})

🧵👇`,
    psychologyTags: {
      primaryTrigger: 'curiosity',
      secondaryTriggers: ['authority', 'value'],
      urgencyLevel: 'low',
    },
    customerCategories: ['value-driven', 'trust-seeking'],
    averageScore: 77,
  },
];

// ============================================================================
// TEMPLATE STATISTICS (Auto-generated)
// ============================================================================

export const TEMPLATE_STATS = {
  total: UNIVERSAL_TEMPLATES.length,
  byPlatform: {
    linkedin: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'linkedin').length,
    facebook: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'facebook').length,
    instagram: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'instagram').length,
    twitter: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'twitter').length,
    tiktok: UNIVERSAL_TEMPLATES.filter(t => t.platform === 'tiktok').length,
  },
  byCategory: {
    'pain-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('pain-driven')).length,
    'aspiration-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('aspiration-driven')).length,
    'trust-seeking': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('trust-seeking')).length,
    'convenience-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('convenience-driven')).length,
    'value-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('value-driven')).length,
    'community-driven': UNIVERSAL_TEMPLATES.filter(t => t.customerCategories.includes('community-driven')).length,
  },
  averageScore: Math.round(
    UNIVERSAL_TEMPLATES.reduce((sum, t) => sum + (t.averageScore || 75), 0) / UNIVERSAL_TEMPLATES.length
  ),
};

export default UNIVERSAL_TEMPLATES;
