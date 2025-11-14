# Synapse SMB Platform

**Fast, intelligent SMB onboarding with automated content generation**

Version: 1.0.0
Status: Phase 1 Foundation Complete
Repository: https://github.com/DockeryAI/synapse

---

## Overview

Synapse is a modern web platform designed to revolutionize SMB marketing by combining:
- **3-minute smart onboarding** with evidence-based UVP creation
- **1-minute content generation** optimized for each platform
- **Automated scheduling** through direct SocialPilot integration

The platform uses advanced AI and parallel intelligence gathering from 8+ data sources to create hyper-targeted, specialty-aware content that actually works for small businesses.

---

## Key Features

### Phase 1 (Foundation - In Progress)

1. **Universal URL Parser** - Handles any URL format from any country
2. **Global Location Detection** - 50+ countries with 5 parallel detection strategies
3. **Parallel Intelligence Gathering** - 8+ data sources running simultaneously
4. **Specialty Detection Engine** - Identifies niches vs generic industry (e.g., "wedding bakery" vs "bakery")
5. **Enhanced UVP Wizard** - Evidence-based suggestions with real-time citations
6. **Synapse Content Generation** - Platform-optimized content in under 60 seconds
7. **SocialPilot Integration** - One-click scheduling to all connected social accounts
8. **Buyer Journey Mapping** - Simplified customer journey visualization

### Planned Features

- **Content Calendar** with auto-scheduling (30-day planning)
- **Analytics Dashboard** for performance tracking
- **Multi-Location Support** for franchises
- **Creator/Influencer Platform** variant

---

## Tech Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.2.2** - Type-safe development
- **Vite 5.0.8** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router 6** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Local state management

### Backend & Infrastructure
- **Supabase** - PostgreSQL database, authentication, edge functions
- **Netlify** - Deployment and hosting
- **OpenRouter** - AI content generation (Claude Opus 4.1)

### Intelligence & Data
- **Apify** - Web scraping and service page analysis
- **OutScraper** - Google Business data and reviews
- **Serper** - Search intelligence and competitor discovery
- **SocialPilot** - Content scheduling and distribution

### Development Tools
- **BuildRunner 3.0** - Feature tracking and documentation
- **Git** - Version control
- **ESLint** - Code linting

---

## Project Structure

```
synapse/
├── .buildrunner/              # BuildRunner governance
│   ├── features.json         # Feature tracking
│   ├── STATUS.md             # Auto-generated status
│   ├── scripts/              # Build automation
│   └── standards/            # Coding standards
├── src/
│   ├── components/           # React components
│   │   ├── buyer-journey/   # Journey mapping components
│   │   ├── common/          # Shared components
│   │   ├── layouts/         # Layout components
│   │   ├── ui/              # UI primitives (shadcn pattern)
│   │   └── uvp-wizard/      # UVP wizard components
│   ├── contexts/            # React context providers
│   ├── data/                # Static data (personas, industries, NAICS)
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── services/            # Business logic and API services
│   │   ├── intelligence/   # Data gathering services
│   │   ├── synapse/        # Content generation
│   │   ├── uvp-wizard/     # UVP creation
│   │   └── buyer-journey/  # Journey mapping
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper utilities
├── supabase/
│   └── functions/           # Edge functions
├── public/                  # Static assets
└── docs/                    # Documentation

197 files, 58,557 lines of code
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account (free tier works)
- API keys for: OpenRouter, Apify, OutScraper, Serper, SocialPilot

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DockeryAI/synapse.git
   cd synapse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENROUTER_API_KEY`
   - `VITE_APIFY_API_KEY`
   - `VITE_OUTSCRAPER_API_KEY`
   - `VITE_SERPER_API_KEY`
   - `VITE_SOCIALPILOT_*` credentials

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173

### Build for Production

```bash
npm run build
npm run preview
```

### Deploy to Netlify

```bash
# Connect to Netlify
netlify init

# Deploy
netlify deploy --prod
```

---

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (skips type checking for speed)
- `npm run build:typecheck` - Build with full TypeScript type checking
- `npm run typecheck` - Run TypeScript type checking only
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### BuildRunner Commands

