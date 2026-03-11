# Detecta Core — Architecture Guide

> Reference document for LLMs and developers navigating the codebase.
> Last updated: 2026-03-11

---

## 1. Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Language | TypeScript (strict: false) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| State/Data | TanStack Query v5 (react-query) |
| Routing | react-router-dom v6 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions + Realtime + Storage) |
| Charts | Recharts |
| Maps | Mapbox GL |
| PDF | @react-pdf/renderer, jspdf |
| Rich Text | TipTap |
| Drag & Drop | @dnd-kit |
| PWA | vite-plugin-pwa |

**No SSR, no Next.js, no backend server code.** All server logic lives in Supabase Edge Functions (Deno runtime).

---

## 2. Project Structure

```
src/
├── assets/            # Static images, logos
├── components/        # UI components grouped by domain
│   ├── ui/            # shadcn/ui primitives (Button, Dialog, Card, etc.)
│   ├── layout/        # AppShell, Sidebar, TopBar, navigation
│   ├── admin/         # User management, roles, permissions
│   ├── monitoring/    # Real-time service monitoring (C5)
│   ├── planeacion/    # Service planning & scheduling
│   ├── leads/         # CRM pipeline, lead management
│   ├── supply/        # Supply chain, pricing, routes
│   ├── custodian/     # Custodian field portal
│   ├── armado/        # Armed guard field portal
│   ├── instalacion/   # GPS installation management
│   ├── siercp/        # Security evaluation module
│   ├── tickets/       # Internal support ticketing
│   ├── lms/           # Learning management system
│   ├── reports/       # Report hub & exports
│   ├── starmap/       # Strategic planning (StarMap)
│   ├── financial/     # Billing & invoicing
│   ├── incidentes/    # Incident tracking (RRSS, operational)
│   ├── recruitment/   # Talent acquisition pipeline
│   ├── security/      # SecurityWrapper, audit components
│   ├── shared/        # Cross-domain reusable components
│   ├── dashboard/     # KPI widgets, home dashboard cards
│   └── ...            # Other domain-specific folders
│
├── config/            # App configuration constants
├── constants/         # Business constants (accessControl.ts is critical)
├── contexts/          # React contexts
│   ├── AuthContext.tsx      # Primary auth provider (user, role, session)
│   ├── SandboxContext.tsx   # Development sandbox mode
│   ├── DraftResumeContext.tsx
│   └── EditWorkflowContext.tsx
│
├── data/              # Static data, mock data, seed data
├── docs/              # In-app documentation content
├── hooks/             # Custom hooks (~300+ files, domain-organized)
├── integrations/
│   └── supabase/
│       ├── client.ts  # Supabase client instance (import from here)
│       └── types.ts   # Auto-generated DB types (READ-ONLY)
│
├── layouts/
│   ├── AuthLayout.tsx       # Public/auth pages layout
│   ├── DashboardLayout.tsx  # Authenticated admin layout (sidebar + topbar)
│   └── UnifiedLayout.tsx    # Unified responsive layout
│
├── lib/               # Utility libraries (cn(), etc.)
├── pages/             # Route page components
│   ├── Home/          # Main dashboard
│   ├── Monitoring/    # C5 monitoring center
│   ├── Planeacion/    # Service planning
│   ├── Leads/         # CRM/Sales
│   ├── Facturacion/   # Billing
│   ├── CustomerSuccess/ # CS portal
│   ├── LMS/           # Learning platform
│   ├── Reportes/      # Reports hub
│   ├── StarMap/       # Strategic planning
│   ├── Tickets/       # Support tickets
│   ├── custodian/     # Custodian field portal
│   ├── armado/        # Armed guard field portal
│   ├── Installers/    # Installer field portal
│   └── ...
│
├── services/          # Business logic services
├── styles/            # Additional CSS
├── types/             # TypeScript type definitions
│   ├── roleTypes.ts   # Role union type, Permission interface
│   └── supabase-lite.ts
│
├── utils/             # Pure utility functions
├── App.tsx            # Route definitions & providers
├── main.tsx           # App entry point
└── index.css          # Tailwind base + design tokens (CSS variables)
```

