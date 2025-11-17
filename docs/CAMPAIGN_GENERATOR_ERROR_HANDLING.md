# Campaign Generator Error Handling - Integration Guide

**Status:** To be applied when CampaignGenerator.ts is merged from feature/campaign-generation-pipeline
**Priority:** P1 - HIGH
**Estimated Time:** 2 hours

---

## Overview

This document outlines the error handling that needs to be added to `CampaignGenerator.ts` once it's merged to main. The Campaign Generator is a critical service that integrates with multiple AI services and must handle failures gracefully.

---

## Required Changes

### 1. Add Error Handler Import

```typescript
import { ErrorHandlerService, RetryProgress } from '../errors/error-handler.service';
```

### 2. Update generateCampaign Method

**Add retry progress callback parameter:**

```typescript
async generateCampaign(
  input: CampaignGenerationInput,
  onProgress?: (progress: GenerationProgress) => void,
  onRetry?: (retry: RetryProgress) => void
): Promise<GeneratedCampaign>
```

**Wrap AI content generation with retry:**

Around line ~104 where `contentGenerator.generate()` is called:

```typescript
const generatedContent = await ErrorHandlerService.executeWithRetry(
  () => this.contentGenerator.generate(insights, businessProfile, options),
  {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
  },
  onRetry,
  [
    // Fallback strategy: generate with simpler prompt
    {
      name: 'simplified_prompt',
      description: 'Retry with simplified content generation',
      execute: async () => {
        const simpleOptions = { ...options, maxContent: 1 };
        return this.contentGenerator.generate(insights.slice(0, 1), businessProfile, simpleOptions);
      }
    }
  ]
);
```

### 3. Update generatePost Method

**Add retry callback:**

```typescript
async generatePost(
  input: PostGenerationInput,
  onRetry?: (retry: RetryProgress) => void
): Promise<GeneratedPost>
```

**Wrap content generation:**

```typescript
const generatedContent = await ErrorHandlerService.executeWithRetry(
  () => this.contentGenerator.generate(insights, businessProfile, options),
  { maxAttempts: 3 },
  onRetry
);
```

### 4. Add Bannerbear Error Handling

**Wrap visual generation with retry:**

In `generateVisualsForPost()` method around line ~490:

```typescript
private async generateVisualsForPost(post: GeneratedPost): Promise<PostVisual[]> {
  try {
    const visual = await ErrorHandlerService.executeWithRetry(
      () => bannerbearService.generateImage({
        template: this.selectBannerbearTemplate(post.platform, post.type),
        modifications: {
          headline: post.content.headline || '',
          body: post.content.body.substring(0, 200),
          cta: post.content.callToAction || '',
        },
      }),
      {
        maxAttempts: 2, // Fewer attempts for visuals
        initialDelayMs: 1000,
      },
      undefined,
      [
        // Fallback: Return empty visuals array
        {
          name: 'no_visuals',
          description: 'Continue without visuals',
          execute: async () => ({ image_url: null, uid: null, template: null })
        }
      ]
    );

    if (visual && visual.image_url) {
      return [
        {
          id: visual.uid,
          url: visual.image_url,
          type: 'image',
          bannerbearTemplateId: visual.template,
          bannerbearImageId: visual.uid,
          altText: post.content.headline || 'Generated visual',
        },
      ];
    }

    return [];
  } catch (error) {
    ErrorHandlerService.logError(error, { postId: post.id, platform: post.platform });
    return []; // Continue without visuals
  }
}
```

### 5. Add Partial Results Saving

**Update generateCampaignPosts to save partial results:**

```typescript
private async generateCampaignPosts(...): Promise<GeneratedPost[]> {
  const posts: GeneratedPost[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // ... existing code ...

      const generatedContent = await ErrorHandlerService.executeWithRetry(
        () => this.contentGenerator.generate(...),
        { maxAttempts: 2 }, // Fewer attempts per post
        undefined,
        [
          // Fallback: Use template-based content
          {
            name: 'template_fallback',
            description: 'Use template-based content generation',
            execute: async () => this.generateFromTemplate(postType, context)
          }
        ]
      );

      posts.push(post);

      // Save partial progress
      if (posts.length % 3 === 0) {
        await this.savePartialResults(posts, sessionId);
      }

    } catch (error) {
      console.error(`[CampaignGenerator] Failed to generate post ${i + 1}:`, error);
      ErrorHandlerService.logError(error, {
        postIndex: i,
        postType,
        sessionId
      });
      errors.push(error);

      // Continue with next post instead of failing entire campaign
    }
  }

  // If we have some posts, return them even if not all succeeded
  if (posts.length > 0) {
    console.log(`[CampaignGenerator] Generated ${posts.length}/${count} posts successfully`);
    return posts;
  }

  // If no posts succeeded, throw aggregated error
  throw new Error(`Failed to generate any posts. Errors: ${errors.length}`);
}
```

