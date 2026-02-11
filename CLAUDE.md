# CLAUDE.md — FieldOps AI Assistant Guide

## Project Overview

**FieldOps** is a construction field intelligence platform built for **Blackstone Construction**. It is a mobile-first, offline-capable Progressive Web App (PWA) that enables superintendents, foremen, and project managers to record daily field activities, track legal/contractual events, analyze productivity, and generate reports with litigation support.

**Domain**: Heavy commercial construction (concrete, steel, site work). The application has a strong legal orientation — daily logs are structured to support delay claims, overhead recovery (Eichleay formula), measured mile analysis, and schedule impact litigation.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | 5 |
| UI | React | 18 |
| Styling | Tailwind CSS | 3.4.1 |
| Icons | Lucide React | 0.563.0 |
| State | Zustand | 5.0.11 |
| Database | IndexedDB via Dexie.js | 4.3.0 |
| Linting | ESLint | 8 |
| Image Processing | Sharp | 0.34.5 |

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint (next/core-web-vitals + next/typescript)
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run check        # Full validation: lint + typecheck + build
```

**Always run `npm run check` before committing** to ensure lint, type checking, and build all pass.

## Project Structure

```
src/
├── app/                        # Next.js 14 App Router pages
│   ├── layout.tsx              # Root layout (PWA metadata)
│   ├── page.tsx                # Home dashboard
│   ├── globals.css             # Global styles
│   ├── daily-log/              # Daily log entry (12-screen form)
│   ├── jha/                    # Job Hazard Analysis
│   ├── project-setup/          # Project configuration
│   ├── analytics/              # Productivity analytics dashboard
│   ├── reports/                # Weekly & legal report generation
│   ├── productivity/           # Unit rate tracking
│   ├── bid-feedback/           # Bid vs. actual analysis
│   ├── notice-log/             # Contractual notice tracking
│   ├── causation/              # Legal dispute timeline
│   ├── settings/               # App configuration
│   └── api/                    # API routes
│       ├── jha/route.ts        # JHA generation (Claude AI)
│       └── reports/route.ts    # Report generation (Claude AI)
├── components/
│   ├── layout/                 # AppShell, BottomNav, Header, Breadcrumb
│   ├── daily-log/              # 12 form screen components
│   ├── jha/                    # JHA-specific components
│   ├── project-setup/          # Project setup components
│   └── ui/                     # Reusable: BigButton, StatusBadge, ProgressBar, EmptyState
├── lib/
│   ├── types.ts                # All TypeScript interfaces (~812 lines)
│   ├── db.ts                   # Dexie.js IndexedDB schema (v2, 16 tables)
│   ├── store.ts                # Zustand global state
│   ├── analytics-engine.ts     # Productivity analytics computation
│   ├── productivity-engine.ts  # Measured mile analysis engine
│   ├── jha-prompts.ts          # AI prompt templates for JHA generation
│   └── report-prompts.ts       # AI prompt templates for reports/legal letters
└── data/
    ├── csi-divisions.ts        # CSI division reference data
    ├── demo-project.ts         # Sample project for development
    ├── demo-logs.ts            # Sample daily logs
    ├── demo-cost-codes.ts      # Sample cost codes
    └── demo-analytics-seed.ts  # Sample analytics data
```

## Architecture

### Data Flow

```
Daily Log Form (12 screens) → Save to IndexedDB (Dexie.js)
  → Productivity Engine (derive entries from work performed)
  → Analytics Engine (recompute metrics, baselines, trends)
  → Dashboard / Reports / Attorney Tools
