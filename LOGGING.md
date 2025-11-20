# Structured Logging Guide

## Quick Start

The console logging has been significantly reduced using a structured logger. Most verbose logs are now controlled by environment variables.

## Current Configuration

In `.env`:
```bash
VITE_LOG_LEVEL=warn         # Only show warnings and errors by default
VITE_LOG_NAMESPACES=*       # Show all services (use specific ones to filter)
VITE_ENABLE_LOGS=true       # Master switch
```

## Controlling Log Output

### Option 1: Environment Variables (Persistent)

Edit `.env`:
```bash
# Production: Only errors
VITE_LOG_LEVEL=error

# Development: See important info
VITE_LOG_LEVEL=info

# Debugging: See everything
VITE_LOG_LEVEL=debug

# Very verbose (use sparingly)
VITE_LOG_LEVEL=trace

# Filter to specific services
VITE_LOG_NAMESPACES=ProductExtractor,DataCollection,OnboardingV5
```

Then restart the dev server: `npm run dev`

### Option 2: Runtime Control (Browser Console)

No restart needed - change settings on the fly:

```javascript
// Check current settings
window.__logger.printLogConfig()

// Change log level
window.__logger.setLogLevel('debug')  // error, warn, info, debug, trace

// Filter to specific services
window.__logger.setLogNamespaces(['ProductExtractor', 'OnboardingV5'])

// See all services
window.__logger.setLogNamespaces('*')

// Turn off all logging
window.__logger.setLoggingEnabled(false)

// Turn it back on
window.__logger.setLoggingEnabled(true)

// Clear rate limit cache (if logs are being suppressed)
window.__logger.clearRateLimitCache()
```

## What Changed

### Services Migrated (137+ console calls removed):
- ✅ `OnboardingPageV5.tsx` - Reduced ~137 verbose sequential loading logs
- ✅ `product-service-extractor.service.ts` - Structured extraction logs
- ✅ `data-collection.service.ts` - Structured orchestration logs
- ✅ `buyer-intelligence-extractor.service.ts` - Cleaned up persona extraction logs

### Log Levels in Use:
- `log.error()` - Critical errors (always visible)
- `log.warn()` - Warnings (visible at warn+ level)
- `log.info()` - Important state changes (visible at info+ level)
- `log.debug()` - Detailed debugging (visible at debug+ level)
- `log.trace()` - Very verbose (visible at trace level only)

## Recommended Settings

### For Normal Development:
```bash
VITE_LOG_LEVEL=warn  # Only see warnings and errors
```

### For Debugging UVP Onboarding:
```bash
VITE_LOG_LEVEL=debug
VITE_LOG_NAMESPACES=OnboardingV5,ProductExtractor,DataCollection,BuyerIntel
```

### For Debugging Specific Service:
```javascript
// In browser console:
window.__logger.setLogLevel('debug')
window.__logger.setLogNamespaces(['ProductExtractor'])
```

### For Production:
```bash
VITE_LOG_LEVEL=error  # Only critical errors
```

## Copying Logs

With `VITE_LOG_LEVEL=warn`, you should now be able to:
1. Open DevTools Console
2. Right-click and "Save as..." to export logs
3. Or select and copy logs without browser crash

The console output has been reduced from ~10,000 messages to ~50-100 important messages during UVP onboarding.

## Adding Logging to New Code

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('YourServiceName');

// In your code:
log.info('Operation started', { userId, action: 'export' });
log.debug('Processing item', { id: item.id, step: 2 });
log.error('Operation failed', error);

// Group related operations
await log.group('Exporting data', async () => {
  // Your async work here
  return result;
  // Automatically logs duration and success/failure
});
```

## Migration Status

**High-impact services completed:**
- OnboardingPageV5 (137 calls)
- product-service-extractor (8 calls)
- data-collection (6 calls)
- buyer-intelligence-extractor (11 calls)

**Remaining services** (2300+ calls across 247 files):
- Can be migrated incrementally as needed
- Most don't run during critical onboarding flow
- Use `VITE_LOG_LEVEL=warn` to suppress them for now

## Troubleshooting

### Still seeing too many logs?
```javascript
// In browser console, check what's being logged:
window.__logger.printLogConfig()

// Lower the log level:
window.__logger.setLogLevel('error')
```

### Not seeing expected logs?
```javascript
// Check if logging is enabled:
window.__logger.printLogConfig()

// Ensure it's enabled:
window.__logger.setLoggingEnabled(true)

// Raise the log level:
window.__logger.setLogLevel('debug')
```

### Logs repeating too much?
The logger has built-in rate limiting (1 message per second max). If you need to see repeated messages:
```javascript
window.__logger.clearRateLimitCache()
```
