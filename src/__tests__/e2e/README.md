# End-to-End Tests

Comprehensive E2E tests for Synapse MVP using Playwright.

## Test Coverage

### 1. Onboarding Flow (`onboarding.spec.ts`)
- Complete onboarding journey (URL → Insights → Suggestions)
- Multi-select functionality for services, customers, value props
- Input validation (URL, industry selection)
- Back navigation
- Loading states and error handling
- Custom data entry

### 2. Campaign Generation (`campaign-generation.spec.ts`)
- Campaign generation from SmartSuggestions
- Quick post generation
- Custom builder navigation
- Campaign preview and editing
- Content Mixer flow

### 3. Publishing (`publishing.spec.ts`)
- Campaign scheduling
- Single post scheduling
- Publishing queue management
- Platform-specific scheduling (respecting limits)
- Error handling and retry
- Publishing analytics

## Running Tests

**IMPORTANT:** This worktree is configured to run on port 3001 to avoid conflicts with other worktrees.

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test onboarding.spec.ts

# Run specific test
npx playwright test -g "should complete full onboarding flow"
```

### Port Configuration

- **Dev Server Port:** 3001 (configured in `vite.config.ts`)
- **Playwright baseURL:** http://localhost:3001
- This prevents conflicts when running multiple worktrees simultaneously

## Test Strategy

### Critical Path Coverage (>80%)
- ✅ Onboarding flow start to finish
- ✅ Campaign generation (suggested + custom)
- ✅ Publishing and scheduling
- ✅ Error handling

### What's NOT Tested (Out of Scope for MVP)
- Multi-user collaboration
- Payment processing
- Advanced analytics
- Video content generation
- A/B testing

## Writing New Tests

### Best Practices

1. **Use data-testid attributes** for reliable selectors
```typescript
await page.click('[data-testid="campaign-type-authority"]');
```

2. **Add appropriate timeouts** for API-dependent actions
```typescript
// UVP extraction can take up to 90 seconds
await expect(page.getByText('Confirm Your Business Details'))
  .toBeVisible({ timeout: 90000 });
```

3. **Handle conditional elements** gracefully
```typescript
if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
  // Element exists, proceed
}
```

4. **Use helper functions** for common flows
```typescript
async function navigateToSuggestions(page) {
  // Reusable navigation logic
}
```

## Test Data

Tests use:
- Mock URL: `www.example.com`
- Mock industry: Restaurant (for consistent test data)
- Real APIs are called (no mocking by default)

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries (2x on CI)
- Sequential execution (to avoid resource conflicts)
- Screenshots on failure
- Video recording on failure

See `playwright.config.ts` for full configuration.

## Debugging Failed Tests

1. **Check screenshots** in `test-results/`
2. **Watch videos** of failed tests
3. **Use debug mode**:
```bash
npm run test:e2e:debug
```
4. **Check console logs** (Playwright captures them)
5. **Verify API responses** in Network tab (when using --headed)

## Known Limitations

1. **AI generation timing** - Content generation may take 60-120 seconds
2. **API rate limits** - Running all tests may hit API limits
3. **Test isolation** - Tests assume clean state (may need database resets)
4. **SocialPilot sandbox** - Publishing tests use sandbox mode

## Maintenance

- **Update selectors** when UI changes
- **Add new tests** for new features
- **Keep timeouts reasonable** (balance speed vs. reliability)
- **Run tests locally** before committing

---

**Status:** ✅ Complete - 3 test suites, >20 tests
**Coverage:** >80% of critical user paths
**Last Updated:** November 17, 2025
