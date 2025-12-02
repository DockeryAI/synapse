# SYNAPSE ADMIN BUILD PLAN

## Executive Summary

Build a four-tier admin system (Global Admin → Tenant Admin → Brand Admin → User) with multi-tenant architecture, comprehensive API cost tracking, and hybrid billing (monthly subscription + per-token usage). Enables white-label agency offering with full margin visibility.

**Total Duration:** 15.5-21 weeks (4-5 months)
**MVP Duration:** 6.5 weeks to first invoice

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL ADMIN (You)                       │
│         Platform owner - sees everything, controls all      │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ TENANT ADMIN  │     │ TENANT ADMIN  │     │ TENANT ADMIN  │
│  (Agency)     │     │  (Agency)     │     │  (Agency)     │
│ Multi-brand   │     │ Multi-brand   │     │ Multi-brand   │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
   ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
   ▼         ▼           ▼         ▼           ▼         ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│ BRAND │ │ BRAND │   │ BRAND │ │ BRAND │   │ BRAND │ │ BRAND │
│ ADMIN │ │ ADMIN │   │ ADMIN │ │ ADMIN │   │ ADMIN │ │ ADMIN │
│(Client)│ │(Client)│   │(Client)│ │(Client)│   │(Client)│ │(Client)│
└───┬───┘ └───┬───┘   └───┬───┘ └───┬───┘   └───┬───┘ └───┬───┘
    │         │           │         │           │         │
  ┌─┴─┐     ┌─┴─┐       ┌─┴─┐     ┌─┴─┐       ┌─┴─┐     ┌─┴─┐
  ▼   ▼     ▼   ▼       ▼   ▼     ▼   ▼       ▼   ▼     ▼   ▼
