# GitOracle Enhancement Roadmap (Discovery Phase)

This document captures a broad set of proposed enhancements after reviewing the current GitOracle codebase (FastAPI backend + React frontend). It is intentionally wide in scope to support prioritization.

## 1) Core Search Intelligence

### 1.1 Saved Search Profiles + Alerts
- **What / problem:** Let users save advanced natural-language searches and receive periodic digests (email/Slack/webhook) when new matching repos/issues/PRs appear.
- **Why valuable:** Converts one-off discovery into continuous monitoring for maintainers, recruiters, security teams, and dev leads.
- **Complexity:** **Medium**

### 1.2 Query Explainability + Editable Parse
- **What / problem:** Show the generated GitHub qualifiers per entity type and allow users to edit before executing.
- **Why valuable:** Builds trust in LLM parsing and helps users learn precise GitHub search syntax.
- **Complexity:** **Low-Medium**

### 1.3 Multi-stage Ranking (Relevance + Freshness + Quality)
- **What / problem:** Post-process raw GitHub results with a scoring model balancing stars, recency, activity, issue velocity, maintainer responsiveness, etc.
- **Why valuable:** “Best result” quality improves beyond GitHub default sort behavior.
- **Complexity:** **Medium**

### 1.4 Search Presets for Personas
- **What / problem:** Curated presets (e.g., “Find beginner-friendly repos”, “Find active AI infra projects”, “Find first issues to contribute”).
- **Why valuable:** Reduces query-writing friction and improves onboarding.
- **Complexity:** **Low**

### 1.5 Semantic De-duplication Across Result Types
- **What / problem:** De-duplicate near-identical findings appearing in multiple tabs (issue + PR references, mirrored repos).
- **Why valuable:** Cleaner results and faster scanning.
- **Complexity:** **Medium**

## 2) Repository Intelligence & Decision Support

### 2.1 Repository Health Scorecard
- **What / problem:** Aggregate bus factor, release cadence, issue age distribution, maintainer activity, CI status, and dependency hygiene.
- **Why valuable:** Helps users quickly evaluate project reliability before adoption.
- **Complexity:** **High**

### 2.2 “Adoption Risk” and “Maturity” Indicators
- **What / problem:** Convert noisy metadata into simple signals (e.g., Experimental / Growing / Mature / At-Risk).
- **Why valuable:** Product managers and engineers can make faster stack decisions.
- **Complexity:** **Medium**

### 2.3 Competitive Landscape View
- **What / problem:** For a repo/topic, surface “similar alternatives,” differentiators, and tradeoffs.
- **Why valuable:** Positions GitOracle as a research assistant, not only a search UI.
- **Complexity:** **Medium-High**

### 2.4 Dependency + Security Snapshot
- **What / problem:** Pull advisories, Dependabot/security tab signals, known CVEs in popular dependencies.
- **Why valuable:** Useful for due diligence and safer package selection.
- **Complexity:** **High**

## 3) UX (End-user Product Experience)

### 3.1 Unified Workspace / Collections
- **What / problem:** Expand bookmarks into named collections, tags, and notes with drag-and-drop organization.
- **Why valuable:** Users can build research dossiers for hiring, migration, OSS scouting, etc.
- **Complexity:** **Medium**

### 3.2 Side-by-side “Diff” Comparison for Repos
- **What / problem:** Visual compare matrix for two repos with highlighted winner per metric + trend spark lines.
- **Why valuable:** Faster decisions than current list/bar-only compare.
- **Complexity:** **Medium**

### 3.3 Keyboard-first Command Palette
- **What / problem:** Global shortcuts for search, navigation, compare, bookmarks, and quick actions.
- **Why valuable:** Power-user productivity and improved perceived responsiveness.
- **Complexity:** **Low-Medium**

### 3.4 Progressive Disclosure for AI Insights
- **What / problem:** Split AI output into concise summary, technical deep dive, and evidence links.
- **Why valuable:** Better readability and trust (especially for long README analyses).
- **Complexity:** **Low**

### 3.5 Accessibility Hardening
- **What / problem:** Improve focus states, ARIA roles, color contrast, and keyboard nav for all core flows.
- **Why valuable:** Inclusive UX and better quality baseline.
- **Complexity:** **Medium**

## 4) Developer Experience (DX)

### 4.1 Public API Documentation + OpenAPI Examples
- **What / problem:** Publish clear endpoint docs, payload examples, and common workflows.
- **Why valuable:** Easier external integrations and contributor onboarding.
- **Complexity:** **Low**

### 4.2 Typed API Client (TS + Python)
- **What / problem:** Auto-generated SDKs from OpenAPI for frontend and third-party developers.
- **Why valuable:** Fewer integration bugs, stronger contract consistency.
- **Complexity:** **Medium**