```bash
# Generate STATUS.md from features.json
node .buildrunner/scripts/generate-status.mjs

# View current status
cat .buildrunner/STATUS.md
```

### Code Style

- Follow `.buildrunner/standards/CODING_STANDARDS.md`
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for styling
- Document complex logic with inline comments

---

## Current Status

### ✅ Completed
- Project structure and configuration
- Build system (Vite + TypeScript)
- UI component library
- Core service architecture migrated from MARBA
- BuildRunner 3.0 integration
- GitHub repository created
- Initial deployment configuration

### ⏸️ In Progress
- TypeScript type definition cleanup (~100 type errors to resolve)
- Full Synapse page implementation
- Phase 1 feature implementations

### 📋 Planned
- Comprehensive testing suite
- API endpoint verification
- End-to-end QA
- Production deployment
- Documentation expansion

---

## Architecture

### Data Flow

```
User Input (URL/Industry)
    ↓
Universal URL Parser → Normalizes URL
    ↓
Parallel Intelligence Gathering (8+ sources)
    ├→ Location Detection (5 strategies)
    ├→ Website Scraping (Apify)
    ├→ Google Business (OutScraper)
    ├→ Reviews Analysis (OutScraper)
    ├→ Search Presence (Serper)
    ├→ Competitor Discovery (Serper)
    └→ AI Analysis (OpenRouter)
    ↓
Specialty Detection → Identifies niche
    ↓
UVP Wizard → Evidence-based suggestions
    ↓
Synapse Content Generation → Platform-optimized content
    ↓
SocialPilot Integration → Automated scheduling
```

### Key Services

- **location-detection.service.ts** - Multi-strategy location detection
- **deepcontext-builder.service.ts** - Intelligence aggregation
- **specialty-detection.service.ts** - Niche identification (to be implemented)
- **SynapseGenerator.ts** - Content generation orchestration
- **buyer-journey-ai.service.ts** - Journey mapping with AI

---

## API Integration

### Intelligence Sources

1. **Apify** - Web scraping
   - Actor: Website Scraper
   - Actor: Service Page Analyzer
   - Actor: Social Profile Finder

2. **OutScraper** - Google data
   - Google Business Profile
   - Google Reviews
   - Local SEO data

3. **Serper** - Search intelligence
   - Search results
   - Related searches
   - Competitor discovery

4. **OpenRouter** - AI processing
   - Model: Claude Opus 4.1
   - UVP suggestions
   - Content generation
   - Specialty detection

5. **SocialPilot** - Distribution
   - OAuth authentication
   - Multi-platform posting
   - Content scheduling

---

## Environment Variables

See `.env.example` for complete list. Key variables:

```env
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENROUTER_API_KEY=
VITE_APIFY_API_KEY=
VITE_OUTSCRAPER_API_KEY=
VITE_SERPER_API_KEY=

# SocialPilot
VITE_SOCIALPILOT_CLIENT_ID=
VITE_SOCIALPILOT_CLIENT_SECRET=

# Optional
VITE_GOOGLE_MAPS_API_KEY=
VITE_DEBUG_MODE=false
VITE_USE_MOCK_DATA=false
```

---

## Contributing

1. Read `.buildrunner/standards/CODING_STANDARDS.md`
2. Create a feature branch
3. Make your changes
4. Update `.buildrunner/features.json`
5. Run `node .buildrunner/scripts/generate-status.mjs`
6. Commit with semantic commit message
7. Push and create PR

### Commit Message Format

```
feat: Add specialty detection engine
fix: Resolve location detection for UK addresses
docs: Update API integration guide
```

---

## License

MIT License - see LICENSE file for details

---

## Support

- **Issues**: https://github.com/DockeryAI/synapse/issues
- **Documentation**: See `/docs` directory
- **BuildRunner Status**: `.buildrunner/STATUS.md`

---

## Acknowledgments

- Built with **Claude Code** by Anthropic
- UI components inspired by **shadcn/ui**
- Icons by **Lucide React**
- Animations by **Framer Motion**

---

**Last Updated**: 2025-11-14
**Build Status**: ✅ Passing
**Version**: 1.0.0
**Completion**: 15% (Phase 1 foundation)

🤖 This project uses BuildRunner 3.0 for feature tracking and governance.
