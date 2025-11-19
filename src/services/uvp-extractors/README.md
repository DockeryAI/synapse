# UVP Extractors

AI-powered services for extracting Unique Value Proposition (UVP) components from website content.

## Customer Extractor Service

### Overview

The Customer Extractor Service analyzes website content to identify target customer profiles using evidence-based extraction. It uses Claude AI to find explicit mentions of who the business serves, without making assumptions.

### Key Features

- **Evidence-Only Extraction**: Only extracts customer profiles when clear evidence exists
- **Multi-Source Analysis**: Analyzes testimonials, case studies, and website content
- **Confidence Scoring**: Provides detailed confidence metrics based on evidence quality
- **Defensive Programming**: Handles missing data gracefully, never assumes
- **Quote Attribution**: Every profile includes supporting evidence quotes

### Usage

```typescript
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';

const result = await extractTargetCustomer(
  websiteContent: string[],    // Website pages/sections
  testimonials: string[],       // Customer testimonials
  caseStudies: string[],        // Case studies
  businessName: string          // Business being analyzed
);
```

### Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `websiteContent` | `string[]` | Array of website content sections (about page, services page, etc.) |
| `testimonials` | `string[]` | Customer testimonials - highest value for extraction |
| `caseStudies` | `string[]` | Case studies with customer details |
| `businessName` | `string` | Name of the business being analyzed |

### Output Structure

```typescript
interface CustomerExtractionResult {
  profiles: Partial<CustomerProfile>[];  // Extracted customer profiles
  confidence: ConfidenceScore;           // Overall extraction confidence
  sources: DataSource[];                 // Where data came from
  evidenceQuotes: string[];              // All supporting quotes
}

interface CustomerProfile {
  id: string;
  statement: string;        // "Marketing Directors at B2B SaaS companies"
  industry?: string;        // "B2B SaaS / Technology"
  companySize?: string;     // "20-100 employees"
  role?: string;           // "Marketing Director / VP Marketing"
  confidence: ConfidenceScore;
  sources: DataSource[];
  evidenceQuotes: string[];
  isManualInput: boolean;
}
```

### Examples

#### Example 1: Basic Extraction

```typescript
const result = await extractTargetCustomer(
  ['About page content...'],
  [
    "As a marketing director at a SaaS company, this saved me 15 hours/week",
    "I'm responsible for analytics at a 50-person software business"
  ],
  [],
  'Acme Analytics'
);

// Result contains:
// - profiles: [{ statement: "Marketing Directors at B2B SaaS...", ... }]
// - confidence: { overall: 85, ... }
// - evidenceQuotes: ["As a marketing director...", ...]
```

#### Example 2: Multiple Customer Segments

```typescript
const result = await extractTargetCustomer(
  ['Enterprise software platform'],
  [
    "As a small business owner...",
    "As CTO of a Fortune 500..."
  ],
  [],
  'BizSoft'
);

// May extract 2 profiles:
// 1. Small business owners (1-20 employees)
// 2. Enterprise IT leaders (1000+ employees)
```

#### Example 3: No Clear Evidence

```typescript
const result = await extractTargetCustomer(
  ['We build great software for everyone!'],
  [],
  [],
  'GenericCo'
);

// Returns:
// - profiles: []
// - confidence: { overall: 0, reasoning: "No clear customer evidence..." }
```

### Confidence Scoring

Confidence is calculated based on:

1. **Evidence Quality** (40%): Number and quality of supporting quotes
2. **Detail Completeness** (30%): Industry, size, role specified
3. **Claude Assessment** (30%): AI model's confidence level

| Score Range | Interpretation | Action |
|-------------|---------------|---------|
| 80-100% | High confidence | Use as-is |
| 60-79% | Medium confidence | Review recommended |
| 40-59% | Low confidence | Manual review required |
| 0-39% | Very low | Needs manual input |

### What Gets Extracted

#### ✅ Will Extract (Evidence Present)

- "As a **marketing director** at a **SaaS company**..."
- "I run a **small bakery** with **5 employees**..."
- "**CEO** of a **Series A startup** in **healthcare**..."
- "We're a **B2B company** serving **mid-market** customers"

#### ❌ Won't Extract (No Evidence)

- "Perfect for businesses of all sizes" (too generic)
- "Anyone can use our product" (no specific customer)
- "Designed for professionals" (vague, no details)
- No testimonials or case studies provided

