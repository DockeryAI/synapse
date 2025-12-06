# Research: SEC & Companies House APIs for Trends and Buying Signals

> **Last Updated:** 2025-12-05
> **Research Sessions:** 1

## TL;DR

- **SEC EDGAR**: Best for executive quotes (MD&A section), risk factors revealing customer concentration, 8-K material events (acquisitions, strategic shifts), and Form 4 insider trading signals
- **Companies House**: Best for UK competitor monitoring via streaming API (real-time filings/PSC changes), filing history tracking, and owner/director changes
- **Rate Limits**: SEC = 10 req/sec (403 on exceed), Companies House = 600 req/5min (429 on exceed)
- **Key Technical Fix**: Use third-party services (sec-api.io, Perplexity proxy) for section extraction rather than raw HTML parsing - EDGAR filings are notoriously non-standardized
- **Our sec-edgar problem**: Parser expects bold quote format but Perplexity returns numbered lists - switch to AI-based extraction

---

## Problem Statement

We need to extract customer buying signals, competitive intelligence, and market trends from:
1. **SEC EDGAR** (US public companies) - executive quotes, risk factors, material events
2. **Companies House** (UK companies) - competitor activity, ownership changes, filing events

Current issues:
- sec-edgar parser failing (0 quotes extracted)
- No Companies House integration
- Need robust, rate-limit-safe API implementations

---

## SEC EDGAR API Solutions

### Solution 1: Official data.sec.gov (Free)
- **What:** Free REST API, no auth required, JSON format
- **Endpoints:**
  - `/submissions/CIK{cik}.json` - Filer history
  - XBRL data from 10-Q, 10-K, 8-K
