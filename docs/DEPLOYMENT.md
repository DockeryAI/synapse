# Synapse V2 Dashboard - Deployment Guide

**Version 2.0**
**Last Updated: 2025-11-23**

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Building for Production](#building-for-production)
5. [Deployment Options](#deployment-options)
6. [Environment Variables](#environment-variables)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher (LTS recommended)
- **npm**: 9.0.0 or higher (or yarn 1.22.0+)
- **Git**: 2.0.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Optional Services

- **Apify Account**: For competitive analysis (optional but recommended)
  - Free tier available
  - Provides real-time competitor data
  - Fallback mode available without it

### Knowledge Requirements

- Basic understanding of React applications
- Familiarity with npm/yarn package managers
- Basic knowledge of environment variables
- Understanding of static site hosting (for deployment)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Synapse
```

### 2. Install Dependencies

```bash
npm install
```

Or with yarn:

```bash
yarn install
```

### 3. Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Verify Installation

```bash
npm run dev
```

The application should start on `http://localhost:5173` (or similar).

---

## Local Development

### Running Development Server

```bash
npm run dev
```

Features:
- Hot module replacement (HMR)
- Fast refresh for React components
- Source maps for debugging
- Auto-reload on file changes

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Type check in watch mode
npm run type-check:watch
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

---

## Building for Production

### 1. Clean Previous Build

```bash
npm run clean
```

### 2. Build Application

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle and optimize assets
- Minify CSS and JavaScript
- Generate source maps (if configured)
- Create production-ready `dist/` folder

### 3. Preview Production Build

```bash
npm run preview
```

Test the production build locally before deploying.

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js        # Main application bundle
│   ├── vendor-[hash].js        # Third-party dependencies
│   ├── index-[hash].css        # Compiled styles
│   └── [images/fonts]          # Static assets
├── index.html                  # Entry HTML file
└── favicon.ico                 # Favicon
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Advantages**: Zero-config deployment, automatic HTTPS, global CDN, preview deployments

**Steps**:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_APIFY_API_TOKEN": "@apify-token"
  }
}
```

### Option 2: Netlify

**Advantages**: Easy drag-and-drop, form handling, serverless functions

**Steps**:

1. Build application:
```bash
npm run build
```

2. Deploy via Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Or via Web UI**:
- Drag `dist/` folder to Netlify deploy page
- Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS S3 + CloudFront

**Advantages**: Scalable, cost-effective, full AWS integration

**Steps**:

1. Create S3 bucket:
```bash
aws s3 mb s3://synapse-dashboard
```

2. Configure bucket for static hosting:
```bash
aws s3 website s3://synapse-dashboard --index-document index.html
```

3. Build and sync:
```bash
npm run build
aws s3 sync dist/ s3://synapse-dashboard --delete
```

4. Create CloudFront distribution for HTTPS and CDN.

### Option 4: GitHub Pages

**Advantages**: Free hosting, simple setup for open-source projects

**Steps**:

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add deploy script to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

4. Configure repository settings to serve from `gh-pages` branch.

### Option 5: Docker

**Advantages**: Consistent environment, easy scaling, cloud-agnostic

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run**:
```bash
docker build -t synapse-dashboard .
docker run -p 8080:80 synapse-dashboard
```

---

## Environment Variables

### Required Variables

None - application works with defaults

### Optional Variables

#### Apify Configuration
```bash
# Apify API token for competitive analysis
VITE_APIFY_API_TOKEN=your_apify_token_here

# Apify request timeout (milliseconds)
VITE_APIFY_TIMEOUT=60000

# Maximum number of competitors to analyze
VITE_MAX_COMPETITORS=5

# Maximum pages to scrape per competitor
VITE_MAX_PAGES_PER_COMPETITOR=10
```

#### Feature Flags
```bash
# Enable/disable competitive analysis
VITE_ENABLE_COMPETITIVE_ANALYSIS=true

# Enable/disable A/B testing features
VITE_ENABLE_AB_TESTING=true

# Enable/disable performance tracking
VITE_ENABLE_PERFORMANCE_TRACKING=true
```

#### Analytics (Optional)
```bash
# Google Analytics tracking ID
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry DSN for error tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Setting Environment Variables

**Development** (`.env`):
```bash
VITE_APIFY_API_TOKEN=your_token
```

**Production** (varies by platform):

- **Vercel**: Dashboard → Settings → Environment Variables
- **Netlify**: Dashboard → Site settings → Environment variables
- **AWS**: CloudFormation parameters or Systems Manager Parameter Store
- **Docker**: Pass via `-e` flag or docker-compose environment section

---

## Performance Optimization

### Build Optimizations

Already configured in `vite.config.ts`:
- Code splitting by route
- Vendor chunk separation
- CSS extraction and minification
- Image optimization
- Tree shaking

### Performance Targets

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s ✅
- **FID (First Input Delay)**: < 100ms ✅
- **CLS (Cumulative Layout Shift)**: < 0.1 ✅

#### Additional Metrics
- **FCP (First Contentful Paint)**: < 1.5s
- **TTI (Time to Interactive)**: < 3s
- **Speed Index**: < 3.0s

### Optimization Checklist

- [x] Lazy loading for heavy components
- [x] Code splitting by route
- [x] React.memo for pure components
- [x] useMemo for expensive calculations
- [x] Image optimization and lazy loading
- [x] CSS minification
- [x] JavaScript minification
- [x] Gzip/Brotli compression (server-side)
- [x] CDN for static assets
- [x] Browser caching headers

### Monitoring Performance

#### Lighthouse CI

```bash
npm install -g @lhci/cli

# Run Lighthouse audit
lhci autorun --collect.url=http://localhost:5173
```

Target scores:
- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

#### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze
```

Review bundle report to identify large dependencies.

---

## Monitoring & Analytics

### Error Tracking

**Recommended**: Sentry

```bash
npm install @sentry/react @sentry/tracing
```

**Setup** (`src/main.tsx`):
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}
```

### Analytics

**Recommended**: Google Analytics 4

```typescript
// Add to index.html or use react-ga4
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Performance Monitoring

Track Core Web Vitals:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## Troubleshooting

### Build Failures

**Issue**: `npm run build` fails with memory error

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Check for type errors
npm run type-check

# Fix common issues
npm run lint:fix
```

### Deployment Issues

**Issue**: 404 on page refresh (SPA routing)

**Solution**: Configure server for SPA:
- **Nginx**: Add rewrite rule to `nginx.conf`
- **Netlify**: Add `_redirects` file
- **Vercel**: Handled automatically

**Issue**: Environment variables not working

**Solution**:
- Verify variables start with `VITE_`
- Rebuild application after changing variables
- Check deployment platform configuration

### Performance Issues

**Issue**: Slow initial load

**Solution**:
- Enable CDN caching
- Implement service worker
- Preload critical assets
- Use route-based code splitting

**Issue**: Large bundle size

**Solution**:
```bash
# Analyze bundle
npm run build -- --analyze

# Remove unused dependencies
npm prune

# Use dynamic imports for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## Rollback Procedures

### Vercel/Netlify

1. Go to deployments dashboard
2. Find previous working deployment
3. Click "Promote to Production" or "Publish"

### AWS S3

```bash
# Keep backup of previous build
cp -r dist/ dist-backup/

# Rollback
aws s3 sync dist-backup/ s3://synapse-dashboard --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Docker

```bash
# Tag builds with version
docker build -t synapse-dashboard:v1.0.0 .
docker push synapse-dashboard:v1.0.0

# Rollback to previous version
docker pull synapse-dashboard:v0.9.9
docker stop current-container
docker run synapse-dashboard:v0.9.9
```

### Emergency Rollback

1. Keep previous build in `dist-backup/`
2. Have rollback script ready:
```bash
#!/bin/bash
# rollback.sh
cp -r dist-backup/ dist/
npm run deploy
```
3. Test rollback procedure in staging environment

---

## Production Checklist

Before deploying to production:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code reviewed by team member

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size analyzed and optimized
- [ ] Images compressed and optimized
- [ ] Lazy loading implemented

### Security
- [ ] Dependencies updated (`npm audit`)
- [ ] No secrets in code or environment files
- [ ] HTTPS enabled
- [ ] CSP headers configured (if applicable)

### Functionality
- [ ] All features working in production build
- [ ] Error handling tested
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Mobile responsive (test 375px, 768px, 1024px)
- [ ] Dark mode functional
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

### Documentation
- [ ] User guide updated
- [ ] Deployment guide current
- [ ] Environment variables documented
- [ ] Changelog updated

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (GA4)
- [ ] Performance monitoring active
- [ ] Alerts configured for critical errors

### Backup & Recovery
- [ ] Backup of previous build saved
- [ ] Rollback procedure documented and tested
- [ ] Database backup (if applicable)

---

## Support & Resources

### Documentation
- User Guide: `docs/USER_GUIDE.md`
- API Reference: `docs/API_REFERENCE.md` (if applicable)
- Contributing Guide: `CONTRIBUTING.md`

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Share tips and ask questions

### Professional Support
- Email: support@synapse.com (if applicable)
- Slack/Discord: Join community channel

---

## Version History

- **v2.0.0** (2025-11-23): Phase 2D complete - Production ready
- **v1.5.0** (2025-11-22): Phase 2C - Competitive analysis
- **v1.0.0** (2025-11-15): Initial V2 Dashboard release

---

**Ready to deploy?** Follow the steps above for your chosen platform and launch Synapse V2 Dashboard to production!
