# Comprehensive Research: UVP Save Issues in React Applications

**Research Date:** 2025-12-04
**Focus:** Error boundaries, session state management, data validation, null safety, and async patterns

---

## 1. React Error Boundaries: Handling Undefined Properties

### Modern Error Boundary Best Practices (2025)

Error boundaries are class components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI. However, they only catch errors during:
- Rendering
- Lifecycle methods
- Constructors of the whole tree below them

**They do NOT catch errors in:**
- Event handlers
- Asynchronous code (setTimeout, promises)
- Server-side rendering
- Errors thrown in the error boundary itself

### Strategic Placement

**DON'T:** Wrap your entire app in one giant error boundary
**DO:** Place error boundaries around independent features

```typescript
// Bad - Everything breaks together
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Good - Isolated failures
<Layout>
  <ErrorBoundary fallback={<SidebarError />}>
    <Sidebar />
  </ErrorBoundary>
  <ErrorBoundary fallback={<DashboardError />}>
    <Dashboard />
  </ErrorBoundary>
  <ErrorBoundary fallback={<FormError />}>
    <OnboardingForm />
  </ErrorBoundary>
</Layout>
```

### Handling Nested Undefined Properties

The classic killer: `this.props.myData.obj.something.somethingelse`

**Solutions:**

1. **Optional Chaining (Modern - Preferred)**
```typescript
const value = props.myData?.obj?.something?.somethingelse;
```

2. **Lodash's get() Helper**
```typescript
import { get } from 'lodash';
const value = get(props, 'myData.obj.something.somethingelse', 'default');
```

3. **Defensive Checks**
```typescript
if (props.myData &&
    props.myData.obj &&
    props.myData.obj.something &&
    props.myData.obj.something.somethingelse) {
  // Safe to use
}
```

### react-error-boundary Library (Recommended)

Since React doesn't provide error boundary support for functional components, use the `react-error-boundary` package:

```typescript
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

// For sync errors
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onReset={() => {
    // Reset app state
  }}
>
  <YourComponent />
</ErrorBoundary>

// For async errors in functional components
function AsyncComponent() {
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    fetchData(id)
      .then(data => setData(data))
      .catch(error => showBoundary(error)); // Pass to boundary
  }, [id]);
}
```

### Testing Error Boundaries

Every feature should include a test that intentionally triggers an error:

```typescript
it('should display error boundary fallback when component throws', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```

### User-Friendly Fallback UIs

**DON'T:** "Something went wrong."
**DO:** Provide context and actions

```typescript
function OnboardingErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-container">
      <h2>We hit a snag with your onboarding</h2>
      <p>Your progress has been saved. You can:</p>
      <ul>
        <li>
          <button onClick={resetErrorBoundary}>
            Try continuing from where you left off
          </button>
        </li>
        <li>
          <button onClick={() => window.location.href = '/dashboard'}>
            Go back to dashboard
          </button>
        </li>
        <li>
          <a href="/support">Contact support</a> if this keeps happening
        </li>
      </ul>
      {process.env.NODE_ENV === 'development' && (
        <pre>{error.stack}</pre>
      )}
    </div>
  );
}
```

### Error Logging

```typescript
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    // Log to Sentry, Datadog, etc.
    logErrorToService(error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

**Sources:**
- [Error Boundaries - React](https://legacy.reactjs.org/docs/error-boundaries.html)
- [Error Boundaries in React - Refine](https://refine.dev/blog/react-error-boundaries/)
- [react-error-boundary - npm](https://www.npmjs.com/package/react-error-boundary)
- [React Error Boundaries - Hooked On UI](https://hookedonui.com/react-error-boundaries-why-they-matter/)

---

## 2. Session State Management: Multi-Step Onboarding Flows

### The Problem

Multi-step onboarding flows need to handle:
- Step transitions without losing data
- Validation before proceeding
- Recovery from interrupted flows
- Persistence across page refreshes
- Complex conditional logic

### Modern Approaches (2025)

#### Option 1: OnboardJS (Headless, Type-Safe)

OnboardJS is a headless, type-safe engine designed specifically for multi-step flows. It handles state management, persistence, and navigation automatically while you provide the UI.

**Key Features:**
- TypeScript-first with full type safety
- Automatic persistence (localStorage, sessionStorage, API)
- Complex conditional flows
- Built-in validation
- Step completion tracking for analytics

```typescript
import { createFlow } from '@onboardjs/core';