┌───┐┌───┐┌───┐┌───┐  ┌───┐┌───┐┌───┐┌───┐  ┌───┐┌───┐┌───┐┌───┐
│USR││USR││USR││USR│  │USR││USR││USR││USR│  │USR││USR││USR││USR│
└───┘└───┘└───┘└───┘  └───┘└───┘└───┘└───┘  └───┘└───┘└───┘└───┘
```

---

## Four-Tier Permission Model

| Role | Scope | Can Manage | Can See |
|------|-------|------------|---------|
| **Global Admin** | Platform | Tenants, all users, all brands, billing, system | Everything |
| **Tenant Admin** | Agency | Brands, brand admins, agency users, agency billing | All brands in tenant |
| **Brand Admin** | Single Brand | Brand users, brand settings, brand content | Own brand only |
| **User** | Single Brand | Own content, own profile | Own brand only |

---

## Role Capabilities Matrix

| Capability | Global | Tenant | Brand Admin | User |
|------------|--------|--------|-------------|------|
| Create tenants | ✅ | ❌ | ❌ | ❌ |
| Manage tenant billing | ✅ | ✅ (own) | ❌ | ❌ |
| Create brands | ✅ | ✅ | ❌ | ❌ |
| Delete brands | ✅ | ✅ | ❌ | ❌ |
| Manage brand settings | ✅ | ✅ | ✅ (own) | ❌ |
| Invite brand admins | ✅ | ✅ | ❌ | ❌ |
| Invite brand users | ✅ | ✅ | ✅ (own) | ❌ |
| Remove brand users | ✅ | ✅ | ✅ (own) | ❌ |
| View brand content | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Generate content | ✅ | ✅ | ✅ | ✅ |
| Edit UVP | ✅ | ✅ | ✅ | ❌ |
| View usage/costs | ✅ | ✅ (tenant) | ✅ (brand) | ❌ |
| Impersonate | ✅ (all) | ✅ (own brands) | ❌ | ❌ |

---

## Billing Model: Hybrid (Monthly + Per-Token)

```
Monthly Base: $X/month
├── Includes: Y users, Z brands, N content pieces
├── Token Allowance: 500K tokens/month (example)
│
Overages:
├── Additional tokens: $0.002 per 1K tokens
├── Additional content: $0.10 per piece
└── Additional users: $10/user/month
```

---

## Phase Breakdown

### PHASE 1: Foundation (Multi-Tenant + Auth + Roles)
**Duration: 3-4 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Tenant Data Model | `tenants` table, `tenant_id` on all tables | 3 days |
| Role System | `user_roles` table, 4-tier hierarchy | 3 days |
| Brand Membership | `brand_users` table, brand-level roles | 2 days |
| RLS Policies | Tenant + brand isolation, role-based bypass | 3 days |
| Tenant Resolution | Domain/subdomain → tenant lookup | 1 day |
| Auth Activation | Enable existing auth, wire up routes | 2 days |
| Permission Helpers | `canManageBrand()`, `canInviteUser()`, etc. | 2 days |
| Migration Script | Add `tenant_id` to existing data | 2 days |
| Basic Admin Layout | Shell, nav, role-aware routing | 2 days |

**Deliverables:**
- Four-tier role system enforced
- Users scoped to brands they belong to
- Brand admins can only see their brand
- Permission checks throughout app

---

### PHASE 2: Global Admin Core
**Duration: 2-3 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Tenant Management | CRUD tenants, status, limits | 3 days |
| User Management | List all users, view details, actions | 3 days |
| Brand Overview | All brands, industry distribution | 2 days |
| Content Moderation | Global feed, filters, flag/archive | 3 days |
| Admin Audit Trail | Log all admin actions | 1 day |
| Impersonation | View-as-tenant, view-as-brand | 2 days |

**Deliverables:**
- See all tenants, users, brands, content
- Perform admin actions with audit trail
- Impersonate any tenant for support

---

### PHASE 3: API Cost Tracking
**Duration: 2-3 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| API Call Logging | Instrument all external API calls | 3 days |
| Token Counting | Track input/output tokens per LLM call | 2 days |
| Cost Calculation | Real-time cost estimation per call | 2 days |
| Rollup Aggregation | Hourly/daily/monthly summaries | 2 days |
| Provider Dashboard | Cost by provider, health status | 2 days |
| Tenant Cost View | Cost breakdown per tenant | 2 days |
| Brand Cost View | Cost breakdown per brand | 1 day |
| Feature Attribution | Tag costs to features | 2 days |

**Deliverables:**
- Every API call logged with cost
- Token usage tracked per tenant/user/brand
- Real-time cost dashboards
- Margin visibility per tenant

---

### PHASE 4: Billing System
**Duration: 3-4 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Stripe Integration | Products, Prices, Customers, Subscriptions | 3 days |
| Plan Management | CRUD plans, quotas, feature flags | 2 days |
| Subscription Flow | Signup → trial → paid conversion | 3 days |
| Usage Metering | Push token usage to Stripe | 2 days |
| Invoice Generation | Automatic via Stripe, display in admin | 2 days |
| Webhook Handlers | payment_success, failed, subscription changes | 3 days |
| Dunning Flow | Failed payment handling, grace period | 2 days |
| Billing Dashboard | Revenue, MRR, margins, alerts | 3 days |
| Tenant Billing UI | Usage meters, invoices, payment method | 3 days |

**Deliverables:**
- Plans with monthly base + token allowance
- Automatic overage billing
- Self-service subscription management
- Revenue and margin dashboards

---

### PHASE 5: Tenant Admin (White Label)
**Duration: 2-3 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Tenant Settings | Name, branding, custom domain | 2 days |
| White Label Branding | Logo, colors, custom CSS | 2 days |
| Brand Management | CRUD brands, assign brand admins | 2 days |
| Brand Admin Invites | Invite client users as brand admins | 1 day |
| Tenant Analytics | Usage by brand, content metrics | 3 days |
| Tenant Billing View | Their usage, costs, invoices | 2 days |
| Custom Domain | SSL provisioning, DNS verification | 2 days |

**Deliverables:**
- Agencies can customize branding
- Manage their own users and clients
- See their usage and billing
- Optional custom domain

---

### PHASE 5.5: Brand Admin
**Duration: 1.5-2 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Brand Admin Dashboard | Overview of their brand | 2 days |
| Brand User Management | Invite/remove users, set roles | 2 days |
| Brand Settings | Edit brand profile, voice, industry | 1 day |
| Brand Content View | All content for their brand | 1 day |
| Brand Usage Stats | Content count, simple metrics | 1 day |
| Brand Activity Log | Who did what | 1 day |
| UVP Management | Edit/regenerate UVP | 1 day |

**Deliverables:**
- Brand admins have their own admin view
- Can manage their team without agency involvement
- Self-service brand settings
- No visibility into other brands or tenant billing

---

### PHASE 6: Analytics & Polish
**Duration: 2 weeks**

| Component | Description | Effort |
|-----------|-------------|--------|
| Platform Analytics | User growth, content volume, funnels | 3 days |
| Revenue Analytics | MRR, ARR, churn, LTV, NRR | 2 days |
| System Health | Job status, error rates, API latency | 2 days |
| Alerts System | Budget, margin, usage, errors | 2 days |
| Data Export | GDPR compliance, CSV exports | 2 days |
| Documentation | Admin user guide | 2 days |

**Deliverables:**
- Full analytics suite
- Proactive alerting
- Compliance tooling
- Documentation

---

## Timeline Summary

| Phase | Name | Duration | Cumulative |
|-------|------|----------|------------|
| 1 | Foundation (Multi-Tenant + Auth + Roles) | 3-4 weeks | 3-4 weeks |
| 2 | Global Admin Core | 2-3 weeks | 5-7 weeks |
| 3 | API Cost Tracking | 2-3 weeks | 7-10 weeks |
| 4 | Billing System | 3-4 weeks | 10-14 weeks |
| 5 | Tenant Admin (White Label) | 2-3 weeks | 12-17 weeks |
| 5.5 | Brand Admin | 1.5-2 weeks | 13.5-19 weeks |
| 6 | Analytics & Polish | 2 weeks | 15.5-21 weeks |

**Total: 15.5-21 weeks (4-5 months)**

---

## MVP Path (Faster to Revenue)

| Phase | What | Duration |
|-------|------|----------|
| 1a | Auth + 4-Tier Roles + Single Tenant | 2.5 weeks |
| 3a | Basic Token Tracking | 1 week |
| 4a | Stripe + 2 Plans + Usage Billing | 2 weeks |
| 5.5a | Basic Brand Admin (user invite only) | 1 week |

**MVP Total: 6.5 weeks to first invoice with brand admins**

---

## Database Schema (New Tables)

### Core Tables

**`tenants`**
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
status TEXT DEFAULT 'active' -- active, suspended, canceled
plan_id UUID REFERENCES plans(id)
settings JSONB DEFAULT '{}'
branding JSONB DEFAULT '{}' -- logo, colors, fonts
custom_domain TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**`user_roles`**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
role_type TEXT NOT NULL -- global_admin, tenant_admin, brand_admin, user
scope_type TEXT -- null (global), 'tenant', 'brand'
scope_id UUID -- tenant_id or brand_id
granted_by UUID REFERENCES auth.users(id)
granted_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, role_type, scope_type, scope_id)
```

