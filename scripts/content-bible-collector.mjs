#!/usr/bin/env node

/**
 * Content Writing Bible Collector - JUST COLLECTS RESPONSES
 * Queries top LLMs via OpenRouter and saves individual responses
 * NO SYNTHESIS - Roy will do that himself
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

// Top 10 LLMs for comprehensive research (CORRECT model identifiers)
const TOP_LLMS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' } // Using a working model
];

// Fallback models if any fail
const FALLBACK_MODELS = [
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  { id: 'mistralai/mistral-medium', name: 'Mistral Medium' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' },
  { id: 'openai/gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
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

  // Adjust token limits based on model capabilities
  let maxTokens = 32000; // Default for most models

  // GPT-4 models have smaller output limits
  if (model.id.includes('gpt-4')) {
    maxTokens = 8000; // GPT-4 safe limit
  } else if (model.id.includes('gpt-3.5')) {
    maxTokens = 4000; // GPT-3.5 safe limit
  } else if (model.id.includes('claude-3-haiku')) {
    maxTokens = 16000; // Haiku has smaller limit
  } else if (model.id.includes('gpt-4o-mini')) {
    maxTokens = 16000; // GPT-4o Mini limit
  }

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
      max_tokens: maxTokens, // Adjusted based on model
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

// Save individual LLM response to file
async function saveIndividualResponse(response, index) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const safeModelName = response.model.replace(/[\/\s]/g, '-');
  const filename = `${String(index).padStart(2, '0')}-${safeModelName}.md`;
  const filepath = path.join(__dirname, '..', 'content-writing-guide', 'LLM-raw-data', filename);

  // Create directory if it doesn't exist
  await fs.mkdir(path.join(__dirname, '..', 'content-writing-guide', 'LLM-raw-data'), { recursive: true });

  const content = `# Response from ${response.model}
Generated: ${new Date().toISOString()}
Tokens: ${response.tokens}

---

${response.content}`;

  await fs.writeFile(filepath, content, 'utf-8');
  console.log(`\n💾 Saved: ${filename}`);
  return filepath;
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

// Main execution
async function main() {
  console.log('🚀 Content Writing Bible COLLECTOR Starting...\n');
  console.log('📊 Roy will collect responses from LLMs, then do the synthesis himself\n');
  console.log(`📊 Querying ${TOP_LLMS.length} top LLMs for comprehensive content writing research`);
  console.log('⏳ This will take several minutes as each LLM does deep research...\n');
  console.log('✨ Individual responses will be saved to content-writing-guide/LLM-raw-data/\n');
  console.log('Models to query:');
  TOP_LLMS.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model.name}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  const tracker = new ProgressTracker(TOP_LLMS.length);

  // Query all LLMs in parallel with progress tracking
  const responses = await processAllLLMs(TOP_LLMS, [...FALLBACK_MODELS], tracker);

  console.log(`\n\n✅ Received ${responses.length} complete responses\n`);

  // SAVE INDIVIDUAL RESPONSES
  console.log('💾 Saving individual LLM responses...\n');
  const savedFiles = [];
  for (let i = 0; i < responses.length; i++) {
    const filepath = await saveIndividualResponse(responses[i], i + 1);
    savedFiles.push(filepath);
  }

  if (responses.length < 10) {
    console.log(`\n⚠️  Warning: Only received ${responses.length} out of 10 target responses`);
    console.log('But Roy will work with what we got...\n');
  }

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

  // Save metadata
  const metadataPath = path.join(__dirname, '..', 'content-writing-guide', 'LLM-raw-data', '00-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ COLLECTION COMPLETE!\n');
  console.log('📊 Collection Statistics:');
  console.log(`  • Models consulted: ${metadata.successfulResponses}`);
  console.log(`  • Total tokens used: ${metadata.totalTokensUsed.toLocaleString()}`);
  console.log(`  • Generation time: ${Math.floor(metadata.generationTime / 60)}m ${metadata.generationTime % 60}s`);
  console.log('\n📄 Files saved:');
  console.log(`  • Individual responses: content-writing-guide/LLM-raw-data/ (${savedFiles.length} files)`);
  console.log(`  • Metadata: ${metadataPath}`);
  console.log('\n🎯 Next steps:');
  console.log('  Roy will now synthesize these responses into the ultimate content writing bible.');
  console.log('  No more API calls needed - Roy\'s got this.');
  console.log('\n' + '='.repeat(80) + '\n');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n\n❌ Fatal error:', error);
  process.exit(1);
});

// Execute
main().catch(console.error);