const onboardingFlow = createFlow({
  steps: [
    {
      id: 'profile',
      component: ProfileStep,
      validate: (data) => {
        return data.companyName && data.industry;
      }
    },
    {
      id: 'uvp-customer',
      component: UVPCustomerStep,
      validate: (data) => {
        return data.targetCustomer && data.customerJobs;
      }
    },
    {
      id: 'uvp-solution',
      component: UVPSolutionStep,
      validate: (data) => {
        return data.solution && data.painRelievers.length > 0;
      },
      condition: (data) => data.profile.needsUVP === true
    }
  ],
  persistence: {
    type: 'localStorage',
    key: 'onboarding-progress'
  }
});
```

#### Option 2: Context API + Custom Hook

For more control, build your own with Context API:

```typescript
// OnboardingContext.tsx
interface OnboardingContextType<T> {
  currentStep: number;
  data: T;
  isLoading: boolean;
  error: Error | null;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  updateData: (stepData: Partial<T>) => void;
  saveProgress: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType<any>>(null!);

export function OnboardingProvider({ children, config }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const saved = localStorage.getItem('onboarding-progress');
      if (saved) {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setData(data);
      }
    };
    loadProgress();
  }, []);

  const updateData = useCallback((stepData) => {
    setData(prev => ({ ...prev, ...stepData }));
  }, []);

  const saveProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      // Save to API
      await saveOnboardingProgress({ step: currentStep, data });
      // Also save locally
      localStorage.setItem('onboarding-progress',
        JSON.stringify({ step: currentStep, data })
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, data]);

  const nextStep = useCallback(async () => {
    const currentStepConfig = config.steps[currentStep];

    // Validate current step
    if (currentStepConfig.validate) {
      const isValid = await currentStepConfig.validate(data);
      if (!isValid) {
        throw new Error('Validation failed');
      }
    }

    // Save progress
    await saveProgress();

    // Move to next step
    setCurrentStep(prev => Math.min(prev + 1, config.steps.length - 1));
  }, [currentStep, data, config, saveProgress]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        data,
        isLoading,
        error,
        nextStep,
        previousStep,
        updateData,
        saveProgress
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
```

#### Option 3: Finite State Machine (XState)

For complex flows with many conditional branches:

```typescript
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

const onboardingMachine = createMachine({
  id: 'onboarding',
  initial: 'profile',
  context: {
    data: {}
  },
  states: {
    profile: {
      on: {
        NEXT: {
          target: 'uvpCustomer',
          actions: assign({
            data: (ctx, event) => ({ ...ctx.data, profile: event.data })
          }),
          cond: 'profileValid'
        }
      }
    },
    uvpCustomer: {
      on: {
        NEXT: {
          target: 'uvpSolution',
          actions: assign({
            data: (ctx, event) => ({ ...ctx.data, customer: event.data })
          }),
          cond: 'customerValid'
        },
        BACK: 'profile'
      }
    },
    uvpSolution: {
      on: {
        NEXT: {
          target: 'complete',
          actions: assign({
            data: (ctx, event) => ({ ...ctx.data, solution: event.data })
          }),
          cond: 'solutionValid'
        },
        BACK: 'uvpCustomer'
      }
    },
    complete: {
      type: 'final'
    }
  }
}, {
  guards: {
    profileValid: (ctx, event) => {
      return event.data.companyName && event.data.industry;
    },
    customerValid: (ctx, event) => {
      return event.data.targetCustomer;
    },
    solutionValid: (ctx, event) => {
      return event.data.solution;
    }
  }
});

function OnboardingFlow() {
  const [state, send] = useMachine(onboardingMachine);

  const handleNext = (stepData) => {
    send({ type: 'NEXT', data: stepData });
  };

  return (
    <div>
      {state.matches('profile') && <ProfileStep onNext={handleNext} />}
      {state.matches('uvpCustomer') && <CustomerStep onNext={handleNext} />}
      {state.matches('uvpSolution') && <SolutionStep onNext={handleNext} />}
    </div>
  );
}
```

### Step Transition Best Practices

1. **Validate before proceeding**
```typescript
const nextStep = async () => {
  const isValid = await trigger(getFieldsByStep(currentStep));
  if (!isValid) {
    // Show errors, don't proceed
    return;
  }
  await saveProgress();
  setCurrentStep(currentStep + 1);
};
```

2. **Save progress incrementally**
```typescript
// Don't wait until the end to save
useEffect(() => {
  const autosave = setTimeout(() => {
    saveProgress();
  }, 2000);

  return () => clearTimeout(autosave);
}, [data]);
```

3. **Handle interrupted flows**
```typescript
// On mount, check for existing progress
useEffect(() => {
  const checkProgress = async () => {
    const progress = await getOnboardingProgress(userId);
    if (progress && progress.step < totalSteps) {
      // Show resume modal
      setShowResumeModal(true);
    }
  };
  checkProgress();
}, []);
```

**Sources:**
- [OnboardJS - React Onboarding & Analytics](https://onboardjs.com/)
- [Building a multi-step onboarding flow - DEV](https://dev.to/eelcowiersma/building-a-multi-step-onboarding-flow-in-5-minutes-2176)
- [Finite State Machines in React - The Miners](https://blog.codeminer42.com/finite-state-machines-and-how-to-build-any-step-by-step-flow-in-react/)
- [Multi-Step Forms with Wizard Pattern - Medium](https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793)

---

## 3. Data Schema Validation: TypeScript + Runtime Validation

### The Problem

TypeScript provides compile-time type safety, but doesn't validate runtime data. When data comes from:
- API responses
- User input
- localStorage
- URL parameters

You need **runtime validation** to ensure data matches expected schema.

### Solution: Zod (TypeScript-First Validation)

Zod is the gold standard for TypeScript schema validation in 2025. It provides:
- Runtime validation
- Automatic TypeScript type inference
- Nested object validation
- Array validation
- Custom error messages
- Transform capabilities

#### Basic Usage

```typescript
import { z } from 'zod';

// Define schema
const UVPCustomerSchema = z.object({
  targetCustomer: z.string().min(1, "Target customer is required"),
  customerJobs: z.array(z.string()).min(1, "At least one job required"),
  pains: z.array(z.string()).optional(),
  gains: z.array(z.string()).optional()
});

// Infer TypeScript type from schema
type UVPCustomer = z.infer<typeof UVPCustomerSchema>;

// Validate data
function saveCustomerProfile(data: unknown) {
  try {
    const validated = UVPCustomerSchema.parse(data);
    // data is now typed as UVPCustomer
    await saveToDatabase(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      console.error(error.errors);
      /*
      [
        {
          path: ['customerJobs'],
          message: 'At least one job required'
        }
      ]
      */
    }
  }
}
```

#### Safe Parsing (No Exceptions)

```typescript
const result = UVPCustomerSchema.safeParse(data);

if (result.success) {
  // result.data is validated and typed
  console.log(result.data);
} else {
  // result.error contains ZodError
  console.error(result.error.errors);
}
```

#### Nested Object Validation

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/)
});

const UserProfileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema, // Nested schema
  alternateAddresses: z.array(AddressSchema).optional()
});

type UserProfile = z.infer<typeof UserProfileSchema>;
```

#### UVP-Specific Schema Example

```typescript
// Complete UVP schema with nested validation
const UVPSchema = z.object({
  // Customer Profile
  customerProfile: z.object({
    targetCustomer: z.string().min(1),
    customerJobs: z.array(z.object({
      description: z.string(),
      importance: z.enum(['low', 'medium', 'high'])
    })),
    pains: z.array(z.object({
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high'])
    })),
    gains: z.array(z.object({
      description: z.string(),
      priority: z.enum(['nice-to-have', 'expected', 'desired'])
    }))
  }),

  // Value Map
  valueMap: z.object({
    products: z.array(z.string()),
    painRelievers: z.array(z.object({
      description: z.string(),
      addressesPain: z.string() // References pain ID
    })),
    gainCreators: z.array(z.object({
      description: z.string(),
      createsGain: z.string() // References gain ID
    }))
  }),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(['draft', 'complete', 'archived'])
});

type UVP = z.infer<typeof UVPSchema>;
```

#### Handling Optional and Nullable Fields

```typescript
const schema = z.object({
  // Optional - may be undefined
  optional: z.string().optional(),

  // Nullable - may be null
  nullable: z.string().nullable(),

  // Both - may be null or undefined
  nullish: z.string().nullish(),

  // With default value
  withDefault: z.string().default('default value')
});
```

#### Safe Nested Property Access

Combine Zod with optional chaining for maximum safety:

```typescript
function UVPDisplay({ data }: { data: unknown }) {
  const result = UVPSchema.safeParse(data);

  if (!result.success) {
    return <ErrorDisplay errors={result.error.errors} />;
  }

  const uvp = result.data;

  return (
    <div>
      <h2>{uvp.customerProfile.targetCustomer}</h2>
      {/* Safe - validated by Zod */}
      <ul>
        {uvp.customerProfile.customerJobs.map(job => (
          <li key={job.description}>{job.description}</li>
        ))}
      </ul>

      {/* Extra safe with optional chaining for optional fields */}
      {uvp.customerProfile.pains?.map(pain => (
        <PainCard key={pain.description} pain={pain} />
      ))}
    </div>
  );
}
```

### Alternative: TypeBox

For maximum performance with similar features:

```typescript
import { Type } from '@sinclair/typebox';

const UVPCustomerSchema = Type.Object({
  targetCustomer: Type.String({ minLength: 1 }),
  customerJobs: Type.Array(Type.String(), { minItems: 1 }),
  pains: Type.Optional(Type.Array(Type.String())),
  gains: Type.Optional(Type.Array(Type.String()))
});

// Use with Ajv for validation
import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile(UVPCustomerSchema);

if (validate(data)) {
  // Valid
} else {
  console.error(validate.errors);
}
```

### Defensive Programming Patterns

Even with validation, add defensive checks in critical paths:

```typescript
function getCustomerJobCount(uvp: UVP | undefined | null): number {
  // Multiple layers of defense
  return uvp?.customerProfile?.customerJobs?.length ?? 0;
}

function getFirstPain(uvp: UVP): string {
  // With default fallback
  return uvp?.customerProfile?.pains?.[0]?.description ?? 'No pains identified';
}

function hasHighSeverityPains(uvp: UVP): boolean {
  // Safe array operations
  return (uvp?.customerProfile?.pains ?? [])
    .some(pain => pain.severity === 'high');
}
```

**Sources:**
- [Zod - TypeScript-first schema validation](https://zod.dev/)
- [Zod + TypeScript: Schema Validation Made Easy - Telerik](https://www.telerik.com/blogs/zod-typescript-schema-validation-made-easy)
- [TypeBox - TypeScript Type Provider - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/typebox-explained/)
- [TypeSafe-Get - GitHub](https://github.com/pimterry/typesafe-get)

---

## 4. UVP Flow Architecture: Customer Profile → Transformation → Solution → Benefit

### Standard UVP Canvas Architecture

The Value Proposition Canvas consists of two main components:

1. **Customer Profile** (Right side)
   - Customer Jobs
   - Pains
   - Gains

2. **Value Map** (Left side)
   - Products & Services
   - Pain Relievers
   - Gain Creators

### Data Flow Architecture

```typescript
interface UVPFlowArchitecture {
  // Step 1: Customer Profile
  customerProfile: {
    // What customers are trying to accomplish
    jobs: Array<{
      id: string;
      description: string;
      type: 'functional' | 'social' | 'emotional';
      importance: 'low' | 'medium' | 'high';
    }>;

    // What frustrates customers
    pains: Array<{
      id: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      relatedJobId: string;
    }>;

    // What customers hope to achieve
    gains: Array<{
      id: string;
      description: string;
      priority: 'nice-to-have' | 'expected' | 'desired';
      relatedJobId: string;
    }>;
  };

  // Step 2: Value Map
  valueMap: {
    // What you offer
    products: Array<{
      id: string;
      name: string;
      description: string;
    }>;

    // How you alleviate pains
    painRelievers: Array<{
      id: string;
      description: string;
      addressesPainId: string; // References pain.id
      productId: string;
    }>;

    // How you create gains
    gainCreators: Array<{
      id: string;
      description: string;
      createsGainId: string; // References gain.id
      productId: string;
    }>;
  };

  // Step 3: Fit Score (calculated)
  fitScore: {
    painFit: number; // 0-100
    gainFit: number; // 0-100
    overall: number; // 0-100
  };
}
```

### Multi-Step Flow Implementation

```typescript
// Step configuration
const uvpFlowSteps = [
  {
    id: 'customer-jobs',
    title: 'What jobs do your customers need to get done?',
    component: CustomerJobsStep,
    validation: z.object({
      jobs: z.array(z.object({
        description: z.string().min(10),
        type: z.enum(['functional', 'social', 'emotional']),
        importance: z.enum(['low', 'medium', 'high'])
      })).min(1, 'Add at least one customer job')
    })
  },
  {
    id: 'customer-pains',
    title: 'What pains do customers experience?',
    component: CustomerPainsStep,
    validation: z.object({
      pains: z.array(z.object({
        description: z.string().min(10),
        severity: z.enum(['low', 'medium', 'high']),
        relatedJobId: z.string()
      })).min(1, 'Add at least one pain')
    }),
    // Depends on previous step
    dependencies: ['customer-jobs']
  },
  {
    id: 'customer-gains',
    title: 'What gains do customers expect?',
    component: CustomerGainsStep,
    validation: z.object({
      gains: z.array(z.object({
        description: z.string().min(10),
        priority: z.enum(['nice-to-have', 'expected', 'desired']),
        relatedJobId: z.string()
      })).min(1, 'Add at least one gain')
    }),
    dependencies: ['customer-jobs']
  },
  {
    id: 'products',
    title: 'What products/services do you offer?',
    component: ProductsStep,
    validation: z.object({
      products: z.array(z.object({
        name: z.string().min(1),
        description: z.string().min(20)
      })).min(1, 'Add at least one product')
    })
  },
  {
    id: 'pain-relievers',
    title: 'How do your products relieve customer pains?',
    component: PainRelieversStep,
    validation: z.object({
      painRelievers: z.array(z.object({
        description: z.string().min(10),
        addressesPainId: z.string(),
        productId: z.string()
      })).min(1, 'Add at least one pain reliever')
    }),
    dependencies: ['customer-pains', 'products']
  },
  {
    id: 'gain-creators',
    title: 'How do your products create customer gains?',
    component: GainCreatorsStep,
    validation: z.object({
      gainCreators: z.array(z.object({
        description: z.string().min(10),
        createsGainId: z.string(),
        productId: z.string()
      })).min(1, 'Add at least one gain creator')
    }),
    dependencies: ['customer-gains', 'products']
  },
  {
    id: 'review',
    title: 'Review your Value Proposition',
    component: ReviewStep,
    validation: z.object({
      confirmed: z.boolean().refine(val => val === true)
    })
  }
];
```

### Data Validation at Each Step

```typescript
function UVPFlowStep({ step, data, onNext }) {
  const [stepData, setStepData] = useState(data[step.id] || {});
  const [errors, setErrors] = useState<z.ZodError | null>(null);

  const handleNext = async () => {
    // Validate current step
    const result = step.validation.safeParse(stepData);

    if (!result.success) {
      setErrors(result.error);
      return;
    }

    // Clear errors
    setErrors(null);

    // Save to parent state
    await onNext({
      ...data,
      [step.id]: result.data
    });
  };

  return (
    <div>
      <h2>{step.title}</h2>
      <step.component
        data={stepData}
        onChange={setStepData}
        errors={errors}
      />
      <button onClick={handleNext}>Continue</button>
    </div>
  );
}
```

### Calculating Fit Score

```typescript
function calculateUVPFit(uvp: UVPFlowArchitecture): FitScore {
  const { customerProfile, valueMap } = uvp;

  // Pain fit: % of pains addressed by pain relievers
  const painsAddressed = customerProfile.pains.filter(pain =>
    valueMap.painRelievers.some(reliever =>
      reliever.addressesPainId === pain.id
    )
  );
  const painFit = (painsAddressed.length / customerProfile.pains.length) * 100;

  // Gain fit: % of gains created by gain creators
  const gainsCreated = customerProfile.gains.filter(gain =>
    valueMap.gainCreators.some(creator =>
      creator.createsGainId === gain.id
    )
  );
  const gainFit = (gainsCreated.length / customerProfile.gains.length) * 100;

  // Overall fit (weighted)
  const overall = (painFit * 0.6 + gainFit * 0.4);

  return { painFit, gainFit, overall };
}
```

**Sources:**
- [Value Proposition Canvas - Creately](https://creately.com/guides/value-proposition-canvas/)
- [Customer Value Proposition Canvas Framework - Kathirvel](https://www.kathirvel.com/value-proposition-canvas-business-success/)
- [Value Proposition Design - ITONICS](https://www.itonics-innovation.com/blog/value-proposition-design)
- [Validating Value Propositions - ProductHQ](https://producthq.org/agile/product-management/validating-and-executing-on-value-propositions/)

---

## 5. Database Save Patterns: Complex Nested Objects

### The Problem

When saving UVP data with nested arrays and objects:
- Arrays vs. single objects confusion
- Foreign key relationships
- Data integrity across tables
- Transaction safety
- Handling partial saves

### PostgreSQL Options for Complex Data

#### Option 1: JSONB (Recommended for Flexible Schemas)

**Best for:**
- Nested objects with variable structure
- Rapid iteration on schema
- When you need to query nested fields

```sql
CREATE TABLE uvp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Store entire UVP as JSONB
  customer_profile JSONB NOT NULL,
  value_map JSONB NOT NULL,

  -- Metadata
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for querying nested data
  CONSTRAINT valid_status CHECK (status IN ('draft', 'complete', 'archived'))
);

-- Index for querying nested JSONB
CREATE INDEX idx_customer_jobs ON uvp_profiles
  USING GIN ((customer_profile -> 'jobs'));

-- Query nested data
SELECT * FROM uvp_profiles
WHERE customer_profile @> '{"jobs": [{"importance": "high"}]}';
```

**TypeScript Integration:**

```typescript
interface DatabaseUVP {
  id: string;
  user_id: string;
  customer_profile: {
    jobs: Array<{
      id: string;
      description: string;
      type: string;
      importance: string;
    }>;
    pains: Array<{ /* ... */ }>;
    gains: Array<{ /* ... */ }>;
  };
  value_map: {
    products: Array<{ /* ... */ }>;
    painRelievers: Array<{ /* ... */ }>;
    gainCreators: Array<{ /* ... */ }>;
  };
  status: 'draft' | 'complete' | 'archived';
  created_at: string;
  updated_at: string;
}

async function saveUVP(uvp: UVP, userId: string) {
  const { data, error } = await supabase
    .from('uvp_profiles')
    .upsert({
      user_id: userId,
      customer_profile: uvp.customerProfile,
      value_map: uvp.valueMap,
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### Option 2: Normalized Tables (Best for Relational Integrity)

**Best for:**
- Complex queries across entities
- Strong foreign key constraints
- When relationships matter more than flexibility

```sql
-- Parent table
CREATE TABLE uvp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  target_customer TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child tables with foreign keys
CREATE TABLE customer_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uvp_profile_id UUID NOT NULL REFERENCES uvp_profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('functional', 'social', 'emotional')),
  importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uvp_profile_id UUID NOT NULL REFERENCES uvp_profiles(id) ON DELETE CASCADE,
  customer_job_id UUID REFERENCES customer_jobs(id),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction tables for many-to-many relationships
CREATE TABLE pain_relievers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uvp_profile_id UUID NOT NULL REFERENCES uvp_profiles(id) ON DELETE CASCADE,
  customer_pain_id UUID NOT NULL REFERENCES customer_pains(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Save Function:**

```typescript
async function saveUVPNormalized(uvp: UVP, userId: string) {
  // Use transaction for atomicity
  const { data: profile, error: profileError } = await supabase
    .from('uvp_profiles')
    .insert({
      user_id: userId,
      target_customer: uvp.customerProfile.targetCustomer,
      status: 'draft'
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // Insert customer jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('customer_jobs')
    .insert(
      uvp.customerProfile.jobs.map(job => ({
        uvp_profile_id: profile.id,
        description: job.description,
        type: job.type,
        importance: job.importance
      }))
    )
    .select();

  if (jobsError) throw jobsError;

  // Insert pains (referencing jobs)
  const { data: pains, error: painsError } = await supabase
    .from('customer_pains')
    .insert(
      uvp.customerProfile.pains.map(pain => ({
        uvp_profile_id: profile.id,
        customer_job_id: jobs.find(j => j.description === pain.relatedJob)?.id,
        description: pain.description,
        severity: pain.severity
      }))
    )
    .select();

  if (painsError) {
    // Rollback: delete profile and jobs
    await supabase.from('uvp_profiles').delete().eq('id', profile.id);
    throw painsError;
  }

  return profile;
}
```

#### Option 3: Hybrid Approach (Pragmatic)

**Best for:**
- Most real-world applications
- Balance between flexibility and structure

```sql
CREATE TABLE uvp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Structured fields
  target_customer TEXT NOT NULL,
  status TEXT DEFAULT 'draft',

  -- Flexible JSONB for nested arrays
  customer_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_map JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate tables only for entities that need querying/relationships
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uvp_profile_id UUID REFERENCES uvp_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Handling Array vs Single Object

**Common bug:**

```typescript
// Database returns single object
const uvp = { customerJobs: { description: 'foo' } }; // Wrong!

// Should be array
const uvp = { customerJobs: [{ description: 'foo' }] }; // Correct
```

**Solution: Normalize on load**

```typescript
function normalizeUVP(raw: any): UVP {
  return {
    customerProfile: {
      jobs: Array.isArray(raw.customer_profile?.jobs)
        ? raw.customer_profile.jobs
        : raw.customer_profile?.jobs
          ? [raw.customer_profile.jobs]
          : [],
      pains: Array.isArray(raw.customer_profile?.pains)
        ? raw.customer_profile.pains
        : raw.customer_profile?.pains
          ? [raw.customer_profile.pains]
          : [],
      gains: Array.isArray(raw.customer_profile?.gains)
        ? raw.customer_profile.gains
        : raw.customer_profile?.gains
          ? [raw.customer_profile.gains]
          : []
    },
    // ... rest of normalization
  };
}

// Use everywhere
const uvp = normalizeUVP(databaseResult);
```

### Transaction Safety

```typescript
async function saveUVPWithTransaction(uvp: UVP, userId: string) {
  // Supabase doesn't have explicit transactions in client library
  // but you can use PostgreSQL functions
  const { data, error } = await supabase
    .rpc('save_uvp_transaction', {
      p_user_id: userId,
      p_customer_profile: uvp.customerProfile,
      p_value_map: uvp.valueMap
    });

  if (error) throw error;
  return data;
}
```

```sql
-- PostgreSQL function with transaction
CREATE OR REPLACE FUNCTION save_uvp_transaction(
  p_user_id UUID,
  p_customer_profile JSONB,
  p_value_map JSONB
) RETURNS UUID AS $$
DECLARE
  v_uvp_id UUID;
BEGIN
  -- Insert or update
  INSERT INTO uvp_profiles (user_id, customer_profile, value_map)
  VALUES (p_user_id, p_customer_profile, p_value_map)
  ON CONFLICT (user_id)
  DO UPDATE SET
    customer_profile = p_customer_profile,
    value_map = p_value_map,
    updated_at = NOW()
  RETURNING id INTO v_uvp_id;

  RETURN v_uvp_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to save UVP: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

**Sources:**
- [Architectures for managing array data in PostgreSQL - AWS](https://aws.amazon.com/blogs/database/architectures-for-managing-array-data-in-postgresql/)
- [Nested Data Structures in PostgreSQL - DZone](https://dzone.com/articles/nested-data-structures-and-non)
- [PostgreSQL Arrays Guide - Built In](https://builtin.com/data-science/postgresql-in-array)
- [Is it bad design to use arrays in databases? - Stack Overflow](https://stackoverflow.com/questions/20219503/is-it-bad-design-to-use-arrays-within-a-database)

---

## 6. Null Safety in React: Modern Defensive Programming

### The Modern Toolkit (2025)

As of ECMAScript 2020, JavaScript has two powerful operators for null safety:

1. **Optional Chaining (`?.`)** - Safe property access
2. **Nullish Coalescing (`??`)** - Default values for null/undefined

### Optional Chaining (`?.`)

Safely access nested properties without manual null checks:

```typescript
// Old way (tedious)
const city = user && user.address && user.address.city;

// Modern way
const city = user?.address?.city;

// With arrays
const firstJob = uvp?.customerProfile?.jobs?.[0]?.description;

// With function calls
const result = api?.getUserData?.();

// With dynamic properties
const value = obj?.[dynamicKey]?.nestedProp;
```

**How it works:**
- If any part of the chain is `null` or `undefined`, returns `undefined`
- Short-circuits evaluation (doesn't evaluate rest of chain)
- Does NOT treat falsy values (0, '', false) as nullish

### Nullish Coalescing (`??`)

Provide default values for `null` or `undefined`:

```typescript
// Old way (has bugs with falsy values)
const count = value || 0; // Bug: if value is 0, returns 0, not value!

// Modern way (only nullish values use default)
const count = value ?? 0; // Returns value unless it's null/undefined

// The difference
const falsy = 0 || 10; // 10 (wrong!)
const nullish = 0 ?? 10; // 0 (correct!)

const emptyString = '' || 'default'; // 'default' (wrong!)
const nullishString = '' ?? 'default'; // '' (correct!)
```

### Combined Power: `?.` + `??`

The ultimate null-safety combo:

```typescript
// Safe access with sensible defaults
const jobs = uvp?.customerProfile?.jobs ?? [];
const firstName = user?.profile?.name?.first ?? 'Guest';
const subscriptionAmount = user?.subscription?.amount ?? 0;

// React component example
function UVPDisplay({ uvp }: { uvp: UVP | null | undefined }) {
  // Safe access + defaults
  const jobs = uvp?.customerProfile?.jobs ?? [];
  const pains = uvp?.customerProfile?.pains ?? [];
  const targetCustomer = uvp?.customerProfile?.targetCustomer ?? 'Unknown';

  return (
    <div>
      <h2>{targetCustomer}</h2>
      <p>Jobs: {jobs.length}</p>
      <p>Pains: {pains.length}</p>

      {/* Safe array mapping */}
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### React-Specific Patterns

#### Pattern 1: Component Props with Defaults

```typescript
interface UVPCardProps {
  uvp?: UVP | null;
  showActions?: boolean;
  onEdit?: () => void;
}

function UVPCard({
  uvp,
  showActions = true, // Simple default
  onEdit
}: UVPCardProps) {
  // Handle missing data gracefully
  const jobs = uvp?.customerProfile?.jobs ?? [];
  const status = uvp?.status ?? 'draft';

  if (!uvp) {
    return <EmptyState message="No UVP data available" />;
  }

  return (
    <div>
      <h3>Status: {status}</h3>
      {showActions && (
        <button onClick={onEdit?.()}>Edit</button>
      )}
    </div>
  );
}
```

#### Pattern 2: Conditional Rendering

```typescript
function UVPSummary({ uvp }: { uvp: UVP | null }) {
  // Early return for null
  if (!uvp) return null;

  const painCount = uvp.customerProfile?.pains?.length ?? 0;
  const hasHighPriorityPains = (uvp.customerProfile?.pains ?? [])
    .some(pain => pain.severity === 'high');

  return (
    <div>
      <h2>{uvp.customerProfile?.targetCustomer ?? 'Unknown Customer'}</h2>

      {/* Conditional rendering with nullish check */}
      {painCount > 0 && (
        <p>{painCount} pains identified</p>
      )}

      {hasHighPriorityPains && (
        <Alert severity="high">
          High priority pains need attention!
        </Alert>
      )}

      {/* Using optional chaining in JSX */}
      {uvp.valueMap?.products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### Pattern 3: Form Initialization

```typescript
function UVPForm({ existingUVP }: { existingUVP?: UVP }) {
  const [formData, setFormData] = useState({
    targetCustomer: existingUVP?.customerProfile?.targetCustomer ?? '',
    jobs: existingUVP?.customerProfile?.jobs ?? [],
    pains: existingUVP?.customerProfile?.pains ?? [],
    gains: existingUVP?.customerProfile?.gains ?? []
  });

  // Safe form field access
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with fallbacks
    if (!formData.targetCustomer?.trim()) {
      alert('Target customer is required');
      return;
    }

    if ((formData.jobs?.length ?? 0) === 0) {
      alert('Add at least one customer job');
      return;
    }

    saveUVP(formData);
  };
}
```

### Best Practices (2025)

1. **Use `?.` for genuinely optional values**
   ```typescript
   // Good - user might not have profile
   const avatar = user?.profile?.avatar;

   // Bad - if you expect this to exist, validate earlier
   const name = user?.name; // Why is name optional?
   ```

2. **Use `??` instead of `||` for defaults**
   ```typescript
   // Good
   const count = data?.count ?? 0;

   // Bad - fails if count is 0
   const count = data?.count || 0;
   ```

3. **Combine with TypeScript strict mode**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "strictNullChecks": true
     }
   }
   ```

4. **Don't overuse - validate critical data**
   ```typescript
   // Bad - masks errors
   function calculateTotal(items) {
     return items?.reduce?.((a, b) => a + b?.price, 0) ?? 0;
   }

   // Good - fail fast if data is invalid
   function calculateTotal(items: Item[]): number {
     if (!Array.isArray(items)) {
       throw new Error('Items must be an array');
   }
     return items.reduce((a, b) => a + b.price, 0);
   }
   ```

### Compatibility

- **TypeScript**: Requires TypeScript >= 3.7
- **React**: Supported in Create React App >= 3.3.0
- **Browsers**: All modern browsers (2020+)
- **Node.js**: Node >= 14

**Sources:**
- [Optional Chaining and Nullish Coalescing - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [Nullish Coalescing Operator - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [Optional Chaining in React - DEV](https://dev.to/writech/start-using-optional-chaining-and-nullish-coalescing-in-react-269g)
- [Defensive Coding in Javascript - Raphael Ferrand](https://raphaelferrand.com/posts/defensive-coding-optional-chaining-nullish-coalescing/)

---

## 7. Component Loading States: Multi-Step Forms with Async Data

### The Three States Pattern

Every component that loads data should handle three states:

1. **Loading** - Data is being fetched
2. **Error** - Something went wrong
3. **Data** - Success, render the content

### Pattern 1: Custom `useFetch` Hook

```typescript
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(
  url: string,
  options?: RequestInit
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true; // Prevent memory leaks

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (mounted) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState({
            data: null,
            loading: false,
            error: error as Error
          });
        }
      }
    };

    fetchData();

    return () => {
      mounted = false; // Cleanup
    };
  }, [url]);

  return state;
}

// Usage
function UVPLoader({ userId }: { userId: string }) {
  const { data, loading, error } = useFetch<UVP>(
    `/api/uvp/${userId}`
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return <EmptyState />;

  return <UVPDisplay uvp={data} />;
}
```

### Pattern 2: StateHandler Component

Reusable component to handle all three states:

```typescript
interface StateHandlerProps {
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode;
}

function StateHandler({
  loading = false,
  error = null,
  empty = false,
  loadingComponent = <DefaultLoader />,
  errorComponent = <DefaultError />,
  emptyComponent = <DefaultEmpty />,
  children
}: StateHandlerProps) {
  if (loading) return <>{loadingComponent}</>;
  if (error) {
    return (
      <>
        {typeof errorComponent === 'function'
          ? errorComponent(error)
          : errorComponent
        }
      </>
    );
  }
  if (empty) return <>{emptyComponent}</>;

  return <>{children}</>;
}

// Usage
function UVPList() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: []
  });

  useEffect(() => {
    loadUVPs()
      .then(data => setState({ loading: false, error: null, data }))
      .catch(error => setState({ loading: false, error, data: [] }));
  }, []);

  return (
    <StateHandler
      loading={state.loading}
      error={state.error}
      empty={state.data.length === 0}
      loadingComponent={<Skeleton count={3} />}
      errorComponent={<Alert severity="error">{state.error?.message}</Alert>}
      emptyComponent={<EmptyState action={<CreateUVPButton />} />}
    >
      {state.data.map(uvp => (
        <UVPCard key={uvp.id} uvp={uvp} />
      ))}
    </StateHandler>
  );
}
```

### Pattern 3: React Query (Recommended for Production)

React Query handles caching, retries, and state management automatically:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch hook
function useUVP(userId: string) {
  return useQuery({
    queryKey: ['uvp', userId],
    queryFn: async () => {
      const response = await fetch(`/api/uvp/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch UVP');
      return response.json() as Promise<UVP>;
    },
    // Automatic retries on failure
    retry: 3,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000
  });
}

// Mutation hook
function useSaveUVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uvp: UVP) => {
      const response = await fetch('/api/uvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uvp)
      });
      if (!response.ok) throw new Error('Failed to save UVP');
      return response.json();
    },
    // Invalidate cache on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uvp'] });
    }
  });
}