- **Pros:** Free, real-time updates (<1 sec delay), no API key needed
- **Cons:** 10 req/sec limit, no CORS, no section extraction, no tech support
- **Rate Limit Handling:** Returns 403 (not 429), blocks IP for 10 minutes on exceed
- **When to use:** Basic filing metadata, company lookup
- **Sources:** [data.sec.gov](https://data.sec.gov/), [SEC Developer Resources](https://www.sec.gov/about/developer-resources)

### Solution 2: sec-api.io (Commercial)
- **What:** Full-featured commercial API with section extraction
- **Key Features:**
  - **Extractor API**: Returns cleaned sections (Risk Factors, MD&A) from 10-K/10-Q
  - **Full-Text Search**: Search all filings for keywords since 2001
  - **Stream API**: Real-time WebSocket feed of new filings
  - **Insider Trading API**: Form 4 data indexed within 300ms
- **Sections Available:**
  - 10-K: Sections 1-15 (including 1A Risk Factors, 7 MD&A, 7A Quantitative Disclosures)
  - 10-Q: Parts 1-2 (including MD&A, Risk Factors, Legal Proceedings)
  - 8-K: All 38 triggering events (1.01-9.01)
- **Pros:** 99% edge case coverage, customer support, higher rate limits
- **Cons:** Paid ($29-$299/month), requires API key
- **Sources:** [sec-api.io Docs](https://sec-api.io/docs), [Extractor API](https://sec-api.io/docs/sec-filings-item-extraction-api)

### Solution 3: Perplexity Proxy (Our Current Approach)
- **What:** Use Perplexity AI to extract quotes from SEC filings
- **Current Problem:** Parser expects `**"Quote"** - Source` format, but Perplexity returns numbered lists
- **Fix:** Update parser to handle multiple response formats OR switch to more explicit prompt that enforces output format
- **Alternative:** Use sec-api.io Extractor API for reliable section extraction, then Perplexity for quote synthesis
- **Sources:** Current codebase, [Perplexity Sonar](https://docs.perplexity.ai/)

---

## Valuable SEC Data Points for Buying Signals

### 1. Management Discussion & Analysis (MD&A - Section 7)
- **What it reveals:** Forward-looking statements, strategic priorities, customer trends
- **Key signals:** Revenue concentration, churn concerns, expansion plans
- **Extraction:** sec-api.io `get_section(url, "7", "text")` or Perplexity synthesis

### 2. Risk Factors (Section 1A)
- **What it reveals:** Customer concentration (>10% revenue from single customer required), churn risks
- **Key signals:** "Customer concentration," "customer attrition," "renewal rates"
- **Disclosure requirement:** ASC 275-10-50-18 mandates disclosure when customer = 10%+ revenue
- **Sources:** [PWC Disclosure Guide](https://viewpoint.pwc.com/dt/us/en/pwc/accounting_guides/financial_statement_/financial_statement___18_US/chapter_24_risks_and_US/243_disclosure_US.html)

### 3. Form 8-K Material Events
- **Best items for buying signals:**
  - Item 1.01: Material Agreements (major contracts, partnerships)
  - Item 2.01: Acquisitions/Dispositions
  - Item 7.01: Regulation FD (voluntary disclosures)
  - Item 8.01: Other Material Events
- **Sources:** [SEC Form 8-K Guide](https://sec-api.io/resources/analyze-8-k-filings-and-material-event-disclosure-activity)

### 4. Form 4 Insider Trading
- **What it reveals:** Executive confidence signals
- **Key patterns:** Cluster buying (multiple insiders buying = strong bullish signal)
- **Timing:** Must be filed within 2 business days of trade
- **Sources:** [OpenInsider](http://openinsider.com/), [SEC Form 4 API](https://sec-api.io/docs/insider-ownership-trading-api)

---

## Companies House API Solutions

### Solution 1: REST API (On-Demand)
- **Base URL:** `https://api.company-information.service.gov.uk`
- **Key Endpoints:**
  - `GET /company/{companyNumber}` - Company profile
  - `GET /company/{company_number}/officers` - Directors list
  - `GET /company/{company_number}/filing-history` - All filings
  - `GET /company/{company_number}/persons-with-significant-control` - PSC/owners
  - `GET /officers/{officer_id}/appointments` - Officer's other directorships
- **Rate Limit:** 600 requests per 5 minutes (429 on exceed)
- **Authentication:** API key in header (Basic auth, key as username)
- **Sources:** [CH API Specs](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference)

### Solution 2: Streaming API (Real-Time)
- **Base URL:** `https://stream.companieshouse.gov.uk`
- **Available Streams:**
  - `/companies` - Company profile changes
  - `/filings` - New filings
  - `/officers` - Director changes
  - `/persons-with-significant-control` - PSC changes
  - `/charges` - Mortgage/charge changes
  - `/insolvency-cases` - Insolvency events
  - `/disqualified-officers` - Disqualifications
- **How it works:** Long-running HTTP connection, JSON events pushed as they happen
- **Authentication:** Stream key (separate from API key)
- **Heartbeat:** Empty records sent periodically to keep connection alive
- **Sources:** [Streaming API Guide](https://developer-specs.company-information.service.gov.uk/streaming-api/guides/overview), [Example Implementation](https://github.com/mrbrianevans/companies-house-stream)

### Solution 3: Follow Service (Free Alerts)
- **What:** Email alerts when monitored companies file anything
- **Pros:** Free, anonymous, immediate notification
- **Cons:** Email only, no API integration
- **Sources:** [CH Blog](https://companieshouse.blog.gov.uk/2016/03/22/changes-that-affect-you-people-with-significant-control-psc/)

---

## Valuable Companies House Data for Competitive Intel

### 1. PSC Changes (Persons with Significant Control)
- **What it reveals:** Ownership changes, investment rounds, acquisitions
- **Key signals:** New >25% shareholders, change in voting rights
- **Timing:** Must be reported within 14 days
- **Monitoring:** Streaming API `/persons-with-significant-control`

### 2. Filing History
- **What it reveals:** Financial health, strategic moves
- **Key documents:** Annual accounts, capital changes, director changes
- **Use case:** Track competitor funding rounds, acquisitions, distress signals

### 3. Officer Changes
- **What it reveals:** Leadership transitions, expansion/contraction
- **Key signals:** Multiple director resignations, new strategic hires
- **Cross-reference:** Use `/officers/{id}/appointments` to find connected companies

---

## Technical Implementation Best Practices

### Rate Limiting & Retry Logic

#### SEC EDGAR (10 req/sec)
```typescript
// Recommended approach
const SEC_RATE_LIMIT = 100; // ms between requests (10/sec)
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;

async function secRequest(url: string, attempt = 1): Promise<Response> {
  try {
    await sleep(SEC_RATE_LIMIT);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CompanyName admin@company.com', // REQUIRED
      }
    });

    if (response.status === 403) {
      // Rate limited - wait 10 minutes
      console.warn('SEC rate limit hit, backing off 10 minutes');
      await sleep(600000);
      return secRequest(url, attempt);
    }

    return response;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const backoff = (attempt * BACKOFF_MULTIPLIER * 1000) + randomJitter();
      await sleep(backoff);
      return secRequest(url, attempt + 1);
    }
    throw err;
  }
}
```

#### Companies House (600 req/5min)
```typescript
const CH_RATE_LIMIT = 500; // ms between requests (safe margin)
const CH_MAX_RETRIES = 5;

async function chRequest(url: string, apiKey: string, attempt = 1): Promise<Response> {
  try {
    await sleep(CH_RATE_LIMIT);
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
      }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      await sleep(parseInt(retryAfter) * 1000);
      return chRequest(url, apiKey, attempt);
    }

    return response;
  } catch (err) {
    if (attempt < CH_MAX_RETRIES) {
      const backoff = Math.pow(2, attempt) * 1000 + randomJitter();
      await sleep(backoff);
      return chRequest(url, apiKey, attempt + 1);
    }
    throw err;
  }
}

function randomJitter(): number {
  return Math.random() * 200 - 100; // ±100ms jitter
}
```

### SEC EDGAR Parsing Issues & Solutions

#### Problem: Non-Standardized Filing Formats
- **Issue:** "HTML 10-Ks are a big mess" - each filer formats differently
- **Root cause:** EDGAR uses SGML not XML, no uniform structure
- **Our sec-edgar problem:** Perplexity returns numbered lists, parser expects bold quotes

#### Solution 1: Use Commercial Extraction (Recommended)
```typescript
// sec-api.io approach - 99% edge case coverage
import { ExtractorApi } from 'sec-api';

const extractorApi = new ExtractorApi('YOUR_API_KEY');
const mdAndA = await extractorApi.getSection(filingUrl, '7', 'text');
const riskFactors = await extractorApi.getSection(filingUrl, '1A', 'text');
```

#### Solution 2: Fix Perplexity Parser (Our Case)
Current parser expects:
```
**"Quote text here"** - Source Name, Title
```

Perplexity actually returns:
```
1. "Quote text here" - Source Name
2. "Another quote" - Source Name
```

Fix: Update regex to handle multiple formats:
```typescript
const quotePatterns = [
  /\*\*"([^"]+)"\*\*\s*[-–—]\s*(.+)/g,           // Bold format
  /^\d+\.\s*"([^"]+)"\s*[-–—]\s*(.+)/gm,         // Numbered list
  /"([^"]+)"\s*[-–—]\s*([^,\n]+(?:,\s*[^,\n]+)?)/g  // Plain quote
];
```

#### Solution 3: Use lxml with XPath (Python)
```python
from lxml import etree
# XPath is more reliable than BeautifulSoup for EDGAR
# Works for ~70% of filings
```

### Companies House Streaming Implementation

```typescript
// Robust streaming connection with reconnection
import split2 from 'split2';
import { get } from 'https';

const STREAM_KEY = process.env.COMPANIES_HOUSE_STREAM_KEY;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

function connectToStream(path: string) {
  const options = {
    hostname: 'stream.companieshouse.gov.uk',
    path,
    auth: STREAM_KEY + ':',
  };

  get(options, (res) => {
    if (res.statusCode === 200) {
      reconnectAttempts = 0;
      res.pipe(split2(JSON.parse)).on('data', handleEvent);
    } else if (res.statusCode === 429) {
      // Rate limited - exponential backoff
      const delay = Math.pow(2, reconnectAttempts) * 1000;
      setTimeout(() => connectToStream(path), delay);
      reconnectAttempts++;
    }

    res.on('end', () => {
      // Connection dropped - reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(30000, Math.pow(2, reconnectAttempts) * 1000);
        setTimeout(() => connectToStream(path), delay);
        reconnectAttempts++;
      }
    });
  });
}

function handleEvent(event: any) {
  // Ignore heartbeat (empty) events
  if (!event.resource_kind) return;

  // Process based on type
  switch (event.resource_kind) {
    case 'company-profile':
      // Handle company changes
      break;
    case 'filing-history':
      // Handle new filings
      break;
    case 'persons-with-significant-control':
      // Handle PSC changes
      break;
  }
}
```

---

## Anti-Patterns (What NOT To Do)

1. **Don't parse EDGAR HTML with regex alone** - Only 30% success rate due to format variations
2. **Don't ignore User-Agent header for SEC** - You'll get 403 blocked immediately
3. **Don't retry on 4xx errors infinitely** - These are client errors, not transient
4. **Don't use SEC rate limit >10/sec** - IP gets blocked for 10 minutes
5. **Don't trust Companies House index files blindly** - Some have data corruption
6. **Don't hardcode Companies House API key in frontend** - Use environment variables
7. **Don't retry at multiple layers** - Creates cascading retry storm (3x3 = 9 retries)

---

## Recommendations for Synapse

### For Our Use Case (VoC Quote Extraction):

1. **Fix sec-edgar immediately:**
   - Update Perplexity prompt to enforce exact output format with validation
   - OR switch to multi-pattern parser for numbered lists, bold, and plain formats
   - OR use sec-api.io Extractor for MD&A section, then Perplexity for quote synthesis

2. **Add Companies House to Competitive tab:**
   - Use REST API for on-demand company lookups
   - Consider streaming API for real-time competitor monitoring
   - Key endpoints: `/filing-history`, `/persons-with-significant-control`, `/officers`

3. **Implement robust connection handling:**
   - Add exponential backoff with jitter (200ms, 400ms, 800ms ±20%)
   - Add User-Agent header to all SEC requests
   - Cache frequently accessed data (Redis/in-memory)
   - Log all retry attempts for debugging

4. **Consider sec-api.io for production:**
   - More reliable section extraction
   - Higher rate limits
   - Customer support available
   - Worth $29/month for consistency

---

## Sources

### [Official] Government APIs
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [data.sec.gov](https://data.sec.gov/)
- [Companies House API Overview](https://developer.company-information.service.gov.uk/overview)
- [Companies House API Specs](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference)
- [Companies House Streaming API](https://developer-specs.company-information.service.gov.uk/streaming-api/guides/overview)
- [Companies House Rate Limiting](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)

### [Commercial] Third-Party APIs
- [sec-api.io Documentation](https://sec-api.io/docs)
- [sec-api.io Extractor API](https://sec-api.io/docs/sec-filings-item-extraction-api)
- [sec-api.io Python Package](https://pypi.org/project/sec-api/)
- [OpenInsider - Form 4 Tracking](http://openinsider.com/)

### [Community] Discussions & Implementations
- [GitHub: companies-house-stream](https://github.com/mrbrianevans/companies-house-stream)
- [SEC EDGAR Parsing Issues](https://stackoverflow.com/questions/61772155/edgar-sec-10-k-individual-sections-parser)
- [SEC Rate Limit Discussion](https://github.com/sec-edgar/sec-edgar/discussions/194)
- [Companies House Rate Limit Handling](https://stackoverflow.com/questions/56458315/companies-house-rate-limit-handling-with-ratelimit-library)

### [Research] Studies & Guides
- [Daloopa: SEC EDGAR Guide](https://daloopa.com/blog/analyst-best-practices/comprehensive-guide-to-sec-edgar-api-and-database)
- [AWS: SEC NLP Dashboard](https://aws.amazon.com/blogs/machine-learning/create-a-dashboard-with-sec-text-for-financial-nlp-in-amazon-sagemaker-jumpstart/)
- [MSCI: Sentiment in Regulatory Filings](https://www.msci.com/www/blog-posts/finding-the-sentiment-hidden-in/02340854494)
- [PWC: Risk Disclosure Requirements](https://viewpoint.pwc.com/dt/us/en/pwc/accounting_guides/financial_statement_/financial_statement___18_US/chapter_24_risks_and_US/243_disclosure_US.html)

---

## Research Log

### Session 1 - 2025-12-05
- Searched: SEC EDGAR API best practices, Companies House API, rate limiting, retry logic, section extraction
- Found: SEC rate limit is 10/sec (403 on exceed), CH is 600/5min (429)
- Found: Our sec-edgar parser issue - expects bold format, gets numbered list
- Found: sec-api.io offers reliable extraction with 99% coverage
- Found: Companies House streaming API provides real-time filing/PSC changes
- Added: Complete technical implementation guide with code examples
