# BR3 Browser Logger

Captures all browser console output and network requests for Claude debugging.

## Setup for Vite Projects

### 1. Add the Vite plugin to your vite.config.ts:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { brLoggerPlugin } from './.buildrunner/components/vite-br-logger-plugin'

export default defineConfig({
  plugins: [react(), brLoggerPlugin()],
})
```

### 2. Add the logger component to your App.tsx:

```tsx
import { BRLogger } from './.buildrunner/components/br-logger'

function App() {
  return (
    <>
      <BRLogger />
      {/* rest of your app */}
    </>
  )
}
```

### 3. Use br dbg commands to read logs:

```bash
br dbg browser    # Full browser session log
br dbg network    # Network requests/responses
br dbg console    # Console output only
br dbg session    # Current session activity
br dbg clear --browser  # Clear browser logs
```

## Setup for Next.js Projects

### 1. Copy the API route:

```bash
mkdir -p app/api/br-logger
cp .buildrunner/components/br-logger-api-route.ts app/api/br-logger/route.ts
```

### 2. Add to layout.tsx:

```tsx
import { BRLogger } from '@/.buildrunner/components/br-logger'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BRLogger />
      </body>
    </html>
  )
}
```

## What gets logged

- All console.log/warn/error/info/debug calls
- All fetch network requests with request/response bodies
- Unhandled errors and promise rejections
- Session IDs for tracking page loads

## Log location

Logs are written to `.buildrunner/browser.log`

## Manual log export (fallback)

If the API endpoint isn't available, logs are stored in sessionStorage.
Open browser console and run:

```javascript
window.br3ExportLogs()
```

## Notes

- Only active in development mode
- Logs rotate automatically at 1MB (keeps 3 rotations)