### Evidence Requirements

For a profile to be extracted:

1. **Minimum 2 evidence quotes** with explicit customer mentions
2. **At least one detail** (role, industry, OR company size)
3. **Medium or high confidence** from Claude AI
4. **Quotes must be actual text**, not paraphrased

### Error Handling

The service handles errors gracefully:

```typescript
// No Supabase config
if (!SUPABASE_URL) {
  return { profiles: [], confidence: { overall: 0, ... }, ... };
}

// API errors
try {
  const result = await analyzeWithClaude(...);
} catch (error) {
  console.error('[CustomerExtractor] Failed:', error);
  return createEmptyResult();
}

// Missing evidence
if (profile.evidenceQuotes.length === 0) {
  console.warn('[CustomerExtractor] Skipping profile without evidence');
  return; // Filter out
}
```

### Best Practices

#### 1. Provide Rich Context

```typescript
// ✅ Good
const result = await extractTargetCustomer(
  ['About page', 'Services page', 'Who we serve page'],
  testimonials, // 5-10 testimonials
  caseStudies,  // 2-3 case studies
  'BusinessName'
);

// ❌ Poor
const result = await extractTargetCustomer(
  ['Homepage'],
  [],  // No testimonials
  [],  // No case studies
  'BusinessName'
);
```

#### 2. Check Confidence Before Using

```typescript
const result = await extractTargetCustomer(...);

if (result.confidence.overall < 60) {
  console.warn('Low confidence - needs manual review');
  // Show UI for manual input
}
```

#### 3. Show Evidence to Users

```typescript
result.profiles.forEach(profile => {
  console.log(`Customer: ${profile.statement}`);
  console.log('Based on:');
  profile.evidenceQuotes.forEach(quote => {
    console.log(`  - "${quote}"`);
  });
});
```

#### 4. Handle Empty Results

```typescript
if (result.profiles.length === 0) {
  // Show manual input form
  return <ManualCustomerInput reason={result.confidence.reasoning} />;
}
```

### Claude Prompt Strategy

The service uses a carefully designed prompt that:

1. **Emphasizes Evidence**: "ONLY extract when you find CLEAR EVIDENCE"
2. **Prohibits Assumptions**: "NEVER infer or assume without supporting quotes"
3. **Requires Quotes**: "Every profile MUST have at least 2-3 evidence quotes"
4. **Prefers Empty Results**: "Empty profiles array is BETTER than guessing"
5. **Groups Patterns**: "If you see 5 testimonials from marketing directors, that's ONE profile"

### Performance

- **Cold start**: ~2-3 seconds (Claude API call)
- **Warm cache**: Same (no caching yet)
- **Cost**: ~$0.01-0.03 per extraction (Claude Sonnet)
- **Token usage**: ~1000-3000 tokens typical

### Testing

Run tests:
```bash
npm run test -- src/__tests__/services/customer-extractor.test.ts
```

Test coverage:
- ✅ Extract profiles with evidence
- ✅ Return empty when no evidence
- ✅ Handle multiple segments
- ✅ Filter out low-evidence profiles
- ✅ Handle API errors gracefully
- ✅ Parse markdown-wrapped JSON
- ✅ Calculate confidence correctly
- ✅ Deduplicate evidence quotes

### Limitations

1. **Requires English Content**: Claude works best with English text
2. **Needs Explicit Mentions**: Cannot infer from product features alone
3. **Quality Depends on Input**: Garbage in, garbage out
4. **Single Model**: No cross-model validation (yet)
5. **No Real-Time Updates**: Must re-run for new content

### Future Enhancements

- [ ] Multi-language support
- [ ] Cross-model validation (Haiku → Sonnet → Opus)
- [ ] Confidence calibration from historical data
- [ ] Incremental extraction (add new testimonials without re-analyzing)
- [ ] Customer segment clustering
- [ ] Integration with buyer persona database

### Related Services

- `buyer-intelligence-extractor.service.ts` - Full buyer persona extraction
- `product-scanner.service.ts` - Product/service detection
- `eq-calculator.service.ts` - Emotional quotient analysis

### Support

For issues or questions:
1. Check the test file for usage examples
2. Review the example file for common patterns
3. Read the type definitions in `uvp-flow.types.ts`
4. Search for similar patterns in `buyer-intelligence-extractor.service.ts`