---

## 3. Authentication & Authorization

### Auth Flow

```
main.tsx → AuthContext.Provider (wraps entire app)
  └── useStableAuth() → supabase.auth.onAuthStateChange()
      └── get_current_user_role_secure() RPC → returns effective role
```

### Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Primary auth context. Exposes `user`, `userRole`, `loading`, `session` |
| `src/hooks/useStableAuth.ts` | Manages auth state, listens for auth events, resolves role via RPC |
| `src/hooks/useUserRole.ts` | Multi-role support (all active roles + primary role) |
| `src/constants/accessControl.ts` | **Single source of truth** for role-based access lists |
| `src/types/roleTypes.ts` | `Role` union type with all 27 roles |

### Roles (from `user_roles` table — NEVER stored on profiles)

```typescript
type Role =
  | 'owner' | 'admin'                              // Super admin
  | 'supply_admin' | 'coordinador_operaciones'      // Management
  | 'capacitacion_admin' | 'bi'                     // Management
  | 'jefe_seguridad' | 'analista_seguridad'          // Security
  | 'supply_lead' | 'ejecutivo_ventas' | 'supply'   // Sales/Supply
  | 'monitoring_supervisor' | 'monitoring'           // C5 Monitoring
  | 'custodio' | 'armado' | 'instalador'             // Field operators
  | 'planificador' | 'soporte'                       // Operations
  | 'facturacion_admin' | 'facturacion'              // Billing
  | 'finanzas_admin' | 'finanzas'                    // Finance
  | 'customer_success'                                // CS
  | 'pending' | 'unverified';                        // Pre-activation
```

### Route Protection Components

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Requires authenticated user |
| `RoleProtectedRoute` | Requires specific role(s) |
| `RoleBlockedRoute` | Blocks field operators from admin routes, redirects to their portal |
| `PermissionProtectedRoute` | Granular permission check |
| `SmartHomeRedirect` | Redirects to role-appropriate landing page |

### Security Rules

1. **Roles live in `user_roles` table** — never on `profiles`
2. **Server-side validation** via `get_current_user_role_secure()` RPC
3. **RLS policies** enforce data access at database level
4. **Never use localStorage/sessionStorage for auth/role checks**
5. **`accessControl.ts`** is the single source for role lists — import from there

---

## 4. Data Architecture

### Supabase Client

```typescript
// Always import from here:
import { supabase } from '@/integrations/supabase/client';
```

### Query Patterns

| Pattern | When to use |
|---------|------------|
| `useAuthenticatedQuery()` | Standard authenticated data fetching (wraps TanStack Query with session check) |
| `supabase.from('table').select()` | Simple CRUD operations |
| `supabase.rpc('function_name')` | Complex queries, aggregations, security-sensitive operations |
| `supabase.channel().on()` | Real-time subscriptions |

### useAuthenticatedQuery Configs

```typescript
// Standard — data that changes regularly (30s stale)
useAuthenticatedQuery(['key'], queryFn, { config: 'standard' });

// Static — rarely changes (10min stale)
useAuthenticatedQuery(['key'], queryFn, { config: 'static' });

// Critical — must be fresh (10s stale, auto-refetch)
useAuthenticatedQuery(['key'], queryFn, { config: 'critical' });
```

### Key Database Tables

| Table | Domain |
|-------|--------|
| `servicios_custodia` | Core: custody services (daily operations) |
| `servicios_planificados` | Planning: scheduled services |
| `servicios_monitoreo` | Monitoring: client service contracts |
| `leads` | CRM: sales pipeline |
| `user_roles` | Auth: role assignments |
| `profiles` | Auth: user profiles |
| `armados_operativos` | Operations: armed guard registry |
| `asignacion_armados` | Operations: guard-to-service assignments |
| `matriz_precios_rutas` | Supply: route pricing matrix |
| `tickets` | Support: internal tickets |
| `incidentes_rrss` | Security: social media incidents |