### 6. Add Template-Based Fallback

**Create fallback content generation method:**

```typescript
private async generateFromTemplate(
  postType: PostType,
  context: BusinessContext
): Promise<SynapseContent> {
  // Generate basic content using templates without AI
  const templates = {
    customer_success: {
      body: `${context.businessData.businessName} helps customers succeed. Learn how we can help you achieve your goals.`,
      hashtags: ['#CustomerSuccess', '#BusinessGrowth'],
    },
    service_spotlight: {
      body: `Discover ${context.businessData.businessName}'s services. We provide quality solutions for ${context.businessData.primaryCustomer || 'businesses like yours'}.`,
      hashtags: ['#Services', '#Professional'],
    },
    // Add templates for other post types...
  };

  const template = templates[postType] || templates.service_spotlight;

  return {
    id: `template-${Date.now()}`,
    format: 'hook-post',
    insight: {} as BreakthroughInsight,
    platformContent: {
      [context.platform || 'linkedin']: {
        body: template.body,
        hashtags: template.hashtags,
      }
    },
    metadata: {
      impactScore: 0.5,
      psychologyTriggers: [],
      tone: 'professional',
    }
  };
}
```

### 7. Add User-Facing Error Messages

**Update error handling to provide actionable messages:**

```typescript
private getActionableErrorMessage(error: unknown, context: string): string {
  const appError = ErrorHandlerService.categorizeError(error);

  const messages = {
    network: `Network issue while ${context}. Retrying automatically...`,
    api_limit: `AI service is busy. Retrying in a moment...`,
    timeout: `${context} is taking longer than expected. Retrying...`,
    server_error: `Temporary server issue. Retrying automatically...`,
    authentication: `Authentication failed. Please check your API keys in settings.`,
    validation: `Invalid data for ${context}. Please check your inputs.`,
    unknown: `An unexpected error occurred while ${context}. Retrying...`,
  };

  return messages[appError.category] || messages.unknown;
}
```

---

## Testing Requirements

After applying these changes, test the following scenarios:

### 1. Network Failure Recovery
- [ ] Disconnect network during generation
- [ ] Verify retry attempts occur
- [ ] Verify fallback content is used
- [ ] Verify user sees retry progress

### 2. API Rate Limit Handling
- [ ] Trigger rate limit (make many rapid requests)
- [ ] Verify exponential backoff works
- [ ] Verify generation completes after rate limit clears

### 3. Partial Failure Handling
- [ ] Cause failure on post #3 of 7
- [ ] Verify first 2 posts are saved
- [ ] Verify remaining posts continue to generate
- [ ] Verify user gets partial campaign

### 4. Complete Failure Graceful Degradation
- [ ] Cause all generation attempts to fail
- [ ] Verify template-based fallback is used
- [ ] Verify user receives actionable error message
- [ ] Verify no unhandled promise rejections

---

## Integration Checklist

When CampaignGenerator.ts is merged:

- [ ] Apply all changes from sections 1-7 above
- [ ] Run TypeScript compiler to verify no errors
- [ ] Run `npm run build` to verify build succeeds
- [ ] Test error scenarios listed above
- [ ] Update GenerationProgress component to show retry state
- [ ] Add retry progress to OnboardingPageV5
- [ ] Document any API key requirements
- [ ] Commit changes with descriptive message

---

## Success Criteria

✅ **Complete when:**
1. All AI generation calls have retry logic
2. Bannerbear calls have retry with fallback
3. Partial results are saved during generation
4. Template-based fallback works
5. User sees retry progress
6. No unhandled errors in console
7. All tests pass

---

**Next Steps:** Merge feature/campaign-generation-pipeline to main, then apply this error handling.