// Usage
function UVPEditor({ userId }: { userId: string }) {
  const { data: uvp, isLoading, error } = useUVP(userId);
  const saveUVP = useSaveUVP();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  const handleSave = async (updatedUVP: UVP) => {
    try {
      await saveUVP.mutateAsync(updatedUVP);
      toast.success('UVP saved successfully');
    } catch (error) {
      toast.error('Failed to save UVP');
    }
  };

  return (
    <UVPForm
      initialData={uvp}
      onSubmit={handleSave}
      isSubmitting={saveUVP.isPending}
    />
  );
}
```

### Pattern 4: Multi-Step Form Loading States

Each step may need to load data independently:

```typescript
function MultiStepUVPForm({ userId }: { userId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UVP>>({});

  // Load existing progress
  const { data: savedProgress, isLoading } = useQuery({
    queryKey: ['uvp-progress', userId],
    queryFn: async () => {
      const response = await fetch(`/api/uvp/progress/${userId}`);
      if (response.status === 404) return null; // No saved progress
      if (!response.ok) throw new Error('Failed to load progress');
      return response.json();
    }
  });

  // Auto-save on data change
  const autoSave = useMutation({
    mutationFn: async (data: Partial<UVP>) => {
      await fetch(`/api/uvp/progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: currentStep, data })
      });
    }
  });

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        autoSave.mutate(formData);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Resume from saved progress
  useEffect(() => {
    if (savedProgress) {
      setCurrentStep(savedProgress.step);
      setFormData(savedProgress.data);
    }
  }, [savedProgress]);

  const steps = [
    <CustomerJobsStep
      data={formData.customerProfile?.jobs}
      onChange={(jobs) => setFormData(prev => ({
        ...prev,
        customerProfile: {
          ...prev.customerProfile,
          jobs
        }
      }))}
      isLoading={autoSave.isPending}
    />,
    <CustomerPainsStep
      data={formData.customerProfile?.pains}
      jobs={formData.customerProfile?.jobs}
      onChange={(pains) => setFormData(prev => ({
        ...prev,
        customerProfile: {
          ...prev.customerProfile,
          pains
        }
      }))}
      isLoading={autoSave.isPending}
    />
    // ... more steps
  ];

  return (
    <div>
      <StepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
      />

      {/* Auto-save indicator */}
      {autoSave.isPending && (
        <div className="autosave-indicator">
          <Spinner size="sm" /> Saving...
        </div>
      )}

      {autoSave.isSuccess && (
        <div className="autosave-indicator success">
          ✓ Saved
        </div>
      )}

      {autoSave.isError && (
        <div className="autosave-indicator error">
          ⚠ Failed to save
        </div>
      )}

      {steps[currentStep]}

      <StepNavigation
        onNext={async () => {
          // Validate current step
          const isValid = await validateStep(currentStep, formData);
          if (isValid) {
            setCurrentStep(prev => prev + 1);
          }
        }}
        onPrevious={() => setCurrentStep(prev => prev - 1)}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === steps.length - 1}
      />
    </div>
  );
}
```

### Pattern 5: Form Submission States

```typescript
function UVPSubmitButton() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty, isValid, errors }
  } = useForm<UVP>();

  const onSubmit = async (data: UVP) => {
    try {
      await saveUVP(data);
      toast.success('UVP saved successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}

      <button
        type="submit"
        disabled={isSubmitting || !isDirty || !isValid}
        className={isSubmitting ? 'loading' : ''}
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            Saving...
          </>
        ) : (
          'Save UVP'
        )}
      </button>

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="error-summary">
          <p>Please fix the following errors:</p>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
```

### UX Best Practices

1. **Show skeleton loaders** instead of spinners for better perceived performance
2. **Disable form during submission** to prevent duplicate submissions
3. **Auto-save progress** every few seconds
4. **Show error messages** with recovery options
5. **Preserve form data** on navigation/refresh
6. **Optimistic updates** for better UX

```typescript
// Optimistic update example
function useOptimisticUVP(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUVP,
    onMutate: async (newUVP) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['uvp', userId] });

      // Save previous value
      const previous = queryClient.getQueryData(['uvp', userId]);

      // Optimistically update
      queryClient.setQueryData(['uvp', userId], newUVP);

      return { previous };
    },
    onError: (err, newUVP, context) => {
      // Rollback on error
      queryClient.setQueryData(['uvp', userId], context?.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['uvp', userId] });
    }
  });
}
```

**Sources:**
- [How to manage component states in React - Stack Overflow](https://stackoverflow.com/questions/68065096/how-to-manage-component-states-loading-error-data-in-react)
- [Handling Loading and Error State - Medium](https://medium.com/codex/handling-loading-and-error-state-in-react-application-and-clean-state-mess-b3cbf28029fd)
- [UI best practices for loading, error, empty states - LogRocket](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/)
- [Handling Form Loading States in Next.js/React - Medium](https://medium.com/@ryangan.dev/handling-form-loading-states-in-next-js-react-2024-33da2dae11ce)

---

## Summary: Solving UVP Save Issues

### Root Causes Identified

1. **Undefined Property Access** - Components crash when accessing nested properties without validation
2. **State Management Chaos** - Multi-step forms lose data during transitions
3. **Schema Mismatch** - Database structure doesn't match frontend expectations (arrays vs objects)
4. **Missing Validation** - Runtime data doesn't match TypeScript types
5. **Poor Error Handling** - No error boundaries to catch crashes
6. **Async State Issues** - Loading/error states not handled properly

### Recommended Solution Stack

```typescript
// 1. Error Boundaries around critical components
<ErrorBoundary FallbackComponent={UVPErrorFallback}>
  <UVPOnboardingFlow />
</ErrorBoundary>

// 2. Zod for runtime validation
const UVPSchema = z.object({ /* ... */ });
const validatedData = UVPSchema.parse(apiResponse);

// 3. React Query for state management
const { data, isLoading, error } = useUVP(userId);

// 4. Optional chaining + nullish coalescing everywhere
const jobs = uvp?.customerProfile?.jobs ?? [];

// 5. JSONB in PostgreSQL for flexible nested data
CREATE TABLE uvp_profiles (
  customer_profile JSONB NOT NULL,
  value_map JSONB NOT NULL
);

// 6. Normalize data on load
function normalizeUVP(raw: any): UVP {
  return {
    customerProfile: {
      jobs: ensureArray(raw.customer_profile?.jobs),
      pains: ensureArray(raw.customer_profile?.pains),
      gains: ensureArray(raw.customer_profile?.gains)
    },
    // ...
  };
}

// Helper
function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}
```

### Implementation Checklist

- [ ] Add error boundaries around UVP flow components
- [ ] Implement Zod schemas for all UVP data structures
- [ ] Use React Query for data fetching and mutations
- [ ] Replace all nested property access with optional chaining
- [ ] Add nullish coalescing for all default values
- [ ] Normalize array/object data on load from database
- [ ] Implement auto-save with debouncing
- [ ] Add loading states to all async operations
- [ ] Create user-friendly error fallbacks
- [ ] Add data migration to fix existing malformed data
- [ ] Write tests for error scenarios
- [ ] Add Sentry/error logging for production monitoring

---

**Research completed:** 2025-12-04
**Document version:** 1.0
**Recommended for:** React + TypeScript + PostgreSQL applications with complex nested data flows
