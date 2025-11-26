# Phase 2: Customer-First Title Generation - ATOMIC TASK LIST

**Status**: READY TO EXECUTE
**Dependencies**: Phase 1 COMPLETE ✅
**Estimated Duration**: 4-5 hours (optimized from 10)

---

## Overview

**Goal**: Generate titles that make CUSTOMERS want to click, not business owners

**Core Problem**: Current titles use keyword concatenation and target business owners
- ❌ "Social media + engagement + local bakery = Post about your bakery's social media engagement"
- ❌ "Product Quality Loved"
- ❌ "How to improve your bakery operations"

**Target Output**:
- ✅ "Why Your Weekend Croissants Taste Better Here"
- ✅ "Fresh Ingredients Drive Positive Reviews"
- ✅ "Skip the Line: Text Orders Ready in 5 Minutes"

---

## Task 2.1: Create CustomerTitleGenerator Service (60 min)

**File**: `/src/services/content/CustomerTitleGenerator.service.ts`

### What to Build:
```typescript
import type { DataPoint } from '@/types/connections.types';
import type { ContentFramework } from '@/services/synapse/generation/ContentFrameworkLibrary';

export interface CustomerTitleContext {
  dataPoints: DataPoint[];
  framework: ContentFramework;
  dataPattern: DataPattern;  // from FrameworkSelector
  industry?: string;
  platform?: 'social' | 'email' | 'blog';
}

export interface TitleFormula {
  name: string;
  pattern: string;  // e.g., "[Customer Desire] + [Unique Solution]"
  examples: string[];
  applicability: {
    dataPattern: string[];  // ['problem', 'desire', etc.]
    sentimentBias?: 'positive' | 'negative';
  };
}

class CustomerTitleGenerator {
  // Core method
  generateCustomerTitle(context: CustomerTitleContext): {
    title: string;
    formula: string;
    reasoning: string;
    confidence: number;
  }

  // Select best formula based on pattern
  private selectTitleFormula(dataPattern: DataPattern, framework: ContentFramework): TitleFormula

  // Industry-agnostic title formulas (from Content Writing Bible)
  private readonly TITLE_FORMULAS: TitleFormula[] = [
    // Problem-focused
    {
      name: 'problem-solution',
      pattern: '[Customer Problem] → [Specific Solution]',
      examples: ['Wait Times Frustrate Customers → Skip the Line with Text Orders'],
      applicability: { dataPattern: ['problem'], sentimentBias: 'negative' }
    },
    // Desire-focused
    {
      name: 'desire-benefit',
      pattern: '[Customer Desire] + [What Enables It]',
      examples: ['Fresh Ingredients Everyone Notices + Daily Local Sourcing'],
      applicability: { dataPattern: ['desire'], sentimentBias: 'positive' }
    },
    // Urgency-focused
    {
      name: 'urgency-opportunity',
      pattern: '[Time-Sensitive Benefit] + [Why Now]',
      examples: ['Weekend Brunch Without the Wait + New Reservation System'],
      applicability: { dataPattern: ['urgency'] }
    },
    // Transformation-focused
    {
      name: 'before-after',
      pattern: '[Before State] → [After State]',
      examples: ['Long Lines → In and Out in 5 Minutes'],
      applicability: { dataPattern: ['transformation'] }
    },
    // Comparison-focused
    {
      name: 'unique-difference',
      pattern: 'Why [Our Difference] Matters to You',
      examples: ['Why Our 24-Hour Dough Makes Better Pizza'],
      applicability: { dataPattern: ['comparison'] }
    }
  ];

  // Build guidance for AI title generation
  buildTitleGuidance(context: CustomerTitleContext): string

  // Validate title follows customer-first principles
  validateCustomerFocus(title: string): {
    isCustomerFocused: boolean;
    issues: string[];
    suggestions: string[];
  }
}

export const customerTitleGenerator = new CustomerTitleGenerator();
```

### Implementation Notes:
- Use FrameworkRouter for framework-specific guidance
- Formulas should work for ANY industry (test with restaurant, healthcare, SaaS)
- NO keyword concatenation - validate this in buildTitleGuidance
- Explicit customer focus reminders in guidance

### Tests to Create:
- `/src/__tests__/content-fix/customer-title-generator.test.ts`
- Test formula selection accuracy
- Test customer focus validation
- Test across 5+ industries

---

## Task 2.2: Create TitleQualityValidator Service (30 min)

**File**: `/src/services/content/TitleQualityValidator.service.ts`

