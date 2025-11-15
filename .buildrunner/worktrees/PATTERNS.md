# Common Development Patterns - Reference Guide

**Use these patterns in all features to ensure consistency and quality**

---

## Error Handling Patterns

### API Call Pattern (with retry + fallback)
```typescript
async function callAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number
    fallbackValue?: T
    onError?: (error: Error) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, fallbackValue, onError } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      if (attempt === maxRetries) {
        onError?.(error as Error)
        if (fallbackValue !== undefined) return fallbackValue
        throw new Error(`API call failed after ${maxRetries} attempts: ${error}`)
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  throw new Error('Unreachable')
}
```

### Parallel API Calls (race condition safe)
```typescript
async function parallelAPICalls<T>(
  calls: Array<() => Promise<T>>,
  options: {
    timeout?: number
    allowPartialFailure?: boolean
  } = {}
): Promise<T[]> {
  const { timeout = 30000, allowPartialFailure = true } = options

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeout)
  )

  try {
    if (allowPartialFailure) {
      const results = await Promise.allSettled(
        calls.map(call => Promise.race([call(), timeoutPromise]))
      )
      return results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<T>).value)
    } else {
      return await Promise.all(
        calls.map(call => Promise.race([call(), timeoutPromise]))
      )
    }
  } catch (error) {
    console.error('Parallel API calls failed:', error)
    throw error
  }
}
```

### Database Error Handler
```typescript
async function safeDBOperation<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    // Handle specific Postgres errors
    if (error.code === '23505') {
      throw new Error(`${errorContext}: Duplicate entry`)
    } else if (error.code === '23503') {
      throw new Error(`${errorContext}: Foreign key constraint violation`)
    } else if (error.code === '42P01') {
      throw new Error(`${errorContext}: Table does not exist`)
    }

    console.error(`Database error in ${errorContext}:`, error)
    throw new Error(`${errorContext}: Database operation failed`)
  }
}
```

---

## Type Validation with Zod

### Install Zod
```bash
npm install zod
```

### Basic Schema Pattern
```typescript
import { z } from 'zod'

// Define schema
const BusinessProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string()
  })
})

// Use for validation
function validateBusinessProfile(data: unknown) {
  try {
    return BusinessProfileSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// Use for type inference
type BusinessProfile = z.infer<typeof BusinessProfileSchema>
```

### API Response Validation
```typescript
const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
})

async function validateAPIResponse<T>(
  response: unknown,
  dataSchema: z.ZodSchema<T>
): Promise<T> {
  const validated = APIResponseSchema.parse(response)

  if (!validated.success) {
    throw new Error(validated.error || 'API call failed')
  }

  return dataSchema.parse(validated.data)
}
```

---

## Performance Patterns

### Debounce for User Input
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Usage
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query)
  setResults(results)
}, 500)
```

### Throttle for API Calls
```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

### Pagination Pattern
```typescript
interface PaginationParams {
  page: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

async function paginatedQuery<T>(
  table: string,
  params: PaginationParams,
  filters?: Record<string, any>
): Promise<{ data: T[], total: number, hasMore: boolean }> {
  const { page, pageSize, orderBy = 'created_at', orderDirection = 'desc' } = params
  const offset = (page - 1) * pageSize

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + pageSize - 1)

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  const { data, count, error } = await query

  if (error) throw error

  return {
    data: data as T[],
    total: count || 0,
    hasMore: (offset + pageSize) < (count || 0)
  }
}
```

### Caching Pattern
```typescript
class SimpleCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()

  set(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }
}

// Usage
const industryCache = new SimpleCache<IndustryProfile>()

async function getIndustryProfile(naics: string): Promise<IndustryProfile> {
  const cached = industryCache.get(naics)
  if (cached) return cached

  const profile = await fetchIndustryProfile(naics)
  industryCache.set(naics, profile, 7 * 24 * 60 * 60) // 7 days
  return profile
}
```

---

## React Component Patterns

### Loading States
```typescript
interface LoadingState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): LoadingState<T> {
  const [state, setState] = useState<LoadingState<T>>({
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let cancelled = false

    setState(s => ({ ...s, loading: true, error: null }))

    fetchFn()
      .then(data => {
        if (!cancelled) {
          setState({ data, loading: false, error: null })
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ data: null, loading: false, error })
        }
      })

    return () => { cancelled = true }
  }, deps)

  return state
}
```

### Form Validation
```typescript
interface FormErrors {
  [key: string]: string | undefined
}

function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) {
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (data: T): boolean => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach(err => {
          newErrors[err.path.join('.')] = err.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  return { errors, validate }
}
```

---

## Security Patterns

### Input Sanitization
```typescript
import DOMPurify from 'dompurify'

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  })
}

function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}
```

### Rate Limiting (Client-side)
```typescript
class RateLimiter {
  private requests: number[] = []

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.requests.length < this.maxRequests
  }

  recordRequest(): void {
    this.requests.push(Date.now())
  }

  async throttledRequest<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    this.recordRequest()
    return await requestFn()
  }
}

// Usage
const apiLimiter = new RateLimiter(10, 60000) // 10 requests per minute
```

---

## Testing Patterns

### Unit Test Template
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('ServiceName', () => {
  it('should handle success case', async () => {
    const service = new ServiceName()
    const result = await service.method()
    expect(result).toBeDefined()
  })

  it('should handle error case', async () => {
    const service = new ServiceName()
    await expect(service.method()).rejects.toThrow()
  })

  it('should handle edge case: null input', async () => {
    const service = new ServiceName()
    const result = await service.method(null)
    expect(result).toBeNull()
  })
})
```

### Mock API Responses
```typescript
import { vi } from 'vitest'

const mockAPIResponse = {
  success: true,
  data: { id: '123', name: 'Test' }
}

vi.mock('./api-service', () => ({
  fetchData: vi.fn().mockResolvedValue(mockAPIResponse)
}))
```

---

## Common Edge Cases to Handle

### User Input
- Empty string
- Null/undefined
- Extremely long input (>10,000 chars)
- Special characters (emoji, unicode)
- SQL injection attempts
- XSS attempts

### API Responses
- Null response
- Empty array
- Malformed JSON
- Rate limit errors (429)
- Server errors (500)
- Timeout
- Network disconnection

### Database Operations
- Duplicate entries
- Foreign key violations
- Missing references
- Concurrent modifications
- Transaction rollbacks

### File Operations
- File too large (>100MB)
- Invalid file type
- Corrupted file
- Storage quota exceeded
- Upload failure mid-stream

---

## Debugging Helpers

### Detailed Logging
```typescript
function log(context: string, data: any, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] [${level.toUpperCase()}] [${context}]`

  if (level === 'error') {
    console.error(message, data)
  } else if (level === 'warn') {
    console.warn(message, data)
  } else {
    console.log(message, data)
  }
}
```

### Performance Timing
```typescript
async function timeOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - start
    console.log(`${name} completed in ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`${name} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}
```

---

**Use these patterns consistently across all features for maintainable, robust code.**