---

## 5. Key Hooks Reference

### Operations & Monitoring

| Hook | Data Source | Purpose |
|------|-----------|---------|
| `useServiciosTurnoLive` | `servicios_custodia` + realtime | Live service tracking for current shift |
| `useServiciosTurno` | `servicios_custodia` | Service list for a specific shift |
| `usePerformanceHistorico` | `servicios_planificados` + `servicios_custodia` | Historical performance metrics |
| `usePerformanceDiario` | `servicios_custodia` | Daily performance KPIs |
| `useScheduledServices` | `servicios_planificados` | Upcoming scheduled services |
| `usePlaneacion` | `servicios_planificados` | Planning module data |
| `useMonitoristaAssignment` | `bitacora_asignaciones_monitorista` | Monitor-to-service assignments |
| `useShiftHandoff` | `bitacora_entregas_turno` | Shift handoff management |

### CRM & Sales

| Hook | Data Source | Purpose |
|------|-----------|---------|
| `useLeadsUnified` | `leads` | Unified lead management |
| `useCrmPipeline` | `leads` | Pipeline visualization |
| `useCrmForecast` | `leads` + RPC | Sales forecast |
| `usePrices` | `matriz_precios_rutas` | Route pricing |

### Field Portals

| Hook | Data Source | Purpose |
|------|-----------|---------|
| `useCustodianServices` | `servicios_custodia` | Custodian's assigned services |
| `useCustodianProfile` | `profiles` + `user_roles` | Custodian profile data |
| `useArmadoServices` | `asignacion_armados` | Armed guard assignments |
| `useArmadoProfile` | `armados_operativos` | Guard profile data |

### Dashboards

| Hook | Data Source | Purpose |
|------|-----------|---------|
| `useHomeData` | Multiple RPCs | Home dashboard KPIs |
| `useDashboardData` | Multiple tables | Main dashboard |
| `useStarMapKPIs` | Aggregated | Strategic planning metrics |
| `useSupplyDashboard` | `leads` + pricing | Supply chain overview |

---

## 6. Edge Functions

All in `supabase/functions/`. Deno runtime, TypeScript.

### Operations
- `estimar-duracion-servicio` — Service duration estimation
- `auditar-km-recorridos` — Route km auditing
- `calculate-truck-route` — Mapbox route calculation
- `auto-detectar-incumplimientos` — Auto-detect SLA violations
- `auto-reactivar-operativos` — Auto-reactivate operatives
- `calcular-precision-mensual` — Monthly accuracy calculation

### Auth & User Management
- `create-custodian-account` — Create custodian user
- `create-armado-account` — Create armed guard user
- `create-staff-account` — Create staff user
- `create-readonly-access` — Read-only access provisioning
- `generate-recovery-link` — Password recovery
- `assign-role`, `create-role`, `update-role`, `delete-role` — Role CRUD
- `add-permission` — Permission management

### Integrations
- `kapso-send-message`, `kapso-send-template`, `kapso-webhook-receiver` — WhatsApp (Kapso)
- `pipedrive-sync`, `pipedrive-webhook` — CRM sync
- `dialfire-webhook` — Call center
- `vapi-call`, `vapi-call-test`, `vapi-webhook-receiver` — Voice AI
- `resend-webhook` — Email
- `mapbox-token` — Map tokens

### AI & Analysis
- `ai-recruitment-analysis` — AI recruitment scoring
- `analyze-interview` — Interview analysis
- `siercp-ai-assistant` — Security evaluation AI
- `lms-ai-assistant` — Learning AI
- `support-chat-bot` — Support chatbot
- `cs-voc-analysis` — Voice of Customer analysis
- `research-gps-devices` — GPS device research
- `route-intelligence-report` — Route intelligence

