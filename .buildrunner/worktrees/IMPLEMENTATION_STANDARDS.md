# Implementation Standards for All Worktree Tasks

**READ THIS FIRST before implementing any feature.**

---

## Required Imports for All Services

```typescript
import { z } from 'zod'
import { callAPIWithRetry, parallelAPICalls } from '@/lib/api-helpers'
import { SimpleCache } from '@/lib/cache'
import { RateLimiter } from '@/lib/rate-limiter'
import { log, timeOperation } from '@/lib/debug-helpers'
import { sanitizeHTML, sanitizeUserInput } from '@/lib/security'
```

---

## Universal Implementation Checklist

**Every service function MUST have:**

1. ✅ **Zod Schema** for all data structures
2. ✅ **Retry Logic** using `callAPIWithRetry()` from PATTERNS.md
3. ✅ **Error Logging** using `log()` from PATTERNS.md
4. ✅ **Input Validation** (check for null, empty, too long)
5. ✅ **Input Sanitization** (remove HTML, special chars)
6. ✅ **Timeout Handling** (set reasonable timeouts: 5-30s)
7. ✅ **Fallback Values** (null, [], {}) on failure
8. ✅ **Type Safety** (TypeScript strict mode, no `any` without validation)
9. ✅ **Performance Monitoring** using `timeOperation()`
10. ✅ **Caching** where appropriate (SimpleCache with TTL)

---

## Standard API Call Pattern

**Use this pattern for EVERY API call:**

```typescript
async function callExternalAPI(param: string): Promise<DataType | null> {
  return await callAPIWithRetry(
    async () => {
      // 1. Validate inputs
      if (!param || param.trim().length === 0) {
        throw new Error('Parameter is required')
      }

      // 2. Sanitize inputs
      const sanitized = sanitizeUserInput(param)

      // 3. Make API call with timeout
      const response = await axios.post(
        'https://api.example.com/endpoint',
        { query: sanitized },
        {
          headers: { 'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}` },
          timeout: 10000 // 10 seconds
        }
      )

      // 4. Validate response structure
      if (!response.data) {
        return null
      }

      // 5. Parse and validate with Zod
      const data = DataTypeSchema.parse(response.data)

      return data
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('API Call Name', error, 'error')
    }
  )
}
```

---

## Standard Zod Schema Pattern

**Define schemas for all data types:**

```typescript
const DataTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  count: z.number().int().min(0),
  status: z.enum(['active', 'inactive', 'pending']),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime()
})

type DataType = z.infer<typeof DataTypeSchema>
```

**For API responses:**
```typescript
const APIResponseSchema = z.object({
  success: z.boolean(),
  data: DataTypeSchema.nullable(),
  error: z.string().optional()
})
```

---

## Standard Error Handling

**Three levels of error handling:**

1. **Function Level** (try/catch):
```typescript
async function myFunction() {
  try {
    const result = await riskyOperation()
    return result
  } catch (error) {
    log('myFunction', error, 'error')
    throw new Error(`myFunction failed: ${error}`)
  }
}
```

2. **API Level** (retry logic):
```typescript
const result = await callAPIWithRetry(apiCall, {
  maxRetries: 3,
  fallbackValue: null,
  onError: (error) => log('API Name', error, 'error')
})
```

3. **Component Level** (user-friendly):
```typescript
try {
  await myFunction()
} catch (error) {
  toast.error('Something went wrong. Please try again.')
  log('Component', error, 'error')
}
```

---

## Standard Edge Cases to Handle

**Every function MUST handle:**

1. **Null/undefined inputs:** Return fallback value
2. **Empty strings:** Return fallback value or prompt user
3. **Extremely long inputs (>10,000 chars):** Truncate or reject
4. **Special characters/emojis:** Sanitize before processing
5. **Invalid URLs:** Validate format, throw clear error
6. **API rate limits (429):** Exponential backoff, user message
7. **Server errors (500):** Retry with backoff
8. **Timeouts:** Cancel operation, return partial data
9. **Network disconnection:** Retry, then fail gracefully
10. **Malformed JSON:** Catch parse errors, log and return null

---

## Standard Performance Patterns

**Required for all features:**

### 1. Caching
```typescript
const cache = new SimpleCache<DataType>()

async function getData(key: string): Promise<DataType> {
  const cached = cache.get(key)
  if (cached) return cached

  const fresh = await fetchData(key)
  cache.set(key, fresh, 7 * 24 * 60 * 60) // 7 days
  return fresh
}
```

### 2. Debouncing (User Input)
```typescript
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query)
  setResults(results)
}, 500)
```

### 3. Rate Limiting
```typescript
const limiter = new RateLimiter(10, 60000) // 10 per minute