### What to Build:
```typescript
export interface TitleQualityReport {
  score: number;  // 0-10
  passed: boolean;  // score >= 7
  issues: TitleIssue[];
  suggestions: string[];
}

export interface TitleIssue {
  type: 'keyword_concatenation' | 'business_focus' | 'generic' | 'no_benefit' | 'unclear_action';
  severity: 'critical' | 'warning';
  message: string;
  location?: string;  // where in title
}

class TitleQualityValidator {
  validateTitle(title: string, context?: { industry?: string; dataPattern?: string }): TitleQualityReport

  // Check for keyword concatenation
  private detectKeywordConcatenation(title: string): TitleIssue[]

  // Check for business owner focus (avoid "your bakery", "improve operations", etc.)
  private detectBusinessFocus(title: string): TitleIssue[]

  // Check for generic patterns ("Product Quality Loved", "Best Bakery Pattern")
  private detectGenericPatterns(title: string): TitleIssue[]

  // Check for customer benefit
  private detectCustomerBenefit(title: string): { hasBenefit: boolean; reasoning: string }

  // Check for clear action/outcome
  private detectClearAction(title: string): { hasAction: boolean; reasoning: string }

  // Known bad patterns to avoid
  private readonly BAD_PATTERNS = [
    /\w+\s*\+\s*\w+/,  // word + word
    /your (business|bakery|restaurant|shop|store)/i,
    /improve.*(operations|efficiency|process)/i,
    /(product|service) quality/i,
    /best.*pattern/i,
    /loved.*pattern/i
  ];

  // Business owner trigger words
  private readonly BUSINESS_TRIGGERS = [
    'operations', 'efficiency', 'profit', 'revenue', 'ROI',
    'optimize', 'streamline', 'improve your', 'manage your'
  ];

  // Customer benefit indicators (positive signals)
  private readonly CUSTOMER_BENEFITS = [
    'you get', 'you save', 'you enjoy', 'you notice',
    'skip the', 'no more', 'faster', 'easier', 'better'
  ];
}

export const titleQualityValidator = new TitleQualityValidator();
```

### Tests to Create:
- `/src/__tests__/content-fix/title-quality-validator.test.ts`
- Test bad pattern detection
- Test customer vs business focus detection
- Test edge cases

---

## Task 2.3: Integrate CustomerTitleGenerator with SynapseGenerator (45 min)

**File to Modify**: `/src/services/synapse/SynapseGenerator.ts`

### Changes:

1. **Import services**:
```typescript
import { customerTitleGenerator } from '@/services/content/CustomerTitleGenerator.service';
import { titleQualityValidator } from '@/services/content/TitleQualityValidator.service';
```

2. **Update buildSynapsePrompt()** - inject customer title guidance:
```typescript
// After framework guidance injection, add:

---

## CUSTOMER-FIRST TITLE GENERATION (Phase 2)

${customerTitleGuidance}

**CRITICAL REQUIREMENTS**:
1. Write for CUSTOMERS who will see this content, NOT for business owners
2. Focus on customer benefits, desires, and outcomes
3. NEVER use keyword concatenation (word + word + word)
4. Be specific, not generic ("Weekend Wait Times Peak at 30 Min" not "Product Quality Loved")
5. Include clear customer action or outcome

**BAD EXAMPLES** (NEVER DO THIS):
❌ "Social media + engagement = Post about your bakery"
❌ "How to improve your bakery operations"
❌ "Product Quality Loved"

**GOOD EXAMPLES** (DO THIS):
✅ "Why Your Weekend Croissants Taste Better Here"
✅ "Skip the Line: Text Orders Ready in 5 Minutes"
✅ "Fresh Ingredients Everyone Notices"

---
```

3. **Generate customer title guidance**:
```typescript
// In generateSynapses(), after framework selection:
const customerTitleGuidance = customerTitleGenerator.buildTitleGuidance({
  dataPoints,
  framework: selectedFramework.selected,
  dataPattern: selectedFramework.dataPattern,
  industry: input.business.industry,
  platform: 'social'
});
```

4. **Validate generated titles** (post-processing):
```typescript
// After parsing synapses from Claude response:
for (const synapse of synapses) {
  const validation = titleQualityValidator.validateTitle(synapse.insight);

  if (!validation.passed) {
    console.warn(`[Synapse] Title quality issues for "${synapse.insight}":`, validation.issues);
    // Log but don't block (for now - can add retry logic in future)
  }

  // Attach quality metadata
  synapse.titleQuality = {
    score: validation.score,
    passed: validation.passed,
    issues: validation.issues.length
  };
}
```

