# Agency White-Label Build Plan

**Created:** November 21, 2024
**Status:** Proposed
**Estimated Timeline:** 8 weeks
**Priority:** Critical (3-5x revenue potential)

---

## Overview

This plan outlines the features and development work required to transform Synapse into an agency white-label platform. Based on competitive analysis, Synapse's intelligence depth makes it ideal for agencies charging $2,000-5,000/month retainers.

**Strategic Goal:** Enable agencies to white-label Synapse as their own platform, manage multiple clients, and generate branded reports.

---

## Phase 1: Core White-Label Features (2 weeks)

### 1.1 Custom Branding System

**Requirements:**
- Custom domain mapping (agency.synapse.com → agency.com/dashboard)
- Logo replacement throughout UI
- Custom color schemes (primary, secondary, accent)
- Branded email notifications
- Remove all Synapse branding references
- Favicon customization
- Custom login page

**Files to create/modify:**
- `src/services/white-label/branding.service.ts`
- `src/components/white-label/BrandingSettings.tsx`
- `src/styles/theme-provider.tsx`
- Update all email templates in `src/templates/`

**Database schema:**
```sql
CREATE TABLE agency_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#F59E0B',
  custom_domain TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Effort:** 3 days

---

### 1.2 Multi-Tenant Architecture

**Requirements:**
- Agency account → Client sub-accounts structure
- Agency admin dashboard (see all clients)
- Client isolation (can't see other clients)
- Bulk operations across clients
- Hierarchical data access

**Database schema:**
```sql
-- Agency accounts
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  plan_tier TEXT DEFAULT 'starter', -- starter, growth, scale
  client_limit INTEGER DEFAULT 5,
  custom_domain TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency team members
CREATE TABLE agency_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- agency_owner, account_manager, strategist
  assigned_client_ids UUID[],
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Client accounts under agency
CREATE TABLE agency_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id), -- Links to existing brand
  display_name TEXT NOT NULL,
  client_contact_email TEXT,
  client_access_enabled BOOLEAN DEFAULT false,
  monthly_retainer DECIMAL(10,2),
  contract_start DATE,
  contract_end DATE,
  status TEXT DEFAULT 'active', -- active, paused, churned
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can see their clients" ON agency_clients
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );
```

**Files to create:**
- `src/services/agency/multi-tenant.service.ts`
- `src/hooks/useAgencyContext.ts`
- `src/middleware/agency-isolation.ts`

**Effort:** 5 days

---

### 1.3 Branded Reports

**Requirements:**
- PDF report generator with agency logo/colors
- Executive summary templates
- Remove Synapse footers/watermarks
- Customizable report sections
- Scheduled report delivery
- Multiple report templates (weekly, monthly, quarterly)

**Report types:**
1. Executive Summary (1 page)
2. Campaign Performance Report (detailed)
3. Intelligence Report (from onboarding)
4. Competitive Analysis Report
5. Monthly Retainer Report

**Files to create:**
- `src/services/white-label/report-generator.service.ts`
- `src/components/reports/ReportBuilder.tsx`
- `src/templates/reports/` (PDF templates)

**Tech stack:**
- `@react-pdf/renderer` for PDF generation
- Store templates in Supabase Storage
- Schedule with Supabase Edge Functions

**Effort:** 4 days

---

## Phase 2: Agency Management Tools (2 weeks)

### 2.1 Client Management Dashboard

**Requirements:**
- Client list view (grid and table)
- Quick stats per client (campaigns active, posts scheduled, engagement)
- One-click client switching
- Bulk campaign creation
- Client onboarding wizard
- Search/filter clients
- Client health indicators

**Component structure:**
```typescript
// src/components/agency/AgencyDashboard.tsx
interface AgencyDashboardProps {
  agency: Agency;
  clients: AgencyClient[];
}

