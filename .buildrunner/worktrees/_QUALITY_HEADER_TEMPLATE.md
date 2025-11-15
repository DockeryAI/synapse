# [FEATURE NAME] - Code Quality Standards

---

## 🎯 CRITICAL: Read Before Implementation

**This feature requires enterprise-grade code quality. Follow these standards strictly.**

### Required Reading (IN ORDER):
1. ✅ `.buildrunner/worktrees/PATTERNS.md` - Reusable code patterns
2. ✅ `.buildrunner/worktrees/IMPLEMENTATION_STANDARDS.md` - Universal standards
3. ✅ This file - Feature-specific requirements

**DO NOT start coding until you've read all three files above.**

---

## Quality Checklist for This Feature

**Every function in this feature MUST have:**

- [ ] **Zod Schema** for all data types
- [ ] **Retry Logic** using `callAPIWithRetry()` from PATTERNS.md
- [ ] **Error Logging** using `log()` from PATTERNS.md
- [ ] **Input Validation** (null, empty, length checks)
- [ ] **Input Sanitization** (remove dangerous characters)
- [ ] **Timeout Handling** (5-30 second timeouts on all API calls)
- [ ] **Fallback Values** (never return undefined, always null/[])
- [ ] **Type Safety** (no `any` without Zod validation)
- [ ] **Performance Monitoring** using `timeOperation()`
- [ ] **Caching** where appropriate (7-day default for static data)

---

## Feature-Specific Requirements

[TO BE FILLED IN FOR EACH FEATURE]

### Critical APIs to Integrate:
- API 1: [Name] - Retry: 3x, Timeout: 10s, Cache: 7d
- API 2: [Name] - Retry: 3x, Timeout: 10s, Cache: 1d

### Critical Edge Cases:
1. Case 1
2. Case 2
3. Case 3

### Performance Requirements:
- Total execution time: <X seconds
- Cache hit rate: >Y%
- Rate limit: Z per minute

### Security Requirements:
- Sanitize inputs: [list fields]
- Validate URLs: [list fields]
- Rate limiting: [specify limits]

---

## Testing Requirements

**Minimum test coverage for this feature:**

```typescript
describe('[Feature Name]', () => {
  it('handles success case')
  it('handles API failure gracefully')
  it('handles null/empty inputs')
  it('validates data with Zod')
  it('uses cache for repeated calls')
  it('respects rate limits')
  it('completes within performance budget')
  it('sanitizes malicious inputs')
})
```

**Test with real data** before marking complete.

---

## Completion Criteria

- [ ] All Zod schemas defined
- [ ] All API calls have retry logic
- [ ] All inputs validated and sanitized
- [ ] All edge cases handled
- [ ] All functions use patterns from PATTERNS.md
- [ ] Caching implemented
- [ ] Rate limiting active
- [ ] Performance requirements met
- [ ] Security requirements met
- [ ] Tests passing (8+ test cases)
- [ ] No TypeScript errors
- [ ] Tested with real data

---

[REST OF FEATURE-SPECIFIC DOCUMENTATION BELOW]

---
