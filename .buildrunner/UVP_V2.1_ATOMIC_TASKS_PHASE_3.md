# UVP V2.1 - ATOMIC TASKS - PHASE 3
## Unified Ideal Customer Profile + Integration + Testing

**Execution Order:** Sequential
**Estimated Time:** 10 hours (6h build + 3h testing + 1h docs)
**Prerequisites:** Phase 1 & 2 complete
**Goal:** Unified customer screen, full integration, comprehensive testing

---

## PHASE 3A: CUSTOMER-DRIVER MAPPER SERVICE (1.5 hours)

### Task 3A-1: Create Customer Driver Mapper Service
**File:** `src/services/uvp-extractors/customer-driver-mapper.service.ts` (NEW)
**Action:** Create service to map emotional + functional drivers to customer profiles
**Dependencies:** Phase 2 complete

**Code to Write:**
```typescript
/**
 * Customer Driver Mapper Service
 *
 * Maps emotional and functional drivers to specific customer profiles
 * Generates combined insights showing motivation mapping
 */

interface CustomerProfile {
  statement: string;
  role?: string;
  companySize?: string;
  industry?: string;
  confidence: number;
}

interface Driver {
  text: string;
  source: string;
  confidence: number;
}

interface MappedProfile {
  customer: CustomerProfile;
  emotionalDrivers: Driver[];
  functionalDrivers: Driver[];
  combinedInsight: string;
  timestamp: Date;
}

class CustomerDriverMapperService {
  /**
   * Map drivers to customer profile
   */
  mapDriversToCustomer(
    customer: CustomerProfile,
    emotional: Driver[],
    functional: Driver[]
  ): MappedProfile {
    // Ensure we have top 3 of each
    const topEmotional = emotional.slice(0, 3);
    const topFunctional = functional.slice(0, 3);

    // Generate combined insight
    const insight = this.generateCombinedInsight(
      customer.statement,
      topEmotional.map(d => d.text),
      topFunctional.map(d => d.text)
    );

    return {
      customer,
      emotionalDrivers: topEmotional,
      functionalDrivers: topFunctional,
      combinedInsight: insight,
      timestamp: new Date()
    };
  }

  /**
   * Generate combined insight statement
   * Format: "[Customer] needs [functional] because [emotional]"
   */
  generateCombinedInsight(
    customer: string,
    emotional: string[],
    functional: string[]
  ): string {
    if (emotional.length === 0 && functional.length === 0) {
      return `${customer} are seeking to transform their business approach.`;
    }

    if (functional.length === 0) {
      return `${customer} are motivated by ${this.formatList(emotional)}.`;
    }

    if (emotional.length === 0) {
      return `${customer} need to ${this.formatList(functional)}.`;
    }

    // Full insight
    const functionalText = this.formatFunctionalNeeds(functional);
    const emotionalText = this.formatEmotionalDrivers(emotional);

    return `${customer} need to ${functionalText} because they ${emotionalText}.`;
  }

  /**
   * Format list with proper grammar
   * ["A", "B", "C"] → "A, B, and C"
   */
  private formatList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0].toLowerCase();
    if (items.length === 2) return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`;

    const last = items[items.length - 1];
    const rest = items.slice(0, -1);
    return `${rest.map(i => i.toLowerCase()).join(', ')}, and ${last.toLowerCase()}`;
  }

  /**
   * Format functional needs for insight
   */
  private formatFunctionalNeeds(needs: string[]): string {
    // Remove common prefixes to make more readable
    const cleaned = needs.map(n => {
      let text = n.toLowerCase();
      text = text.replace(/^(save|reduce|increase|improve|eliminate|automate)\s+/, '');
      text = text.replace(/^(to|in order to)\s+/, '');
      return text;
    });

    return this.formatList(cleaned);
  }

  /**
   * Format emotional drivers for insight
   */
  private formatEmotionalDrivers(drivers: string[]): string {
    // Add "feel" context if missing
    const withContext = drivers.map(d => {
      const lower = d.toLowerCase();
      if (lower.startsWith('fear')) return d.toLowerCase();
      if (lower.startsWith('frustrat')) return `feel ${d.toLowerCase()}`;
      if (lower.startsWith('desire')) return d.toLowerCase();
      if (lower.startsWith('worry')) return d.toLowerCase();
      return `feel ${d.toLowerCase()}`;
    });

    return this.formatList(withContext);
  }

  /**
   * Extract customer segment from statement
   * "VPs of Marketing at mid-sized companies" → "VPs of Marketing"
   */
  extractRole(customerStatement: string): string | undefined {
    // Look for role patterns
    const rolePatterns = [
      /^([A-Z][a-z]+\s+of\s+[A-Z][a-z]+)/,  // "Director of Marketing"
      /^([A-Z][A-Z]+s?)/,  // "CEOs", "VP"
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/,  // "Business Owners"
    ];

    for (const pattern of rolePatterns) {
      const match = customerStatement.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Extract company size from statement
   */
  extractCompanySize(customerStatement: string): string | undefined {
    const sizeKeywords = ['small', 'mid-sized', 'medium', 'large', 'enterprise', 'startup', 'SMB', 'SME'];

    for (const keyword of sizeKeywords) {
      if (customerStatement.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }

    return undefined;
  }
}

// Export singleton
export const customerDriverMapper = new CustomerDriverMapperService();
export default customerDriverMapper;
export type { MappedProfile, CustomerProfile, Driver };
```

**Success Criteria:**
- [ ] File created with all functions
- [ ] Types exported
- [ ] Insight generation grammatically correct
- [ ] No TypeScript errors

---

### Task 3A-2: Test Customer Driver Mapper
**File:** `src/services/uvp-extractors/__tests__/customer-driver-mapper.test.ts` (NEW)
**Action:** Unit tests for mapper logic
**Dependencies:** Task 3A-1

**Code to Write:**
```typescript
import { customerDriverMapper } from '../customer-driver-mapper.service';
import type { CustomerProfile, Driver } from '../customer-driver-mapper.service';

describe('CustomerDriverMapper', () => {
  const mockCustomer: CustomerProfile = {
    statement: 'VPs of Marketing at mid-sized B2B SaaS companies',
    role: 'VP of Marketing',
    companySize: 'mid-sized',
    industry: 'B2B SaaS',
    confidence: 85
  };

  const mockEmotional: Driver[] = [
    { text: 'Fear of missing quarterly targets', source: 'website', confidence: 90 },
    { text: 'Frustration with manual processes', source: 'reviews', confidence: 85 },
    { text: 'Desire to prove ROI to executives', source: 'industry', confidence: 80 }
  ];

  const mockFunctional: Driver[] = [
    { text: 'Save 20+ hours per week', source: 'website', confidence: 90 },
    { text: 'Reduce cost per lead by 40%', source: 'competitor', confidence: 85 },
    { text: 'Integrate with existing CRM', source: 'reviews', confidence: 80 }
  ];

  describe('generateCombinedInsight', () => {
    it('should generate full insight with both drivers', () => {
      const insight = customerDriverMapper.generateCombinedInsight(
        mockCustomer.statement,
        mockEmotional.map(d => d.text),
        mockFunctional.map(d => d.text)
      );

      expect(insight).toContain(mockCustomer.statement);
      expect(insight).toContain('need to');
      expect(insight).toContain('because');
    });

    it('should handle functional-only drivers', () => {
      const insight = customerDriverMapper.generateCombinedInsight(
        mockCustomer.statement,
        [],
        mockFunctional.map(d => d.text)
      );

      expect(insight).toContain('need to');
      expect(insight).not.toContain('because');
    });

    it('should handle emotional-only drivers', () => {
      const insight = customerDriverMapper.generateCombinedInsight(
        mockCustomer.statement,
        mockEmotional.map(d => d.text),
        []
      );

      expect(insight).toContain('motivated by');
    });

    it('should handle empty drivers gracefully', () => {
      const insight = customerDriverMapper.generateCombinedInsight(
        mockCustomer.statement,
        [],
        []
      );

      expect(insight).toContain(mockCustomer.statement);
      expect(insight.length).toBeGreaterThan(0);
    });
  });

  describe('mapDriversToCustomer', () => {
    it('should create mapped profile', () => {
      const mapped = customerDriverMapper.mapDriversToCustomer(
        mockCustomer,
        mockEmotional,
        mockFunctional
      );

      expect(mapped.customer).toBe(mockCustomer);
      expect(mapped.emotionalDrivers.length).toBeLessThanOrEqual(3);
      expect(mapped.functionalDrivers.length).toBeLessThanOrEqual(3);
      expect(mapped.combinedInsight.length).toBeGreaterThan(0);
      expect(mapped.timestamp).toBeInstanceOf(Date);
    });

    it('should limit to top 3 drivers', () => {
      const manyDrivers = [
        ...mockEmotional,
        { text: 'Extra 1', source: 'test', confidence: 70 },
        { text: 'Extra 2', source: 'test', confidence: 60 }
      ];

      const mapped = customerDriverMapper.mapDriversToCustomer(
        mockCustomer,
        manyDrivers,
        mockFunctional
      );

      expect(mapped.emotionalDrivers.length).toBe(3);
      expect(mapped.functionalDrivers.length).toBe(3);
    });
  });
});
```

**Success Criteria:**
- [ ] All tests written
- [ ] Tests pass with `npm test`
- [ ] Edge cases covered
- [ ] Grammatical correctness validated

---

## PHASE 3B: UNIFIED CUSTOMER PROFILE PAGE (4.5 hours)

### Task 3B-1: Create IdealCustomerProfilePage Component
**File:** `src/components/uvp-flow/IdealCustomerProfilePage.tsx` (NEW)
**Action:** Build unified customer + drivers screen
**Dependencies:** Task 3A-2

**Component Structure:**

```typescript
/**
 * Ideal Customer Profile Page - UVP Flow Step 2
 *
 * UNIFIED SCREEN combining:
 * - Customer segment selection (who they are)
 * - Emotional drivers (what they feel)
 * - Functional needs (what they need)
 * - Combined insight (mapped together)
 *
 * Replaces 3 separate screens with single comprehensive view
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Brain, Lightbulb, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import { customerDriverMapper } from '@/services/uvp-extractors/customer-driver-mapper.service';
import type { MappedProfile, CustomerProfile, Driver } from '@/services/uvp-extractors/customer-driver-mapper.service';

interface IdealCustomerProfilePageProps {
  businessName: string;
  industry?: string;
  // Pre-loaded extraction data
  customerProfiles?: any[];
  emotionalDrivers?: any[];
  functionalDrivers?: any[];
  // Value management
  value?: MappedProfile;
  onChange?: (profile: MappedProfile) => void;
  // Navigation
  onNext: () => void;
  onBack?: () => void;
  // UI
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function IdealCustomerProfilePage({
  businessName,
  industry = '',
  customerProfiles = [],
  emotionalDrivers = [],
  functionalDrivers = [],
  value,
  onChange,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 20,
  className = ''
}: IdealCustomerProfilePageProps) {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(value?.customer || null);
  const [selectedEmotional, setSelectedEmotional] = useState<Driver[]>(value?.emotionalDrivers || []);
  const [selectedFunctional, setSelectedFunctional] = useState<Driver[]>(value?.functionalDrivers || []);
  const [combinedInsight, setCombinedInsight] = useState<string>(value?.combinedInsight || '');

  // Update combined insight when selections change
  useEffect(() => {
    if (selectedCustomer && (selectedEmotional.length > 0 || selectedFunctional.length > 0)) {
      const mapped = customerDriverMapper.mapDriversToCustomer(
        selectedCustomer,
        selectedEmotional,
        selectedFunctional
      );
      setCombinedInsight(mapped.combinedInsight);

      if (onChange) {
        onChange(mapped);
      }
    }
  }, [selectedCustomer, selectedEmotional, selectedFunctional]);

  // Validation
  const isValid = selectedCustomer !== null &&
                  (selectedEmotional.length > 0 || selectedFunctional.length > 0);

  // Handlers
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer({
      statement: customer.content || customer.statement,
      role: customer.role,
      companySize: customer.companySize,
      industry: customer.industry,
      confidence: customer.confidence || 70
    });
  };

  const handleEmotionalToggle = (driver: Driver, checked: boolean) => {
    if (checked) {
      if (selectedEmotional.length < 3) {
        setSelectedEmotional([...selectedEmotional, driver]);
      }
    } else {
      setSelectedEmotional(selectedEmotional.filter(d => d.text !== driver.text));
    }
  };

  const handleFunctionalToggle = (driver: Driver, checked: boolean) => {
    if (checked) {
      if (selectedFunctional.length < 3) {
        setSelectedFunctional([...selectedFunctional, driver]);
      }
    } else {
      setSelectedFunctional(selectedFunctional.filter(d => d.text !== driver.text));
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 space-y-8 ${className}`}>
      {/* Progress */}
      {showProgress && (
        <CompactWizardProgress
          progress={{
            current_step: 'ideal-customer-profile',
            completed_steps: ['welcome'],
            total_steps: 5,
            progress_percentage: progressPercentage,
            is_valid: isValid,
            validation_errors: {},
            can_go_back: true,
            can_go_forward: isValid,
            can_submit: false
          }}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            UVP Step 2 of 5: Ideal Customer Profile
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Who is Your Ideal Customer?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Define your target customer and understand what drives their decisions.
          All on one screen.
        </p>
      </motion.div>

      {/* SECTION 1: WHO THEY ARE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="text-2xl font-bold">Who They Are</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SuggestionPanel
              suggestions={customerProfiles.map((p, i) => ({
                id: `customer-${i}`,
                type: 'customer-segment',
                content: p.statement || p.content,
                source: 'ai-generated',
                confidence: p.confidence || 70,
                tags: ['target_customer'],
                is_selected: false,
                is_customizable: true
              }))}
              type="customer-segment"
              onSelect={handleCustomerSelect}
              title="AI Suggestions"
              description="Select your target customer"
            />
          </div>

          <div className="lg:col-span-2">
            <DropZone
              zone={{
                id: 'customer-drop-zone',
                accepts: ['customer-segment'],
                items: [],
                is_active: false,
                is_over: false,
                can_drop: false
              }}
              onDrop={handleCustomerSelect}
              onRemove={() => setSelectedCustomer(null)}
              customValue={selectedCustomer?.statement || ''}
              onCustomInput={(text) => setSelectedCustomer({
                statement: text,
                confidence: 100
              } as CustomerProfile)}
              placeholder="Describe your ideal customer...&#10;&#10;Example: 'VP of Marketing at mid-sized B2B SaaS companies'"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT DRIVES THEM */}
      {selectedCustomer && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            <Brain className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold">What Drives Them</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Functional Needs */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold">Functional Needs</h3>
                <span className="text-sm text-gray-500">({selectedFunctional.length}/3)</span>
              </div>

              <div className="space-y-3">
                {functionalDrivers.slice(0, 8).map((driver: any, i: number) => {
                  const driverObj: Driver = {
                    text: driver.text || driver.content,
                    source: driver.source || 'ai',
                    confidence: driver.confidence || 70
                  };
                  const isSelected = selectedFunctional.some(d => d.text === driverObj.text);
                  const isDisabled = !isSelected && selectedFunctional.length >= 3;

                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400'
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleFunctionalToggle(driverObj, checked as boolean)}
                        disabled={isDisabled}
                      />
                      <span className="text-sm flex-1">{driverObj.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Emotional Drivers */}
            <div className="bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-bold">Emotional Drivers</h3>
                <span className="text-sm text-gray-500">({selectedEmotional.length}/3)</span>
              </div>

              <div className="space-y-3">
                {emotionalDrivers.slice(0, 8).map((driver: any, i: number) => {
                  const driverObj: Driver = {
                    text: driver.text || driver.content,
                    source: driver.source || 'ai',
                    confidence: driver.confidence || 70
                  };
                  const isSelected = selectedEmotional.some(d => d.text === driverObj.text);
                  const isDisabled = !isSelected && selectedEmotional.length >= 3;

                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-pink-100 dark:bg-pink-900/40 border-pink-400'
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleEmotionalToggle(driverObj, checked as boolean)}
                        disabled={isDisabled}
                      />
                      <span className="text-sm flex-1">{driverObj.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* SECTION 3: COMBINED INSIGHT */}
      {combinedInsight && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h2 className="text-2xl font-bold">Combined Insight</h2>
          </div>

          <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            <AlertDescription className="text-lg font-medium">
              {combinedInsight}
            </AlertDescription>
          </Alert>
        </motion.section>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!onBack}
          className="min-w-[120px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-sm text-muted-foreground">
          {isValid ? (
            <span className="text-green-600 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ready to continue
            </span>
          ) : (
            <span>Select customer and at least one driver to continue</span>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={!isValid}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- [ ] Component renders without errors
- [ ] Customer selection works
- [ ] Driver selection (max 3 each)
- [ ] Combined insight updates
- [ ] Validation prevents proceeding without data
- [ ] Responsive layout

---

[Continuing in next message due to length...]

### Task 3B-2: Extract Driver Data Services
**File:** Multiple extraction services
**Action:** Ensure driver extraction services are available
**Dependencies:** Task 3B-1

**Verify These Services Exist:**
1. `src/services/intelligence/psychological-pattern-extractor.service.ts`
   - Exports emotional drivers
2. `src/services/uvp-extractors/enhanced-benefit-extractor.service.ts`
   - Exports functional needs

**If Missing:** Create stub services that return mock data for testing

**Success Criteria:**
- [ ] Emotional driver extraction available
- [ ] Functional driver extraction available
- [ ] Services return properly formatted data

---

## PHASE 3C: UVP FLOW INTEGRATION (2 hours)

### Task 3C-1: Update UVP Flow Router
**File:** `src/pages/OnboardingPageV5.tsx` OR wherever UVP flow is routed
**Action:** Replace separate driver steps with unified page
**Dependencies:** Task 3B-2

**Changes:**

1. Import new component:
```typescript
import { IdealCustomerProfilePage } from '@/components/uvp-flow/IdealCustomerProfilePage';
```

2. Update step configuration:

**BEFORE (6 steps):**
- Step 1: Welcome/Industry
- Step 2: Target Customer
- Step 3: Emotional Drivers
- Step 4: Functional Drivers
- Step 5: Transformation
- Step 6: Solution

**AFTER (5 steps):**
- Step 1: Welcome/Industry
- Step 2: **Ideal Customer Profile** (NEW - combines 2+3+4)
- Step 3: Transformation
- Step 4: Solution
- Step 5: Key Benefit

3. Update progress percentages:
- Step 1: 20%
- Step 2: 40% (was 33%)
- Step 3: 60% (was 50%)
- Step 4: 80% (was 67%)
- Step 5: 100% (was 83%)

4. Update data flow to pass:
- `customerProfiles` from extraction
- `emotionalDrivers` from extraction
- `functionalDrivers` from extraction

**Success Criteria:**
- [ ] New component integrated
- [ ] Old steps removed
- [ ] Step count reduced to 5
- [ ] Progress percentages updated
- [ ] Data flow connected

---

### Task 3C-2: Update Data Persistence
**File:** `src/services/uvp/session-manager.service.ts` OR wherever UVP data saves
**Action:** Save new unified format
**Dependencies:** Task 3C-1

**New Data Structure:**
```typescript
interface UVPData {
  industry: string;
  idealCustomerProfile: {
    customer: {
      statement: string;
      role?: string;
      companySize?: string;
      industry?: string;
      confidence: number;
    };
    emotionalDrivers: Array<{
      text: string;
      source: string;
      confidence: number;
    }>;
    functionalDrivers: Array<{
      text: string;
      source: string;
      confidence: number;
    }>;
    combinedInsight: string;
    timestamp: Date;
  };
  transformation: string;
  solution: string;
  benefit: string;
}
```

**Save to:** `business_profiles.uvp_data` JSONB column

**Backward Compatibility:**
- Check if old format exists (separate customer/emotional/functional fields)
- If found, migrate to new format on load
- Save always uses new format

**Success Criteria:**
- [ ] New format saves successfully
- [ ] Data persists across page reloads
- [ ] Backward compatible with old data
- [ ] No data loss

---

### Task 3C-3: Update Pre-loading Logic
**File:** `src/pages/OnboardingPageV5.tsx` OR parent component
**Action:** Pre-load all three data sources in parallel
**Dependencies:** Task 3C-2

**Background Loading:**
```typescript
useEffect(() => {
  async function preloadCustomerData() {
    const [customers, emotional, functional] = await Promise.all([
      extractEnhancedCustomers(websiteContent, businessName, industry, websiteUrl),
      extractEmotionalDrivers(websiteContent, businessName, industry),
      extractFunctionalDrivers(websiteContent, businessName, industry)
    ]);

    setPreloadedData({
      customerProfiles: customers.profiles,
      emotionalDrivers: emotional.drivers,
      functionalDrivers: functional.needs,
      loading: false
    });
  }

  if (websiteContent.length > 0) {
    preloadCustomerData();
  }
}, [websiteContent, businessName, industry, websiteUrl]);
```

**Success Criteria:**
- [ ] All three data sources load in parallel
- [ ] Loading state managed
- [ ] Data passed to IdealCustomerProfilePage
- [ ] No waterfall loading (efficient)

---

## PHASE 3D: TESTING & VALIDATION (3 hours)

### Task 3D-1: Manual UI Testing
**File:** N/A (Manual testing)
**Action:** Complete end-to-end UI testing
**Dependencies:** Task 3C-3

**Test Procedure:**
1. Start fresh session
2. Enter business info + website
3. Wait for pre-loading
4. Navigate to Ideal Customer Profile step
5. Test customer selection
6. Test driver selection (max 3 each)
7. Verify combined insight generates
8. Test validation (can't proceed without data)
9. Complete full flow
10. Verify data saves

**Test Checklist:**
- [ ] Customer suggestions load
- [ ] Can select customer from suggestions
- [ ] Can enter custom customer
- [ ] Emotional drivers load (max 3 selectable)
- [ ] Functional drivers load (max 3 selectable)
- [ ] Combined insight updates in real-time
- [ ] Can't select more than 3 of each driver
- [ ] Validation prevents proceeding without selections
- [ ] Back button works
- [ ] Next button enables when valid
- [ ] Data persists on page reload
- [ ] Responsive on mobile

**Success Criteria:**
- [ ] All checklist items pass
- [ ] No console errors
- [ ] No visual glitches
- [ ] Smooth user experience

---

### Task 3D-2: Full Flow Integration Test
**File:** N/A (Manual testing)
**Action:** Test complete UVP flow end-to-end
**Dependencies:** Task 3D-1

**Test Scenarios:**

**Scenario 1: New Business (Full Flow)**
1. Enter: "Acme Marketing Agency", "https://acme.com"
2. Industry: "Marketing Services"
3. Complete Ideal Customer Profile step
4. Complete Transformation step
5. Complete Solution step
6. Complete Benefit step
7. Submit UVP

**Expected:**
- [ ] All 5 steps complete
- [ ] Data saves at each step
- [ ] Final UVP generated
- [ ] Progress bar reaches 100%

**Scenario 2: Existing Business (Edit)**
1. Load existing business with old UVP format
2. Navigate to Ideal Customer Profile step
3. Verify data migrated to new format
4. Edit customer/drivers
5. Save changes

**Expected:**
- [ ] Old data loads successfully
- [ ] Migration to new format works
- [ ] Edits save
- [ ] No data loss

**Scenario 3: OpenDialog.ai (Real-World Test)**
1. Enter: "OpenDialog", "https://opendialog.ai"
2. Industry: "Conversational AI"
3. Verify products detected (Selma, Jamie, Rhea, Platform)
4. Complete Ideal Customer Profile with real data
5. Complete full flow

**Expected:**
- [ ] Products detected correctly
- [ ] Customer profiles relevant to AI industry
- [ ] Drivers make sense for B2B SaaS
- [ ] Combined insight grammatically correct

**Success Criteria:**
- [ ] All 3 scenarios pass
- [ ] No errors in any scenario
- [ ] Data consistency maintained

---

### Task 3D-3: TypeScript & Build Validation
**File:** N/A (Build validation)
**Action:** Ensure no TypeScript errors
**Dependencies:** Task 3D-2

**Commands:**
```bash
# TypeScript check
npm run build

# Linting
npm run lint

# Unit tests
npm test

# Type check only (faster)
npx tsc --noEmit
```

**Success Criteria:**
- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run lint` passes
- [ ] All unit tests pass
- [ ] No type errors

---

## PHASE 3E: DOCUMENTATION & COMMIT (1 hour)

### Task 3E-1: Update features.json
**File:** `.buildrunner/features.json`
**Action:** Mark enhanced-uvp-wizard as complete
**Dependencies:** Task 3D-3

**Update:**
- Set status: "complete"
- Add completion date
- List components created
- Note step reduction (6 → 5)

**Success Criteria:**
- [ ] features.json updated
- [ ] Status reflects completion
- [ ] Components documented

---

### Task 3E-2: Create Migration Notes
**File:** `.buildrunner/UVP_V2_MIGRATION_NOTES.md` (NEW)
**Action:** Document changes for future reference
**Dependencies:** Task 3E-1

**Contents:**
- Old vs new data structure
- Backward compatibility notes
- Migration procedure if needed
- Breaking changes (none expected)
- Rollback procedure

**Success Criteria:**
- [ ] Migration notes comprehensive
- [ ] Easy to understand
- [ ] Covers edge cases

---

### Task 3E-3: Final Commit
**File:** N/A (Git operation)
**Action:** Commit Phase 3 changes
**Dependencies:** Task 3E-2

```bash
git add .
git commit -m "feat(uvp-v2): Phase 3 - Unified Ideal Customer Profile screen

NEW COMPONENTS:
- IdealCustomerProfilePage: Unified customer + drivers screen
- CustomerDriverMapperService: Maps drivers to customer with insights

UVP FLOW IMPROVEMENTS:
- Reduced steps from 6 to 5 (merged customer + 2 driver steps)
- All customer data visible on one screen
- Real-time combined insight generation
- Better UX with checkbox-based driver selection

DATA STRUCTURE:
- New unified IdealCustomerProfile format
- Backward compatible with old format
- Auto-migration on load
- Saves to business_profiles.uvp_data

TESTING:
- Full UI testing complete ✓
- 3 integration scenarios validated ✓
- TypeScript build successful ✓
- All unit tests passing ✓
- OpenDialog.ai real-world test ✓

Phase 3 of 3 complete - Ready for final validation."
```

**Success Criteria:**
- [ ] Commit message comprehensive
- [ ] All changes included
- [ ] Ready for final gap analysis

---

## PHASE 3 COMPLETION CHECKLIST

**Phase 3A: Customer-Driver Mapper**
- [ ] CustomerDriverMapperService created
- [ ] Unit tests passing
- [ ] Combined insight generation working

**Phase 3B: Unified Screen**
- [ ] IdealCustomerProfilePage component created
- [ ] Driver extraction services available
- [ ] UI functional and responsive

**Phase 3C: Integration**
- [ ] UVP flow updated (5 steps)
- [ ] Data persistence updated
- [ ] Pre-loading working

**Phase 3D: Testing**
- [ ] Manual UI testing complete
- [ ] Full flow integration tests pass
- [ ] TypeScript build successful

**Phase 3E: Documentation**
- [ ] features.json updated
- [ ] Migration notes created
- [ ] Phase 3 committed

---

## NEXT: GAP ANALYSIS & FINAL TESTING
After Phase 3 completion, proceed to:
- `.buildrunner/UVP_V2.1_GAP_ANALYSIS.md`
- Comprehensive gap analysis (3 iterations)
- CI/CD pipeline validation
- Playwright e2e tests
- Final user testing preparation