// Features:
// - Client cards with key metrics
// - Quick actions (new campaign, view reports, edit)
// - Bulk selection for mass operations
// - Client status indicators (needs attention, on track, etc.)
```

**UI mockup sections:**
1. Header with agency stats (total clients, active campaigns, MRR)
2. Client grid/list with filtering
3. Quick action bar
4. Recent activity feed

**Files to create:**
- `src/components/agency/AgencyDashboard.tsx`
- `src/components/agency/ClientCard.tsx`
- `src/components/agency/ClientList.tsx`
- `src/components/agency/ClientQuickActions.tsx`
- `src/pages/AgencyDashboardPage.tsx`

**Effort:** 4 days

---

### 2.2 Access Control System

**Requirements:**
- Role-based access control (RBAC)
- Custom permissions per role
- Team invitation system
- Activity audit log

**Roles:**
```typescript
enum AgencyRole {
  AGENCY_OWNER = 'agency_owner',     // Full access, billing
  ACCOUNT_MANAGER = 'account_manager', // Assigned clients only
  STRATEGIST = 'strategist',          // Create content, no billing
  CLIENT_VIEWER = 'client_viewer'     // View-only for client stakeholders
}

interface RolePermissions {
  canManageTeam: boolean;
  canManageBilling: boolean;
  canCreateCampaigns: boolean;
  canApprove: boolean;
  canViewAllClients: boolean;
  canExportData: boolean;
  canAccessAPI: boolean;
}

const ROLE_PERMISSIONS: Record<AgencyRole, RolePermissions> = {
  agency_owner: {
    canManageTeam: true,
    canManageBilling: true,
    canCreateCampaigns: true,
    canApprove: true,
    canViewAllClients: true,
    canExportData: true,
    canAccessAPI: true
  },
  account_manager: {
    canManageTeam: false,
    canManageBilling: false,
    canCreateCampaigns: true,
    canApprove: true,
    canViewAllClients: false, // Only assigned clients
    canExportData: true,
    canAccessAPI: false
  },
  strategist: {
    canManageTeam: false,
    canManageBilling: false,
    canCreateCampaigns: true,
    canApprove: false,
    canViewAllClients: false,
    canExportData: false,
    canAccessAPI: false
  },
  client_viewer: {
    canManageTeam: false,
    canManageBilling: false,
    canCreateCampaigns: false,
    canApprove: true, // Can approve their campaigns
    canViewAllClients: false,
    canExportData: false,
    canAccessAPI: false
  }
};
```

**Files to create:**
- `src/services/agency/access-control.service.ts`
- `src/components/agency/TeamManagement.tsx`
- `src/components/agency/InviteMember.tsx`
- `src/hooks/usePermissions.ts`

**Effort:** 3 days

---

### 2.3 Proposal Generator

**Requirements:**
- Intelligence report → Proposal document
- Pricing calculator (agency sets markup)
- Scope of work templates
- Export to PDF/DOCX
- Optional: Digital signature integration

**Proposal sections:**
1. Cover page (agency branded)
2. Executive summary
3. Current state analysis (from intelligence)
4. Recommended strategy
5. Campaign plan
6. Pricing breakdown
7. Terms and timeline
8. Signature block

**Files to create:**
- `src/services/agency/proposal-generator.service.ts`
- `src/components/agency/ProposalBuilder.tsx`
- `src/templates/proposals/`

**Value:** Agencies can use Synapse intelligence to win new business

**Effort:** 3 days

---

## Phase 3: Scalability Features (1 week)

### 3.1 Bulk Operations

**Requirements:**
- Schedule campaigns across multiple clients
- Bulk intelligence gathering
- Template campaigns (apply to multiple clients)
- Mass report generation
- Bulk client import (CSV)

**Implementation:**
```typescript
// src/services/agency/bulk-operations.service.ts

interface BulkOperation {
  type: 'campaign' | 'report' | 'intelligence';
  clientIds: string[];
  template?: string;
  schedule?: Date;
}

async function executeBulkCampaign(
  agencyId: string,
  clientIds: string[],
  campaignTemplate: CampaignTemplate
): Promise<BulkOperationResult> {
  // Create campaign for each client with customization
}

