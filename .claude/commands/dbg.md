---
description: Debug browser errors - reads full browser.log and analyzes issues
allowed-tools: Read, Bash, Grep, Glob
---

# Browser Debug Analysis

You are debugging a frontend issue. Read and analyze the browser logs.

---

## Step 1: Check Browser Log Status

```bash
br dbg status
```

If rotation is recommended, run:

```bash
br dbg rotate
```

---

## Step 2: Read Full Browser Log

@.buildrunner/browser.log

---

## Step 3: Analyze the Logs

Look for these patterns in the log above:

### Errors (CRITICAL)
- `[ERROR]` entries - JavaScript errors, exceptions
- Network requests with `status >= 400` - API failures
- `TypeError`, `ReferenceError`, `SyntaxError` - Code bugs

### Warnings (HIGH)
- `[WARN]` entries - Potential issues
- Deprecation warnings
- React/Vue warnings

### Failed Network Requests (HIGH)
- `[NET]` entries with error status codes
- CORS errors
- Timeout errors
- 401/403 - Auth issues
- 404 - Missing endpoints
- 500 - Server errors

### Console Output (MEDIUM)
- `[LOG]` entries around the time of the error
- State logging that shows data flow

---

## Step 4: Correlate with User's Issue

Based on the logs and the user's description:

1. **Identify the root cause** - What actually failed?
2. **Trace the error path** - What led to the failure?
3. **Find the source** - Which file/function caused it?

---

## Step 5: Report Findings

Tell the user:

> "**Browser Log Analysis:**
>
> **Error Found:** [specific error message]
> **Source:** [file:line if available]
> **Cause:** [what triggered it]
> **Network Issues:** [any failed API calls]
>
> **Recommended Fix:** [what to do]"

---

## Step 6: Fix the Issue

If the fix is clear:
1. Read the relevant source file
2. Implement the fix
3. Tell user to refresh and verify

If unclear:
- Ask user for more context
- Suggest adding more logging
- Recommend checking specific files

---

## Log Entry Format Reference

```
[timestamp] [session] [TYPE] message
  {JSON details for network requests}
```

Types: `[LOG]`, `[WARN]`, `[ERROR]`, `[NET]`, `[INFO]`, `[DEBUG]`

Network entries include: URL, method, status, request/response bodies