**`brand_users`**
```sql
brand_id UUID REFERENCES brands(id)
user_id UUID REFERENCES auth.users(id)
role TEXT DEFAULT 'user' -- admin, editor, viewer
invited_by UUID REFERENCES auth.users(id)
joined_at TIMESTAMPTZ DEFAULT NOW()
status TEXT DEFAULT 'active'
PRIMARY KEY (brand_id, user_id)
```

**`brand_invites`**
```sql
id UUID PRIMARY KEY
brand_id UUID REFERENCES brands(id)
email TEXT NOT NULL
role TEXT DEFAULT 'user'
invited_by UUID REFERENCES auth.users(id)
token TEXT UNIQUE NOT NULL
expires_at TIMESTAMPTZ NOT NULL
accepted_at TIMESTAMPTZ
```

**`tenant_domains`**
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
domain TEXT UNIQUE NOT NULL
ssl_status TEXT DEFAULT 'pending'
verified_at TIMESTAMPTZ
```

### Billing Tables

**`plans`**
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
monthly_price DECIMAL(10,2)
annual_price DECIMAL(10,2)
user_limit INTEGER
brand_limit INTEGER
content_limit INTEGER
token_limit INTEGER -- monthly token allowance
features JSONB DEFAULT '{}' -- feature flags
overage_rate_content DECIMAL(10,4)
overage_rate_tokens DECIMAL(10,6)
is_public BOOLEAN DEFAULT true
is_active BOOLEAN DEFAULT true
```