### 4.3 End-to-end Test Coverage (Playwright + API contract tests)
- **What / problem:** Add coverage for search, compare, bookmark lifecycle, and token settings.
- **Why valuable:** Prevent regressions as features expand.
- **Complexity:** **Medium**

### 4.4 Local Dev Bootstrap Script
- **What / problem:** Single command to spin up backend + frontend with env checks.
- **Why valuable:** Faster setup for new contributors.
- **Complexity:** **Low**

## 5) Integrations & Ecosystem

### 5.1 GitHub App Integration (OAuth + org install)
- **What / problem:** Replace manual PAT entry with secure OAuth/GitHub App auth and scoped org installation.
- **Why valuable:** Better security posture and enterprise readiness.
- **Complexity:** **High**

### 5.2 Slack / Teams / Discord Notifications
- **What / problem:** Send saved-search alerts and trend summaries into collaboration tools.
- **Why valuable:** Makes insights actionable where teams already work.
- **Complexity:** **Medium**

### 5.3 Export to Notion/Jira/Linear
- **What / problem:** One-click export of findings/bookmarks into work-tracking systems.
- **Why valuable:** Bridges discovery with execution workflows.
- **Complexity:** **Medium**

### 5.4 CLI Companion
- **What / problem:** `gitoracle` CLI for scripted queries, CI usage, and terminal-first users.
- **Why valuable:** Expands audience and automation use-cases.
- **Complexity:** **Medium**

## 6) Data, Performance, and Reliability

### 6.1 Smart Caching Layer
- **What / problem:** Cache GitHub API responses with TTL and cache-key normalization to reduce duplicate calls.
- **Why valuable:** Lower latency and reduced rate-limit pressure.
- **Complexity:** **Medium**

### 6.2 Async Fan-out + Partial Streaming Results
- **What / problem:** Return entity-type results incrementally as each search completes.
- **Why valuable:** Improves perceived speed for multi-entity searches.
- **Complexity:** **High**

### 6.3 Background Job Queue
- **What / problem:** Offload heavy operations (trending aggregation, AI synthesis, alerts) to workers.
- **Why valuable:** Better API responsiveness and scalability.
- **Complexity:** **High**

### 6.4 Observability (Metrics, Tracing, Structured Logs)
- **What / problem:** Add request latency metrics, GitHub API error taxonomy, and tracing across services.
- **Why valuable:** Faster incident diagnosis and performance tuning.
- **Complexity:** **Medium**

## 7) Security & Compliance

### 7.1 Secret Management + Encryption-at-Rest for Tokens
- **What / problem:** Encrypt tokens in storage and support secret backends.
- **Why valuable:** Reduces blast radius if DB is compromised.
- **Complexity:** **Medium**

### 7.2 AuthN/AuthZ for Multi-user Mode
- **What / problem:** Add accounts, session auth, and per-user data partitioning.
- **Why valuable:** Required for hosted/shared usage.
- **Complexity:** **High**

### 7.3 Rate Limiting + Abuse Protection
- **What / problem:** Protect API with per-IP/per-user limits and anomaly detection.
- **Why valuable:** Improves stability and security.
- **Complexity:** **Medium**

### 7.4 Audit Trails
- **What / problem:** Track security-relevant actions (token updates, exports, integration changes).
- **Why valuable:** Enterprise trust and compliance readiness.
- **Complexity:** **Medium**

## 8) Productization & Monetization Paths

### 8.1 Team Workspaces
- **What / problem:** Shared collections, comments, and owner-level permissions.
- **Why valuable:** Enables paid collaborative usage.
- **Complexity:** **High**

### 8.2 Usage-based Insights Tiers
- **What / problem:** Free search + paid advanced intelligence (alerts, deep analyses, integrations).
- **Why valuable:** Sustainable roadmap funding.
- **Complexity:** **Medium**

### 8.3 Domain Packs
- **What / problem:** Vertical presets/scoring models (DevRel, security scouting, recruiting, due diligence).
- **Why valuable:** Tailored value with clearer go-to-market story.
- **Complexity:** **Medium**

## 9) Suggested Prioritization (if you want a fast v1.5 uplift)

### Quick Wins (Low effort / High visible value)
1. Query explainability + editable parse
2. Search presets for personas
3. Collections/tags for bookmarks
4. Public API docs + examples
5. Accessibility pass on primary flows

### Strategic Mid-term
1. Saved search alerts + notifications
2. Smart caching + observability
3. GitHub App OAuth migration
4. Repository health scorecard foundation

### Big Bets
1. Team workspaces
2. Background jobs + streaming architecture
3. Security/dependency intelligence

---

## Alignment checkpoint
Please choose which items (or priority bucket) you want to proceed with first, and I’ll then provide implementation details and an execution plan.