### Tests to Update:
- Update existing SynapseGenerator tests to verify title guidance injection
- Add test to verify title quality validation runs

---

## Task 2.4: Enhance Cluster Naming with CustomerTitleGenerator (45 min)

**File to Modify**: `/src/services/intelligence/clustering.service.ts`

### Changes:

1. **Import CustomerTitleGenerator**:
```typescript
import { customerTitleGenerator } from '@/services/content/CustomerTitleGenerator.service';
```

2. **Update generateThemeWithFramework()** - use CustomerTitleGenerator:
```typescript
private generateThemeWithFramework(points: DataPoint[]): { theme: string; frameworkUsed?: { id: string; name: string } } {
  try {
    const selectedFramework = frameworkSelector.selectBestFramework(points, 'social', 'engagement');

    // NEW: Use CustomerTitleGenerator for theme
    const titleResult = customerTitleGenerator.generateCustomerTitle({
      dataPoints: points,
      framework: selectedFramework.selected,
      dataPattern: selectedFramework.dataPattern,
      platform: 'social'
    });

    // Validate theme quality
    const validation = titleQualityValidator.validateTitle(titleResult.title);

    if (validation.passed) {
      console.log(`[Clustering] Generated customer-focused theme: "${titleResult.title}" (${titleResult.formula})`);
      return {
        theme: titleResult.title,
        frameworkUsed: {
          id: selectedFramework.selected.id,
          name: selectedFramework.selected.name
        }
      };
    } else {
      console.warn(`[Clustering] Theme validation failed, using fallback. Issues:`, validation.issues);
      // Fallback to enhanced customer-focused theme
      const theme = this.generateCustomerFocusedTheme(points, selectedFramework.dataPattern.type);
      return { theme, frameworkUsed: { id: selectedFramework.selected.id, name: selectedFramework.selected.name } };
    }
  } catch (error) {
    console.error('[Clustering] Theme generation error:', error);
    return { theme: this.generateTheme(points), frameworkUsed: undefined };
  }
}
```

3. **Enhance generateCustomerFocusedTheme()** - add more patterns:
```typescript
private generateCustomerFocusedTheme(points: DataPoint[], patternType: string): string {
  const hasNegativeSentiment = points.some(p => p.metadata?.sentiment === 'negative');
  const hasPositiveSentiment = points.some(p => p.metadata?.sentiment === 'positive');
  const contents = points.map(p => p.content).join(' ').toLowerCase();

  // Problem patterns (expanded)
  if (patternType === 'problem' && hasNegativeSentiment) {
    if (contents.includes('wait')) return this.extractSpecificProblem(contents, 'Wait Times', 'Minutes');
    if (contents.includes('price') || contents.includes('expensive')) return this.extractSpecificProblem(contents, 'Price', 'Concern');
    if (contents.includes('service') || contents.includes('staff')) return this.extractSpecificProblem(contents, 'Service Experience', 'Issue');
    if (contents.includes('quality')) return this.extractSpecificProblem(contents, 'Quality', 'Expectation');
  }

  // Desire patterns (new)
  if (patternType === 'desire' && hasPositiveSentiment) {
    if (contents.includes('fresh')) return 'Fresh Ingredients Everyone Notices';
    if (contents.includes('fast') || contents.includes('quick')) return 'Speed That Stands Out';
    if (contents.includes('friendly') || contents.includes('welcoming')) return 'Welcoming Experience Customers Remember';
  }

  // Transformation patterns (new)
  if (patternType === 'transformation') {
    if (contents.includes('before') && contents.includes('after')) {
      return this.extractBeforeAfter(contents);
    }
  }

  // Urgency patterns (new)
  if (patternType === 'urgency') {
    if (contents.includes('weekend') || contents.includes('saturday') || contents.includes('sunday')) {
      return 'Weekend Rush Creates New Opportunity';
    }
    if (contents.includes('season') || contents.includes('holiday')) {
      return 'Seasonal Demand Peaks This Month';
    }
  }

  // Fallback
  return this.generateTheme(points);
}

// Helper to extract specific problem details
private extractSpecificProblem(content: string, category: string, unit: string): string {
  // Extract numbers if present
  const numberMatch = content.match(/(\d+)\s*(minute|min|hour|dollar|\$)/);
  if (numberMatch) {
    return `${category}: ${numberMatch[1]}${numberMatch[2].includes('min') || numberMatch[2].includes('hour') ? ' ' + numberMatch[2] : ''} ${unit}`;
  }
  return `${category} ${unit} From Customers`;
}

// Helper to extract before/after transformation
private extractBeforeAfter(content: string): string {
  // Simple extraction - can be enhanced
  const beforeMatch = content.match(/before[:\s]+([^.,]+)/i);
  const afterMatch = content.match(/after[:\s]+([^.,]+)/i);

  if (beforeMatch && afterMatch) {
    return `${beforeMatch[1].trim()} → ${afterMatch[1].trim()}`;
  }
  return 'Customer Experience Transformation';
}
```