**`tenant_subscriptions`**
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
plan_id UUID REFERENCES plans(id)
stripe_subscription_id TEXT
stripe_customer_id TEXT
status TEXT -- active, past_due, canceled, trialing
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
cancel_at_period_end BOOLEAN DEFAULT false
trial_ends_at TIMESTAMPTZ
```

**`tenant_invoices`**
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
stripe_invoice_id TEXT
amount DECIMAL(10,2)
currency TEXT DEFAULT 'usd'
status TEXT -- draft, open, paid, void, uncollectible
period_start TIMESTAMPTZ
period_end TIMESTAMPTZ
line_items JSONB
paid_at TIMESTAMPTZ
pdf_url TEXT
```

### API Cost Tables

**`api_providers`**
```sql
id UUID PRIMARY KEY
name TEXT UNIQUE NOT NULL -- openrouter, apify, serper, etc.
cost_model TEXT NOT NULL -- per_call, per_token, per_result
base_rate DECIMAL(10,6)
rate_per_unit DECIMAL(10,6)
status TEXT DEFAULT 'active'
```

**`api_calls`** (partitioned by month)
```sql
id UUID PRIMARY KEY
timestamp TIMESTAMPTZ DEFAULT NOW()
tenant_id UUID REFERENCES tenants(id)
user_id UUID REFERENCES auth.users(id)
brand_id UUID REFERENCES brands(id)
provider_id UUID REFERENCES api_providers(id)
endpoint TEXT
request_tokens INTEGER
response_tokens INTEGER
result_count INTEGER
latency_ms INTEGER
status_code INTEGER
estimated_cost DECIMAL(10,6)
feature_tag TEXT -- uvp_generation, content_generation, intelligence
```

**`api_cost_rollups`**
```sql
tenant_id UUID REFERENCES tenants(id)
provider_id UUID REFERENCES api_providers(id)
feature_tag TEXT
period_type TEXT -- hourly, daily, monthly
period_start TIMESTAMPTZ
call_count INTEGER
total_cost DECIMAL(10,2)
avg_latency INTEGER
error_count INTEGER
PRIMARY KEY (tenant_id, provider_id, feature_tag, period_type, period_start)
```

**`usage_records`**
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
brand_id UUID REFERENCES brands(id)
period_start TIMESTAMPTZ
period_end TIMESTAMPTZ
content_count INTEGER DEFAULT 0
token_count INTEGER DEFAULT 0
reported_to_stripe BOOLEAN DEFAULT false
stripe_usage_record_id TEXT
```

### Audit Tables

**`admin_audit_log`**
```sql
id UUID PRIMARY KEY
actor_id UUID REFERENCES auth.users(id)
actor_role TEXT
action TEXT NOT NULL
target_type TEXT -- tenant, brand, user, content
target_id UUID
metadata JSONB
ip_address INET
user_agent TEXT
timestamp TIMESTAMPTZ DEFAULT NOW()
```

**`billing_events`**
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
event_type TEXT NOT NULL
stripe_event_id TEXT
payload JSONB
processed_at TIMESTAMPTZ DEFAULT NOW()
```

---

## RLS Policy Examples

```sql
-- Tenant isolation
CREATE POLICY tenant_isolation ON brands
  USING (
    tenant_id = get_current_tenant_id()
    OR is_global_admin(auth.uid())
  );

-- Brand-level isolation
CREATE POLICY brand_user_access ON v4_generated_content
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
    OR is_tenant_admin(auth.uid(), tenant_id)
    OR is_global_admin(auth.uid())
  );

-- Brand admin can manage brand users
CREATE POLICY brand_admin_manage_users ON brand_users
  FOR ALL USING (
    (
      brand_id IN (
        SELECT brand_id FROM brand_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    OR is_tenant_admin(auth.uid(), (SELECT tenant_id FROM brands WHERE id = brand_id))
    OR is_global_admin(auth.uid())
  );
```

---

## Invitation Flow

### Tenant Admin invites Brand Admin:
1. Tenant admin creates brand, enters client email
2. System creates `brand_invites` record with role='admin'
3. Email sent to client with invite link
4. Client clicks → signup/login → auto-added as brand admin
5. Client can now invite their own team