```

### Client-Side Database (Dexie.js / IndexedDB)

All data is stored client-side in IndexedDB via Dexie.js. The schema is at version 2 with 16 tables:

- **Core**: `projects`, `dailyJHAs`, `dailyLogs`, `weeklyReports`, `changeOrders`, `legalCorrespondence`
- **Litigation**: `delayEvents`, `safetyIncidents`, `noticeLogs`
- **Productivity**: `costCodes`, `productivityEntries`, `productivityBaselines`, `productivityAnalytics`, `unitPriceLibrary`, `bidFeedbackReports`, `scheduleBaselines`

Helper functions in `db.ts` provide typed queries (e.g., `getActiveProject()`, `getDailyLogsForWeek()`, `getDelayEventsForProject()`).

### State Management (Zustand)

`src/lib/store.ts` exports `useAppStore` — a lightweight Zustand store for UI coordination:
- Active project context
- Current date (ISO string)
- JHA and Daily Log form state
- Daily log screen navigation
- Claude API key setting
- Loading state

### AI Integration

API routes at `src/app/api/jha/route.ts` and `src/app/api/reports/route.ts` accept structured data and use prompt templates from `src/lib/jha-prompts.ts` and `src/lib/report-prompts.ts` to generate:
- Job Hazard Analyses and toolbox talks
- Weekly client/owner reports
- Change order documentation
- Legal correspondence (delay notices, claim letters)

## Key Conventions

### TypeScript

- **Strict mode** is enabled (`tsconfig.json` → `"strict": true`)
- All types are centralized in `src/lib/types.ts`
- Use the `@/*` path alias for imports (maps to `./src/*`)
- Prefer interfaces over type aliases for object shapes

### Styling

- **Tailwind CSS only** — no CSS modules or styled-components
- Custom Blackstone brand palette defined in `tailwind.config.ts`:
  - Primary: `onyx` (#000), `alabaster` (#f2f0e6), `slate` (#2d2d2f)
  - Accents: `accent-green`, `accent-amber`, `accent-red`
  - Surfaces: `surface-primary`, `surface-secondary`, `surface-elevated`, `surface-dark`
- Field-optimized typography: minimum 18px (`field-base`), scale up with `field-lg`, `field-xl`, etc.
- Touch targets: minimum 44px (`touch-min`), standard 56px (`touch-target`), large 72px (`touch-large`)
- Font families: `font-heading` (Avenir) and `font-body` (Avenir Next LT Pro)

### Components

- **Layout hierarchy**: `AppShell` → `Header` → page content → `BottomNav`
- `AppShell` initializes the database and seeds demo data on first load
- Daily log uses a 12-screen wizard pattern, each screen is a separate component in `src/components/daily-log/`
- Reusable UI components live in `src/components/ui/` (BigButton, StatusBadge, ProgressBar, EmptyState)
- `<img>` tags are allowed (ESLint rule `@next/next/no-img-element` is off)

### CSI Division Structure

All work activities are organized by Construction Specifications Institute (CSI) divisions (e.g., 03 = Concrete, 05 = Metals). Cost codes follow the format `DD-XXXX-X` where DD is the CSI division number. This standardization is used across daily logs, productivity tracking, and reporting.

### Data Patterns

- All entities use string IDs (typically UUIDs)
- All entities are keyed by `projectId` for multi-project support
- Dates are stored as ISO strings (`YYYY-MM-DD`)
- Litigation-related entities maintain cross-references via ID arrays (e.g., `relatedChangeIds`, `relatedDelayEventIds`) forming causation chains

## Linting & Type Checking

**ESLint** extends `next/core-web-vitals` and `next/typescript`. The only custom rule disables `@next/next/no-img-element`.

**TypeScript** uses strict mode with `noEmit: true` (Next.js handles compilation). Path alias `@/*` resolves to `./src/*`.

Run `npm run lint` for ESLint and `npm run typecheck` for TypeScript validation. Both must pass before merging.

## Testing

No testing framework is currently configured. Validation is done via:
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking
- `npm run build` — Next.js production build (catches runtime issues)
- `npm run check` — Runs all three sequentially

## Security Considerations

- **API keys**: The Claude API key is stored in Zustand state (client-side) and passed to API routes. Never commit API keys. Environment variables (`.env.local`) are gitignored.
- **Client-side database**: All data is in IndexedDB. No server-side database or authentication exists yet.
- **API routes**: `src/app/api/` routes should validate input and use parameterized queries if a server database is added.
- **No user authentication** currently — the app runs as a single-user local tool.

## Development Notes

- The app is **offline-capable** — IndexedDB persists data in the browser
- **PWA** configured with `public/manifest.json` and app icons
- **Mobile-first** design — all UI optimized for field use on phones/tablets with safe area insets
- Demo data seeds automatically via `AppShell` on first load (see `src/data/` for seed data)
- No backend server required for core functionality — AI features need a Claude API key configured in Settings