### Tests to Update:
- Update clustering tests to verify CustomerTitleGenerator integration
- Test validation fallback behavior
- Test enhanced pattern coverage

---

## Task 2.5: Create Integration Tests for Phase 2 (30 min)

**File**: `/src/__tests__/content-fix/phase2-integration.test.ts`

### What to Test:
```typescript
describe('Phase 2: Customer-First Title Generation', () => {
  describe('End-to-end title generation', () => {
    it('should generate customer-focused titles from data', () => {
      // Test CustomerTitleGenerator + FrameworkSelector
    });

    it('should reject business-focused titles', () => {
      // Test TitleQualityValidator
    });

    it('should work across multiple industries', () => {
      // Test restaurant, healthcare, SaaS, retail, professional services
    });
  });

  describe('Title quality validation', () => {
    it('should detect keyword concatenation', () => {
      const bad = "Social media + engagement + bakery";
      // Should fail validation
    });

    it('should detect business owner focus', () => {
      const bad = "How to improve your bakery operations";
      // Should fail validation
    });

    it('should accept customer-focused titles', () => {
      const good = "Why Your Weekend Croissants Taste Better Here";
      // Should pass validation
    });
  });

  describe('Cluster naming integration', () => {
    it('should generate specific customer-focused cluster themes', () => {
      // Test clustering.service integration
    });

    it('should avoid generic patterns', () => {
      // Verify no "Product Quality Loved" patterns
    });
  });

  describe('Cross-industry validation', () => {
    const industries = [
      { name: 'restaurant', data: [...] },
      { name: 'healthcare', data: [...] },
      { name: 'saas', data: [...] },
      { name: 'retail', data: [...] },
      { name: 'professional-services', data: [...] }
    ];

    it('should generate industry-appropriate titles', () => {
      for (const industry of industries) {
        // Test title generation
        // Verify customer focus
        // Verify quality score > 7
      }
    });
  });
});
```

---

## Task 2.6: Update Type Definitions (15 min)

**File to Modify**: `/src/types/synapse/synapse.types.ts`

### Changes:
```typescript
export interface SynapseInsight {
  // ... existing fields

  // Phase 2: Title quality tracking
  titleQuality?: {
    score: number;
    passed: boolean;
    issues: number;
  };
}
```

---

## Completion Criteria

### Code Quality:
- ✅ CustomerTitleGenerator service created and tested
- ✅ TitleQualityValidator service created and tested
- ✅ SynapseGenerator integrated with customer title generation
- ✅ clustering.service enhanced with CustomerTitleGenerator
- ✅ All tests pass
- ✅ No TypeScript errors

### Functional Quality:
- ✅ 0% keyword concatenation in generated titles
- ✅ 100% customer focus (no business owner advice)
- ✅ Title quality scores average > 7/10
- ✅ Works across 5+ industries

### Framework Integration:
- ✅ Title formulas align with content frameworks (AIDA, PAS, BAB)
- ✅ Framework guidance injected into prompts
- ✅ Validation runs on all generated titles

---

## Success Validation

**Before moving to Phase 3**:

1. Run all tests:
```bash
npm test content-fix/customer-title
npm test content-fix/title-quality
npm test content-fix/phase2
```

2. Run typecheck:
```bash
npm run typecheck | grep -E "(CustomerTitle|TitleQuality)"
```

3. Manual validation:
- Generate synapses for 3 different industries
- Verify titles are customer-focused
- Verify no keyword concatenation
- Check quality scores

4. Document results in:
- `/buildrunner/PHASE_2_COMPLETE_SUMMARY.md`
- `/buildrunner/PHASE_2_GAP_ANALYSIS.md`

---

## Estimated Timeline

- Task 2.1: 60 min
- Task 2.2: 30 min
- Task 2.3: 45 min
- Task 2.4: 45 min
- Task 2.5: 30 min
- Task 2.6: 15 min

**Total**: ~4 hours (optimized from 10)

---

**READY TO EXECUTE** ✅