async function generateBulkReports(
  agencyId: string,
  clientIds: string[],
  reportType: ReportType,
  dateRange: DateRange
): Promise<Report[]> {
  // Generate reports in parallel
}
```

**Files to create:**
- `src/services/agency/bulk-operations.service.ts`
- `src/components/agency/BulkActionModal.tsx`
- `src/components/agency/BulkImport.tsx`

**Effort:** 3 days

---

### 3.2 Team Collaboration

**Requirements:**
- Internal notes on campaigns (not visible to clients)
- Task assignment system
- Mention team members (@name)
- Activity feed per client
- Notification preferences

**Database additions:**
```sql
CREATE TABLE agency_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id),
  client_id UUID REFERENCES agency_clients(id),
  campaign_id UUID, -- Optional
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  mentions UUID[], -- User IDs mentioned
  is_internal BOOLEAN DEFAULT true, -- Not visible to client
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agency_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id),
  client_id UUID REFERENCES agency_clients(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to create:**
- `src/components/agency/InternalNotes.tsx`
- `src/components/agency/ActivityFeed.tsx`
- `src/services/agency/collaboration.service.ts`

**Effort:** 2 days

---

### 3.3 Agency API

**Requirements:**
- RESTful API for agency operations
- API key management
- Rate limiting per agency
- Webhook support

**Endpoints:**
```typescript
// Agency API endpoints

// Client management
POST   /api/v1/agency/clients              // Add new client
GET    /api/v1/agency/clients              // List all clients
GET    /api/v1/agency/clients/:id          // Get client details
PUT    /api/v1/agency/clients/:id          // Update client
DELETE /api/v1/agency/clients/:id          // Remove client
POST   /api/v1/agency/clients/bulk-import  // CSV import

// Campaigns
POST   /api/v1/agency/campaigns            // Create campaign
POST   /api/v1/agency/campaigns/clone      // Clone to multiple clients
GET    /api/v1/agency/campaigns            // List across clients

// Reports
GET    /api/v1/agency/reports              // List all reports
POST   /api/v1/agency/reports/generate     // Generate report
GET    /api/v1/agency/reports/:id/download // Download PDF

// Analytics
GET    /api/v1/agency/analytics/rollup     // Agency-wide analytics
GET    /api/v1/agency/analytics/compare    // Compare clients

// Webhooks
POST   /api/v1/agency/webhooks             // Register webhook
GET    /api/v1/agency/webhooks             // List webhooks
DELETE /api/v1/agency/webhooks/:id         // Remove webhook
```

**Files to create:**
- `src/api/agency/` (all endpoint handlers)
- `src/services/agency/api-auth.service.ts`
- `src/middleware/agency-api-auth.ts`

**Effort:** 2 days

---

## Phase 4: Billing & Packaging (1 week)

### 4.1 Usage Tracking

**Requirements:**
- Track usage per client
- Campaign count tracker
- API call monitoring
- Storage usage per agency
- Monthly usage reports

**Database schema:**
```sql
CREATE TABLE agency_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id),
  month DATE NOT NULL, -- First of month
  clients_count INTEGER DEFAULT 0,
  campaigns_created INTEGER DEFAULT 0,
  posts_scheduled INTEGER DEFAULT 0,
  reports_generated INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, month)
);
```

**Files to create:**
- `src/services/agency/usage-tracking.service.ts`
- `src/components/agency/UsageDashboard.tsx`

**Effort:** 2 days

---

### 4.2 Plan Enforcement

**Requirements:**
- Enforce client limits per plan
- Feature gating per plan tier
- Upgrade prompts when hitting limits
- Grace periods for overages

**Plan definitions:**
```typescript
interface AgencyPlan {
  id: string;
  name: string;
  maxClients: number;
  features: string[];
  monthlyPrice: number;
  annualPrice: number;
}

const AGENCY_PLANS: AgencyPlan[] = [
  {
    id: 'starter',
    name: 'Starter Agency',
    maxClients: 5,
    features: ['white_label', 'branded_reports', 'team_2'],
    monthlyPrice: 297,
    annualPrice: 2970
  },
  {
    id: 'growth',
    name: 'Growth Agency',
    maxClients: 15,
    features: ['white_label', 'branded_reports', 'team_5', 'api_access', 'priority_support'],
    monthlyPrice: 597,
    annualPrice: 5970
  },
  {
    id: 'scale',
    name: 'Scale Agency',
    maxClients: -1, // Unlimited
    features: ['white_label', 'branded_reports', 'team_unlimited', 'api_access', 'priority_support', 'dedicated_success', 'custom_integrations'],
    monthlyPrice: 997,
    annualPrice: 9970
  }
];
```

**Files to create:**
- `src/services/agency/plan-enforcement.service.ts`
- `src/components/agency/PlanLimits.tsx`
- `src/components/agency/UpgradePrompt.tsx`

**Effort:** 2 days

---

### 4.3 Billing Integration

**Requirements:**
- Stripe integration for agency billing
- Subscription management
- Invoice generation
- Upgrade/downgrade flows
- Usage-based add-ons

**Files to create:**
- `src/services/agency/billing.service.ts`
- `src/components/agency/BillingPortal.tsx`
- `src/pages/AgencyBillingPage.tsx`
- Supabase Edge Functions for Stripe webhooks

**Effort:** 3 days

---

## Phase 5: Agency-Specific Features (1 week)

### 5.1 Client Portal

**Requirements:**
- Separate login for end clients
- Limited view (only their campaigns)
- Comment/feedback system
- Approval buttons for campaigns
- View reports and analytics

**URL structure:**
- Agency team: `app.synapse.com/agency/dashboard`
- Client portal: `app.synapse.com/portal/[client-id]` or custom domain

**Files to create:**
- `src/pages/ClientPortal/`
- `src/components/portal/`
- `src/layouts/PortalLayout.tsx`

**Effort:** 3 days

---

### 5.2 Performance Benchmarking

**Requirements:**
- Compare clients within same industry
- Anonymous benchmark database
- "You're outperforming 73% of similar businesses"
- Trend analysis over time

**Implementation:**
```typescript
interface BenchmarkData {
  industry: string;
  metric: string;
  percentile: number;
  value: number;
  sampleSize: number;
  period: string;
}

async function getClientBenchmarks(
  clientId: string,
  industry: string
): Promise<BenchmarkData[]> {
  // Compare against anonymized data from all clients in industry
}
```

**Files to create:**
- `src/services/agency/benchmarking.service.ts`
- `src/components/agency/BenchmarkWidget.tsx`

**Effort:** 2 days

---

### 5.3 Training & Onboarding

**Requirements:**
- Agency onboarding checklist
- Video tutorials (Loom embeds)
- Certification program
- Co-branded knowledge base
- White-label training materials

**Implementation:**
- Create `/agency-training` route
- Embed training videos
- Track completion for certification
- Export training materials with agency branding

**Files to create:**
- `src/pages/AgencyTraining/`
- `src/components/training/`

**Effort:** 2 days

---

## Technical Implementation Priority

### Week 1-2: Foundation
1. Multi-tenant database structure
2. Agency/client account hierarchy
3. Role-based access control
4. Basic white-label branding (logo, colors)

### Week 3-4: Agency Tools
1. Agency dashboard
2. Client management
3. Bulk operations
4. Branded reports

### Week 5-6: Monetization
1. Plan enforcement
2. Billing integration
3. Usage tracking
4. API endpoints

### Week 7-8: Polish
1. Client portal
2. Benchmarking
3. Training materials
4. Testing & QA

---

## Quick Wins (Ship First)

**Day 1-2:**
1. Remove Synapse branding option (CSS toggle)
2. Logo upload setting
3. Basic agency dashboard view

**Week 1:**
1. Custom domain mapping
2. Branded PDF reports
3. Client list management
4. One-click client switching

**Why these first:** Agencies can start using immediately, even without full feature set.

---

## Don't Build (Use Existing Tools)

These features are NOT needed because agencies already have solutions:

- **Complex approval workflows** → They use Asana/Monday
- **Project management** → They use ClickUp/Notion
- **CRM features** → They use HubSpot/Pipedrive
- **Invoicing** → They use QuickBooks/FreshBooks
- **Time tracking** → They use Harvest/Toggl

Focus on what only Synapse can provide: **intelligence + campaign generation + white-label delivery**.

---

## Migration Path

**No rebuild required.** Add agency features as a layer:

```typescript
// src/App.tsx or router
function App() {
  const { user, isAgency } = useAuth();

  if (isAgency) {
    return <AgencyLayout />;
  }

  return <StandardLayout />; // Current SMB experience
}
```

Existing SMB features remain intact. Agency features are additive.

---

## Files to Create Summary

```
src/
├── components/
│   ├── agency/
│   │   ├── AgencyDashboard.tsx
│   │   ├── ClientCard.tsx
│   │   ├── ClientList.tsx
│   │   ├── ClientManager.tsx
│   │   ├── BrandingSettings.tsx
│   │   ├── TeamManagement.tsx
│   │   ├── InviteMember.tsx
│   │   ├── BulkActionModal.tsx
│   │   ├── ProposalBuilder.tsx
│   │   ├── UsageDashboard.tsx
│   │   ├── PlanLimits.tsx
│   │   └── BenchmarkWidget.tsx
│   ├── portal/
│   │   ├── PortalDashboard.tsx
│   │   ├── PortalCampaigns.tsx
│   │   └── PortalApproval.tsx
│   └── reports/
│       └── ReportBuilder.tsx
├── services/
│   ├── agency/
│   │   ├── multi-tenant.service.ts
│   │   ├── access-control.service.ts
│   │   ├── bulk-operations.service.ts
│   │   ├── collaboration.service.ts
│   │   ├── usage-tracking.service.ts
│   │   ├── plan-enforcement.service.ts
│   │   ├── billing.service.ts
│   │   ├── benchmarking.service.ts
│   │   └── proposal-generator.service.ts
│   └── white-label/
│       ├── branding.service.ts
│       └── report-generator.service.ts
├── pages/
│   ├── AgencyDashboardPage.tsx
│   ├── AgencyBillingPage.tsx
│   ├── AgencySettingsPage.tsx
│   └── ClientPortal/
├── api/
│   └── agency/
│       ├── clients.ts
│       ├── campaigns.ts
│       ├── reports.ts
│       └── analytics.ts
├── hooks/
│   ├── useAgencyContext.ts
│   └── usePermissions.ts
├── types/
│   └── agency.types.ts
└── layouts/
    ├── AgencyLayout.tsx
    └── PortalLayout.tsx
```

---

## Estimated Effort

| Phase | Duration | Hours |
|-------|----------|-------|
| Phase 1: Core White-Label | 2 weeks | 80 hrs |
| Phase 2: Agency Management | 2 weeks | 80 hrs |
| Phase 3: Scalability | 1 week | 40 hrs |
| Phase 4: Billing | 1 week | 40 hrs |
| Phase 5: Polish | 1 week | 40 hrs |
| **Total** | **8 weeks** | **320 hrs** |

---

## Success Metrics

**Launch Goals:**
- 5 beta agencies in month 1
- 20 paying agencies by month 3
- $10K MRR by month 3

**Product Metrics:**
- Agency onboarding < 30 minutes
- Client add time < 5 minutes
- Report generation < 30 seconds
- 95% uptime SLA

---

## Next Steps

1. **Validate with agencies** - Interview 5 target agencies
2. **Prioritize MVP** - Cut to 4-week scope for beta
3. **Design mockups** - UI/UX for agency dashboard
4. **Database migration** - Plan multi-tenant schema
5. **Pricing finalization** - Test $297/597/997 tiers

---

**Document Owner:** Product Team
**Last Updated:** November 21, 2024
**Status:** Ready for Review