### Security & Incidents
- `twitter-incident-search`, `firecrawl-incident-search` — Incident monitoring
- `procesar-incidente-rrss` — Social media incident processing
- `recalculate-zone-scores` — Risk zone recalculation
- `seed-risk-zones` — Risk zone seeding

### Documents
- `generar-contrato-pdf` — Contract PDF generation
- `generate-siercp-report` — Security evaluation report
- `ocr-documento` — Document OCR
- `send-custodian-invitation` — Invitation emails

---

## 7. UI Patterns

### Mobile-First

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

const isMobile = useIsMobile();
// Use compact pill/card layout on mobile
// Full table/grid layout on desktop
```

### Layout Hierarchy

```
App.tsx
├── AuthLayout          → Public pages (login, register, landing)
├── DashboardLayout     → Authenticated admin pages (sidebar + topbar)
│   └── Sidebar + TopBar + Content area
└── UnifiedLayout       → Special unified views
```

### Component Conventions

- **shadcn/ui** for all base components — never create custom buttons, dialogs, etc.
- **Tailwind semantic tokens** — use `bg-background`, `text-foreground`, `border-border`, etc.
- **Never hardcode colors** — use CSS variables from `index.css`
- **Framer Motion** is NOT installed — use CSS transitions or Tailwind animations
- **Design tokens** defined in `index.css` as CSS custom properties (HSL format)

### State Management

- **Server state**: TanStack Query (no Redux, no Zustand)
- **Local state**: React useState/useReducer
- **Auth state**: AuthContext
- **Form state**: react-hook-form + zod validation

---

## 8. Business Domain Glossary

| Term | Description |
|------|-------------|
| **Servicio de Custodia** | A custody/escort service (armed transport security) |
| **Custodio** | Custody agent (field operator) |
| **Armado** | Armed guard (field operator) |
| **Instalador** | GPS device installer (field operator) |
| **SIERCP** | Security risk evaluation system |
| **C5** | Monitoring center (Centro de Comando, Control, Comunicaciones, Cómputo y Contacto) |
| **Planificador** | Service planner/scheduler |
| **Lead** | Sales prospect in CRM pipeline |
| **Ruta** | Service route (origin → destination) |
| **Folio** | Service tracking number |
| **Monitorista** | Real-time service monitor operator |
| **StarMap** | Strategic business planning module |
| **LMS** | Internal learning management system |
| **GMV** | Gross Merchandise Value (revenue metric) |

---

## 9. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Hooks | `use[Entity/Feature].ts` | `useLeadsUnified.ts` |
| Pages | `PascalCase/index.tsx` or `PascalCase.tsx` | `pages/Monitoring/` |
| Components | `PascalCase.tsx` in domain folder | `components/leads/LeadCard.tsx` |
| Constants | `camelCase.ts` | `constants/accessControl.ts` |
| Services | `camelCase + Service.ts` | `services/planeacionService.ts` |
| Types | `camelCase + Types.ts` | `types/roleTypes.ts` |
| Contexts | `PascalCase + Context.tsx` | `contexts/AuthContext.tsx` |

---

## 10. Critical Files — Read Before Modifying

| Module | Must-read files |
|--------|----------------|
| **Any module** | `src/constants/accessControl.ts`, `src/types/roleTypes.ts` |
| **Auth** | `src/contexts/AuthContext.tsx`, `src/hooks/useStableAuth.ts` |
| **Routes** | `src/App.tsx` |
| **Layout** | `src/layouts/DashboardLayout.tsx`, `src/components/layout/` |
| **Leads/CRM** | `src/hooks/useLeadsUnified.ts`, `src/pages/Leads/` |
| **Monitoring** | `src/hooks/useServiciosTurnoLive.ts`, `src/pages/Monitoring/` |
| **Planning** | `src/hooks/usePlaneacion.ts`, `src/services/planeacionService.ts` |
| **Billing** | `src/pages/Facturacion/`, `src/hooks/useFinancialSystem.ts` |
| **Styling** | `src/index.css`, `tailwind.config.ts` |
