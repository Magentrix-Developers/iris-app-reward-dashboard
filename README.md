# Reward Dashboard — Magentrix IRIS App

A production-ready example of a custom IRIS microfrontend built on the **Magentrix Platform**, demonstrating how to build rich, data-driven dashboards entirely through the Magentrix REST API — without modifying any platform code.

---

## What This Is

The Reward Dashboard gives program managers complete visibility into their rewards data across six screens:

| Screen | Purpose |
|---|---|
| **Reward Discovery** | Groups rewards by linked entity type (Opportunity, Lead, Login History, etc.) with totals |
| **Combined Report** | Full paginated table with status/search filters, record name resolution, and CSV export |
| **Who Earned What** | User attribution leaderboard with collapsible per-user reward breakdowns and pagination |
| **Program Performance** | Approval rate analysis with entity breakdown per program |
| **Anomaly Report** | Scans all reward records to detect orphaned linked records |
| **Trends** | Month-over-month stacked bar chart with count/value toggle |

All screens share a global date range filter and lazy-load linked record names 10 at a time.

---

## The Core Technical Challenge — Polymorphic RecordId

The Reward entity has a `RecordId` field that can point to **any entity type** — a Lead, Opportunity, Login History, Contact, or any custom entity. The entity type is encoded only in the first 3 characters of the ID (e.g. `7OP` = Login History, `006` = Opportunity).

This app solves this at runtime by:
1. Querying the Magentrix **Entity registry** via the API to build a dynamic prefix → entity map
2. Using the prefix to determine the entity type for each reward
3. Lazy-loading the actual record name from the correct entity endpoint, only for the visible page

This pattern works for any Magentrix portal regardless of which entity types are in use.

---

## Tech Stack

- **[IRIS](https://www.magentrix.com)** — Magentrix microfrontend framework (Module Federation)
- **Vue 3** + TypeScript + Vite
- **Magentrix SDK** (`@magentrix-corp/magentrix-sdk`)
- **Magentrix REST API v3** + MEQL query language
- Portal CSS variables (`--mag-*`) for native theming — no Tailwind, no external CSS

---

## Prerequisites

- Node.js 20+
- A Magentrix portal with the Reward entity enabled
- A refresh token from your portal (Admin → Profile → API Tokens)
- `magentrix-cli` installed globally: `npm install -g @magentrix-corp/magentrix-cli`
- Dev SSL certificates (`server.key` / `server.crt`) in the project root

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Magentrix-Developers/iris-app-reward-dashboard.git
cd iris-app-reward-dashboard

# 2. Install dependencies
npm install

# 3. Configure your environment
cp .env.example .env.development
# Edit .env.development with your portal URL and refresh token

# 4. Start the dev server
magentrix vue-run-dev
# App runs at https://localhost:5173
```

---

## Deployment

```bash
# Build for production
magentrix vue-run-build

# Upload dist/ to your portal at:
# /contents/iris-app/reward-dashboard/

# Then register the app in your portal admin:
# Name: Reward Dashboard
# Remote Entry: https://your-portal.com/contents/iris-app/reward-dashboard/remoteEntry.js
# Module: ./AppEntry
```

See the full deployment guide in [`docs/deployment.md`](docs/deployment.md).

---

## Project Structure

```
src/
  config.ts                  # App slug and name
  env-helper.ts              # SDK config (dev vs production auth)
  router/index.ts            # 6 lazy-loaded routes
  composables/
    useDateRange.ts          # Global date range (Vue provide/inject)
  services/
    rewardService.ts         # All API calls — MEQL queries, name resolution
  types/
    reward.types.ts          # TypeScript interfaces + entity prefix map
  components/
    layout/
      AppLayout.vue          # Shell with sidebar + topbar
      AppSidebar.vue         # Navigation
      AppTopBar.vue          # Date range inputs
  views/
    HomeView.vue             # Reward Discovery
    CombinedReportView.vue   # Combined Report
    UserAttributionView.vue  # Who Earned What
    ProgramPerformanceView.vue
    AnomalyReportView.vue
    TrendsView.vue
.claude/
  skills/
    magentrix-api/           # Magentrix REST API v3 reference skill
    iris-theming/            # IRIS CSS/theming guidelines skill
    devmode-systemclass/     # SystemClass DevMode skill
```

---

## Claude Code Skills

This repo ships with three Claude Code skills in `.claude/skills/` that provide AI-assisted development context:

- **`magentrix-api`** — Full MEQL query language reference, entity CRUD, authentication patterns
- **`iris-theming`** — IRIS CSS wrapper system, BEM naming, dark mode, component patterns
- **`devmode-systemclass`** — SystemClass DevMode compilation pipeline

If you use [Claude Code](https://claude.ai/code), these skills load automatically and give the AI full context about the Magentrix platform when you work on this project.

---

## License

MIT — free to use as a starting point for your own Magentrix IRIS apps.