### Brand Admin invites User:
1. Brand admin enters team member email
2. System creates `brand_invites` record with role='user'
3. Email sent with invite link
4. Team member clicks → signup/login → added to brand as user

---

## Global Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  SYNAPSE ADMIN COMMAND CENTER                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💰 MRR: $24,750  (+$2,100 this month)                     │
│  📈 ARR: $297,000                                          │
│  🔄 Net Revenue Retention: 112%                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  COSTS (This Month)                    MARGIN               │
│  ├─ OpenRouter:     $1,847             │                   │
│  ├─ Apify:          $423               │  Revenue: $24,750 │
│  ├─ Serper:         $312               │  Costs:   $3,102  │
│  ├─ Perplexity:     $289               │  ─────────────────│
│  ├─ Other:          $231               │  Margin:  $21,648 │
│  └─ TOTAL:          $3,102             │  (87.5%)  ✅      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  NEEDS ATTENTION                                        │
│  ├─ 3 failed payments (retry scheduled)                    │
│  ├─ 2 tenants at >100% usage (overage billing)             │
│  └─ 1 tenant margin <50% (investigate)                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📊 PLATFORM HEALTH                                         │
│  ├─ Tenants: 47 active │ 12 trial │ 3 past due            │
│  ├─ Brands: 284 total │ 47 created this month             │
│  ├─ Users: 892 total │ 156 active today                   │
│  └─ Content: 12,847 pieces │ 2,341 this week              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Additions

| Component | Technology |
|-----------|------------|
| Payments | Stripe Billing + Usage Records |
| Auth | Supabase Auth (existing) |
| Admin UI | React + existing component library |
| Charts | Recharts or Tremor |
| Custom Domains | Vercel/Netlify + Let's Encrypt |
| Background Jobs | Supabase Edge Functions + pg_cron |
| Email | Resend or SendGrid |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Token counting accuracy | Use OpenRouter's response metadata, validate against invoices |
| Stripe webhook failures | Idempotent handlers, retry queue, manual reconciliation tool |
| Tenant data leaks | RLS policies + integration tests + audit logging |
| Cost overruns | Real-time alerts, hard caps option, circuit breakers |
| Migration breaks existing users | Feature flags, gradual rollout, rollback plan |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first paid tenant | < 6.5 weeks |
| Cost tracking accuracy | > 99% |
| Margin visibility | Real-time, per-tenant |
| Admin action audit coverage | 100% |
| Tenant onboarding time | < 10 minutes |
| Brand admin self-service rate | > 80% |

---

## File Structure (New)

```
src/
├── components/
│   └── admin/
│       ├── global/
│       │   ├── TenantManagement.tsx
│       │   ├── UserManagement.tsx
│       │   ├── ContentModeration.tsx
│       │   ├── BillingDashboard.tsx
│       │   ├── CostAnalytics.tsx
│       │   └── SystemHealth.tsx
│       ├── tenant/
│       │   ├── TenantDashboard.tsx
│       │   ├── BrandManagement.tsx
│       │   ├── TenantSettings.tsx
│       │   ├── TenantBilling.tsx
│       │   └── TenantAnalytics.tsx
│       ├── brand/
│       │   ├── BrandDashboard.tsx
│       │   ├── BrandUserManagement.tsx
│       │   ├── BrandSettings.tsx
│       │   └── BrandActivity.tsx
│       └── shared/
│           ├── AdminLayout.tsx
│           ├── RoleGuard.tsx
│           ├── UsageMeters.tsx
│           └── InviteModal.tsx
├── services/
│   └── admin/
│       ├── tenant.service.ts
│       ├── roles.service.ts
│       ├── billing.service.ts
│       ├── cost-tracking.service.ts
│       ├── usage.service.ts
│       └── audit.service.ts
├── hooks/
│   └── admin/
│       ├── useRoles.ts
│       ├── useTenant.ts
│       ├── useBilling.ts
│       └── useCostTracking.ts
└── pages/
    └── admin/
        ├── GlobalAdminPage.tsx
        ├── TenantAdminPage.tsx
        └── BrandAdminPage.tsx
```

---

*Generated: 2025-12-01*
*Author: Build Runner 3.0*
