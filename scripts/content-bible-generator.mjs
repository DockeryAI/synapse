#!/usr/bin/env node

/**
 * Content Writing Bible Generator
 * Queries top 10 LLMs via OpenRouter for comprehensive content writing best practices
 * Synthesizes all responses into one master document
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ OpenRouter API key not found in .env file');
  process.exit(1);
}

// Top 10 LLMs for comprehensive research (using OpenRouter model identifiers)
const TOP_LLMS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  { id: 'cohere/command-r-plus', name: 'Cohere Command R+' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
  { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Perplexity Sonar' }
];

// Fallback models if any fail
const FALLBACK_MODELS = [
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' }
];

// The comprehensive prompt for content writing research
const RESEARCH_PROMPT = `You are tasked with creating THE DEFINITIVE GUIDE to content writing that drives real business results. This is not a surface-level overview - I need you to go DEEP and be EXHAUSTIVE in your research and response.

YOUR MISSION: Create a PhD-level comprehensive guide covering:

1. HOOKS & ATTENTION CAPTURE
- The psychology of scroll-stopping hooks
- First 3 seconds rule for video
- Opening lines that force readers to continue
- Counter-hooks and pattern interrupts
- Neurological triggers that bypass rational thought
- Platform-specific hook strategies
- A/B tested hook formulas with conversion rates

2. CONTENT FRAMEWORKS THAT CONVERT
- AIDA, PAS, BAB, FAB, and advanced frameworks
- Story arc structures for multi-touch campaigns
- Psychological sequencing for maximum impact
- Trust ladders and credibility building
- The hero's journey in marketing
- Before-After-Bridge techniques
- Problem-Agitate-Solve mastery
- Feature-Advantage-Benefit chains

3. PLATFORM-SPECIFIC MASTERY
LinkedIn:
- Algorithm preferences and timing
- Professional tone calibration
- B2B vs B2C approach differences
- Carousel strategies
- Native video optimization
- Connection request messaging

Instagram:
- Reels algorithm hacks
- Story engagement tactics
- Caption strategies
- Hashtag research methods
- Shopping tags optimization
- IGTV vs Feed vs Stories

TikTok:
- Trend jumping strategies
- Sound selection psychology
- Duet and stitch tactics
- FYP optimization
- Viral coefficient factors

Facebook:
- Group engagement strategies
- Live video conversion tactics
- Event promotion frameworks
- Marketplace integration

Twitter/X:
- Thread construction
- Quote tweet strategies
- Community building
- Real-time marketing

YouTube:
- Thumbnail psychology
- Title optimization
- Description strategies
- End screen optimization
- Shorts vs long-form

Email:
- Subject line formulas
- Preview text optimization
- Segmentation strategies
- Automation sequences
- Re-engagement campaigns

Blogs:
- SEO-optimized writing
- Snippet capture techniques
- Internal linking strategies
- Content clusters
- Pillar page construction

4. PSYCHOLOGICAL TRIGGERS & PERSUASION
- Robert Cialdini's 7 principles in content
- Cognitive biases to leverage
- Emotional triggers by industry
- Loss aversion techniques
- Social proof integration
- Authority building methods
- Scarcity and urgency tactics
- Reciprocity in content
- Commitment and consistency tricks
- Liking and relatability factors

5. CALLS-TO-ACTION THAT CONVERT
- Micro-commitments strategy
- CTA placement science
- Action verb psychology
- Color and design impact
- Multiple CTA strategies
- Soft CTAs vs Hard CTAs
- Platform-specific CTA formats
- CTA A/B testing frameworks

6. STORYTELLING FOR SALES
- Customer transformation narratives
- Case study structures
- Testimonial integration
- Behind-the-scenes content
- Founder stories that sell
- Employee spotlights
- User-generated content campaigns
- Documentary-style content

7. DATA-DRIVEN CONTENT STRATEGIES
- Analytics interpretation
- KPI selection by goal
- Attribution modeling
- Conversion tracking
- Engagement metrics that matter
- Vanity metrics to ignore
- ROI calculation methods
- Testing methodologies

8. ADVANCED TECHNIQUES
- Neuromarketing applications
- Color psychology in content
- Typography impact on conversion
- White space utilization
- F-pattern and Z-pattern reading
- Mobile-first content design
- Voice search optimization
- AI-assisted content creation
- Personalization at scale
- Dynamic content strategies

9. INDUSTRY-SPECIFIC STRATEGIES
- B2B enterprise content
- E-commerce product content
- SaaS onboarding content
- Local business content
- Healthcare content compliance
- Financial services trust-building
- Real estate listing optimization
- Restaurant and food content
- Fitness and wellness motivation
- Technology and innovation content

10. CONTENT CALENDARS & CAMPAIGNS
- Strategic planning frameworks
- Seasonal content mapping
- Product launch sequences
- Multi-touch campaign design
- Content pillar development
- Evergreen vs trending balance
- Repurposing strategies
- Cross-platform coordination
- Campaign measurement

11. UNCONVENTIONAL TACTICS THAT WORK
- Controversy without cancellation
- Polarization strategies
- Humor in B2B
- Meme marketing for serious brands
- User-generated content hacks
- Community building secrets
- Influencer collaboration frameworks
- Employee advocacy programs
- Customer success stories
- Competitive differentiation

12. REVENUE ATTRIBUTION
- Content to conversion tracking
- Multi-touch attribution models
- Customer journey mapping
- Content scoring systems
- Lead qualification through content
- Sales enablement content
- Bottom-funnel optimization
- Retention content strategies

Provide SPECIFIC EXAMPLES, TEMPLATES, and FORMULAS throughout. Include real conversion rate improvements, case studies, and proven results. Don't just tell me what works - show me WHY it works with psychological and neurological explanations.

Go as deep as possible. Use as many tokens as needed. This should be the kind of document that someone could read and immediately improve their content performance by 10x. Include contrarian takes, lesser-known tactics, and cutting-edge strategies that aren't common knowledge.

Remember: This is about content that drives TANGIBLE BUSINESS RESULTS - leads, sales, revenue, not just engagement. Every strategy should tie back to ROI.`;

// Progress tracking
class ProgressTracker {
  constructor(total) {
    this.total = total;
    this.completed = 0;
    this.failed = 0;
    this.inProgress = new Set();
    this.responses = new Map();
    this.startTime = Date.now();
  }

  start(model) {
    this.inProgress.add(model);
    this.updateDisplay();
  }

  complete(model, response) {
    this.inProgress.delete(model);
    this.completed++;
    this.responses.set(model, response);
    this.updateDisplay();
  }

  fail(model, error) {
    this.inProgress.delete(model);
    this.failed++;
    console.error(`\n❌ ${model} failed: ${error.message}`);
    this.updateDisplay();
  }

  updateDisplay() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    const progress = `⏱️  ${minutes}m ${seconds}s | ✅ ${this.completed}/${this.total} | ❌ ${this.failed} | 🔄 ${this.inProgress.size} in progress`;
    process.stdout.write(progress);
  }

  isComplete() {
    return this.completed + this.failed === this.total;
  }
}

// Make API request to OpenRouter
async function queryLLM(model, prompt, retryCount = 0) {
  const maxRetries = 3;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 32000, // Maximum tokens for comprehensive response
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://synapse-smb.com',
        'X-Title': 'Content Bible Generator',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 300000 // 5 minute timeout per request
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            throw new Error(response.error.message || 'API Error');
          }

          if (response.choices && response.choices[0] && response.choices[0].message) {
            resolve({
              model: model.name,
              content: response.choices[0].message.content,
              tokens: response.usage ? response.usage.total_tokens : 'unknown'
            });
          } else {
            throw new Error('Invalid response structure');
          }
        } catch (error) {
          if (retryCount < maxRetries) {
            console.log(`\n⚠️  Retrying ${model.name} (attempt ${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => {
              queryLLM(model, prompt, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 5000 * (retryCount + 1)); // Exponential backoff
          } else {
            reject(new Error(`Failed after ${maxRetries} retries: ${error.message}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      if (retryCount < maxRetries) {
        console.log(`\n⚠️  Network error for ${model.name}, retrying...`);
        setTimeout(() => {
          queryLLM(model, prompt, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, 5000 * (retryCount + 1));
      } else {
        reject(error);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retryCount < maxRetries) {
        console.log(`\n⚠️  Timeout for ${model.name}, retrying...`);
        setTimeout(() => {
          queryLLM(model, prompt, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, 5000 * (retryCount + 1));
      } else {
        reject(new Error('Request timeout'));
      }
    });

    req.write(postData);
    req.end();
  });
}

// Process all LLMs with fallbacks
async function processAllLLMs(models, fallbacks, tracker) {
  const promises = models.map(async (model) => {
    try {
      tracker.start(model.name);
      const response = await queryLLM(model, RESEARCH_PROMPT);
      tracker.complete(model.name, response);
      return response;
    } catch (error) {
      tracker.fail(model.name, error);

      // Try a fallback model if main model fails
      if (fallbacks.length > 0 && tracker.completed < 10) {
        const fallback = fallbacks.shift();
        console.log(`\n🔄 Trying fallback: ${fallback.name}`);
        try {
          tracker.start(fallback.name);
          const response = await queryLLM(fallback, RESEARCH_PROMPT);
          tracker.complete(fallback.name, response);
          return response;
        } catch (fallbackError) {
          tracker.fail(fallback.name, fallbackError);
        }
      }

      return null;
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);
}

// Synthesize all responses into master document
async function synthesizeResponses(responses) {
  console.log('\n\n📚 Synthesizing responses from all LLMs...\n');

  const synthesisPrompt = `You are tasked with synthesizing ${responses.length} comprehensive responses about content writing best practices into one master document.

Here are the responses from different LLMs:

${responses.map((r, i) => `
===== RESPONSE ${i + 1} FROM ${r.model} (${r.tokens} tokens) =====
${r.content}
===== END RESPONSE ${i + 1} =====
`).join('\n')}

Your task:
1. Combine ALL unique insights, strategies, and tactics from all responses
2. Remove exact duplicates but keep variations and different perspectives on the same topic
3. Organize the content into a logical, comprehensive structure
4. Ensure nothing valuable is lost - every unique tip, strategy, framework, or insight should be included
5. Add clear section headers and subheaders for easy navigation
6. Include ALL specific examples, templates, formulas, and case studies mentioned
7. Preserve the depth and detail from each response
8. Create a table of contents at the beginning
9. Add an executive summary of the most impactful strategies
10. Conclude with a "Quick Win Implementation Checklist" of immediately actionable items

The final document should be the ultimate, comprehensive guide to content writing that drives business results. It should be structured, detailed, and immediately actionable.

Format the output in clean Markdown with proper headers, lists, and emphasis where appropriate.`;

  // Use Claude 3.5 Sonnet for synthesis as it's best at this task
  const synthesisModel = { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Synthesis)' };

  try {
    const synthesis = await queryLLM(synthesisModel, synthesisPrompt);
    return synthesis.content;
  } catch (error) {
    console.error('❌ Synthesis failed, returning concatenated responses');
    // Fallback: just concatenate all responses with headers
    return responses.map(r => `
# Response from ${r.model}
${r.content}
`).join('\n\n---\n\n');
  }
}

// Main execution
async function main() {
  console.log('🚀 Content Writing Bible Generator Starting...\n');
  console.log(`📊 Querying ${TOP_LLMS.length} top LLMs for comprehensive content writing research`);
  console.log('⏳ This will take several minutes as each LLM does deep research...\n');
  console.log('Models to query:');
  TOP_LLMS.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model.name}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  const tracker = new ProgressTracker(TOP_LLMS.length);

  // Query all LLMs in parallel with progress tracking
  const responses = await processAllLLMs(TOP_LLMS, [...FALLBACK_MODELS], tracker);

  console.log(`\n\n✅ Received ${responses.length} complete responses\n`);

  if (responses.length < 10) {
    console.log(`⚠️  Warning: Only received ${responses.length} out of 10 target responses`);
    console.log('Continuing with available responses...\n');
  }

  // Synthesize all responses
  const finalDocument = await synthesizeResponses(responses);

  // Generate metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalModelsQueried: tracker.completed + tracker.failed,
    successfulResponses: tracker.completed,
    failedResponses: tracker.failed,
    models: responses.map(r => r.model),
    totalTokensUsed: responses.reduce((sum, r) => {
      const tokens = r.tokens === 'unknown' ? 0 : parseInt(r.tokens);
      return sum + tokens;
    }, 0),
    generationTime: Math.floor((Date.now() - tracker.startTime) / 1000)
  };

  // Create final document with metadata
  const fullDocument = `# The Content Writing Bible
*The Definitive Guide to Creating Content That Drives Real Business Results*

---

## Document Metadata
- **Generated:** ${metadata.generatedAt}
- **Models Consulted:** ${metadata.successfulResponses}
- **Total Research Tokens:** ${metadata.totalTokensUsed.toLocaleString()}
- **Generation Time:** ${Math.floor(metadata.generationTime / 60)}m ${metadata.generationTime % 60}s
- **Contributing Models:** ${metadata.models.join(', ')}

---

${finalDocument}

---

## Document Generation Details

This comprehensive guide was generated by querying ${metadata.successfulResponses} leading language models for their deepest insights on content writing best practices. Each model conducted extensive research to provide PhD-level expertise on creating content that drives tangible business results.

### Contributing Models:
${metadata.models.map(m => `- ${m}`).join('\n')}

### Generation Statistics:
- Total tokens processed: ${metadata.totalTokensUsed.toLocaleString()}
- Average tokens per model: ${Math.floor(metadata.totalTokensUsed / metadata.successfulResponses).toLocaleString()}
- Research depth: Maximum (32,000 tokens per model)
- Synthesis method: Cross-model integration with duplicate removal

---

*End of Document*
`;

  // Save to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `content-writing-bible-${timestamp}.md`;
  const filepath = path.join(__dirname, '..', filename);

  await fs.writeFile(filepath, fullDocument, 'utf-8');

  // Calculate document statistics
  const wordCount = fullDocument.split(/\s+/).length;
  const lineCount = fullDocument.split('\n').length;
  const characterCount = fullDocument.length;

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ CONTENT WRITING BIBLE GENERATION COMPLETE!\n');
  console.log('📊 Document Statistics:');
  console.log(`  • Words: ${wordCount.toLocaleString()}`);
  console.log(`  • Lines: ${lineCount.toLocaleString()}`);
  console.log(`  • Characters: ${characterCount.toLocaleString()}`);
  console.log(`  • Models consulted: ${metadata.successfulResponses}`);
  console.log(`  • Total tokens used: ${metadata.totalTokensUsed.toLocaleString()}`);
  console.log(`  • Generation time: ${Math.floor(metadata.generationTime / 60)}m ${metadata.generationTime % 60}s`);
  console.log('\n📄 File saved to:');
  console.log(`  ${filepath}`);
  console.log('\n🎯 Summary:');
  console.log('  The Content Writing Bible has been successfully generated with comprehensive');
  console.log('  insights from multiple leading AI models. This document contains:');
  console.log('  • Psychological triggers and persuasion techniques');
  console.log('  • Platform-specific content strategies');
  console.log('  • Proven frameworks and formulas');
  console.log('  • Revenue-driving CTAs and conversion tactics');
  console.log('  • Industry-specific approaches');
  console.log('  • Advanced neuromarketing applications');
  console.log('  • Data-driven optimization strategies');
  console.log('  • And much more...\n');
  console.log('💡 Next steps: Open the file to access your comprehensive guide to content mastery.');
  console.log('\n' + '='.repeat(80) + '\n');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n\n❌ Fatal error:', error);
  process.exit(1);
});

// Execute
main().catch(console.error);