if (!limiter.canMakeRequest()) {
  throw new Error('Rate limit exceeded')
}
limiter.recordRequest()
```

### 4. Performance Monitoring
```typescript
const result = await timeOperation('Operation Name', async () => {
  return await expensiveOperation()
})
// Automatically logs duration
```

---

## Standard Security Patterns

**Required security measures:**

### 1. Input Sanitization
```typescript
function sanitize(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s@.-]/g, '') // Remove special chars
    .substring(0, 1000) // Limit length
}
```

### 2. URL Validation
```typescript
function validateURL(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}
```

### 3. SQL Injection Prevention
```typescript
// ALWAYS use parameterized queries
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('column', userInput) // Supabase handles escaping
```

### 4. XSS Prevention
```typescript
import DOMPurify from 'dompurify'

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href', 'target']
  })
}
```

---

## Standard Testing Pattern

**Every feature needs these tests:**

```typescript
describe('FeatureName', () => {
  // Success case
  it('handles success case', async () => {
    const result = await featureFunction(validInput)
    expect(result).toBeDefined()
    expect(result.field).toBe('expected value')
  })

  // Error case
  it('handles API failure', async () => {
    // Mock API failure
    await expect(featureFunction(input)).rejects.toThrow()
  })

  // Edge cases
  it('handles null input', async () => {
    const result = await featureFunction(null)
    expect(result).toBeNull()
  })

  it('handles empty string', async () => {
    const result = await featureFunction('')
    expect(result).toBeNull()
  })

  it('validates with Zod', () => {
    const invalid = { field: 'wrong type' }
    expect(() => Schema.parse(invalid)).toThrow()
  })

  // Performance
  it('completes in reasonable time', async () => {
    const start = Date.now()
    await featureFunction(input)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000) // 5 seconds
  })

  // Caching
  it('uses cache for repeated calls', async () => {
    const result1 = await featureFunction('key')
    const result2 = await featureFunction('key')
    expect(result2).toBe(result1) // Same instance
  })
})
```

---

## Database Operations Standard

**All database operations MUST:**

1. Use RLS policies (defined in migration)
2. Handle errors explicitly
3. Return typed data
4. Log failures
5. Use transactions for multi-step operations

```typescript
async function saveData(data: DataType, userId: string) {
  try {
    const { data: saved, error } = await supabase
      .from('table_name')
      .insert({
        ...data,
        user_id: userId,
        created_at: new Date()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return saved
  } catch (error) {
    log('saveData', error, 'error')
    throw error
  }
}
```

---

## React Component Standard

**All components MUST:**

1. Use TypeScript with explicit types
2. Handle loading states
3. Handle error states
4. Clean up on unmount
5. Use proper key props in lists

```typescript
interface ComponentProps {
  data: DataType
  onSave: (data: DataType) => void
}

export function Component({ data, onSave }: ComponentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const result = await fetchData()
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load data')
          log('Component', err, 'error')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => { cancelled = true }
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return <div>{/* component content */}</div>
}
```

---

## File Organization Standard

**Every feature should create:**

```
src/
├── services/
│   ├── feature-name.service.ts       # Core logic
│   ├── feature-name-helper.ts        # Helper functions
│   └── __tests__/
│       └── feature-name.test.ts      # Unit tests
├── components/
│   ├── feature-name/
│   │   ├── MainComponent.tsx
│   │   ├── SubComponent.tsx
│   │   └── index.ts                  # Export all
├── types/
│   └── feature-name.types.ts         # Type definitions
└── lib/
    ├── api-helpers.ts                # Shared patterns
    ├── cache.ts
    ├── rate-limiter.ts
    ├── security.ts
    └── debug-helpers.ts
```

---

## When to Use What

**Caching:** Use for data that doesn't change often (>1 hour)
- Industry profiles: 7 days
- Location data: 30 days
- Intelligence reports: 7 days
- API responses: 1 hour

**Rate Limiting:** Use for expensive operations
- Intelligence gathering: 10 per minute
- AI content generation: 20 per minute
- API calls: Provider limits - 10%

**Debouncing:** Use for user input
- Search: 500ms
- Form validation: 300ms
- Auto-save: 1000ms

**Retry Logic:** Use for all external API calls
- Max retries: 3
- Backoff: Exponential (2^attempt seconds)
- Timeout: 5-30 seconds depending on operation

---

**✅ CHECKPOINT: Before implementing, verify you have:**
- [ ] Read PATTERNS.md
- [ ] Read this IMPLEMENTATION_STANDARDS.md
- [ ] Understood the feature requirements
- [ ] Planned your Zod schemas
- [ ] Identified all API calls needed
- [ ] Planned error handling strategy
- [ ] Identified edge cases
- [ ] Planned testing approach

**Only proceed when all checkboxes are complete.**
