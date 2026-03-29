# GitOracle Pre-Implementation Audit, Diagnosis, and Delivery Plan

Date: 2026-03-29

## 1) Repository Structure and Current System Map

- `frontend/` — React SPA (Create React App) with route-driven pages for Search, Trending, Bookmarks, Compare, Repo Detail, and User Detail.
- `backend/` — FastAPI service in a single `server.py` file handling GitHub API integration, token settings, search parsing, trending, compare, bookmarks, and AI insights.
- `memory/` — product notes and planning docs.
- `scripts/` — security/dependency audit helpers.
- `tests/` — currently minimal scaffolding only.

## 2) High-Level Functional Inventory (Current State)

### Frontend
- Route shell in `App.js` with shared top nav.
- Search flow with resource filters, history, tabbed mixed-result rendering, and per-entity cards.
- Trending explorer, bookmark management, repo compare view, and detail pages.

### Backend
- Unified search endpoint (`/api/search`) with optional LLM parsing and fallback logic.
- GitHub token CRUD endpoint set (`/api/settings/github-token`).
- Search history, trending, topics/languages, repo/user details, compare, bookmarks, and AI insights endpoints.
- In-memory fallback for persistence when MongoDB is absent.

## 3) Diagnosis: Strengths, Risks, and Gaps

## Strengths
1. Clear full-stack separation (`frontend/` and `backend/`) and coherent feature set.
2. Graceful degradation when OpenAI/MongoDB are unavailable.
3. Good GitHub API error normalization for common status codes.
4. Reasonable UX composition with reusable cards/components.

## Risks / Technical Debt
1. **Backend concentration risk**: `backend/server.py` is monolithic, increasing regression risk and slowing feature delivery.
2. **Limited test coverage**: no substantial automated backend/frontend tests discovered.
3. **No server-side caching/pagination strategy in core search flow** despite being listed as backlog.
4. **Potential rate-limit pressure**: many routes fan out to multiple GitHub endpoints without caching or request coalescing.
5. **Data model hygiene**: bookmark/history schemas are implicit dictionaries (no collection-level versioning/migrations).
6. **Observability gap**: no explicit structured metrics, request IDs, or latency instrumentation.
7. **Input hardening opportunities**: several request payloads could benefit from stricter pydantic validation constraints.

## 4) Feature & Upgrade Plan (Recommended Sequence)

## Phase 0 — Baseline Quality Gate (1-2 days)
Goal: reduce delivery risk before net-new features.

- Add backend test harness (pytest + async client fixtures + API smoke tests).
- Add frontend component/page smoke tests (critical user journeys only).
- Add static checks in CI (`ruff`/`flake8`, formatting, frontend lint if not already enforced).
- Add `.env.example` expansion + operational runbook for required/optional variables.

## Phase 1 — Backend Modularization (2-4 days)
Goal: make future features safer and easier to deliver.

- Split `server.py` into modules:
  - `api/routes/*.py` for endpoint groups.
  - `services/github_client.py` for GitHub calls.
  - `services/search_parser.py` for LLM parse logic.
  - `repositories/` for Mongo/in-memory persistence adapters.
  - `models/` for pydantic DTOs.
- Introduce dependency injection for DB + external clients to improve testability.
- Preserve API contract parity during refactor.

## Phase 2 — Priority Feature Additions from Backlog (3-6 days)
Goal: ship highest user-value additions.

### 2.1 Pagination / incremental loading
- Backend: accept `page` + `per_page` on search routes and return pagination metadata.
- Frontend: add “Load more” or infinite scroll per entity tab.
- Guardrails: dedupe items by canonical ID/URL.

### 2.2 Result caching
- Cache GitHub search responses in Mongo with TTL index and query hash keys.
- Cache invalidation policy by endpoint class (search vs detail).
- Emit cache hit/miss in logs for tuning.

### 2.3 Export search results as Markdown
- Add endpoint to transform current result payload to downloadable markdown.
- Frontend: export action in results toolbar with toast feedback.

### 2.4 Advanced filters
- Extend parser + request schema to include stars/forks/date ranges explicitly.
- Frontend sidebar with controlled filter state and URL persistence.

## Phase 3 — Reliability and Security Upgrades (2-4 days)
Goal: production hardening.

- Centralize outbound HTTP retry/backoff + timeout policy for GitHub API.
- Add request-level correlation IDs and structured logs.
- Introduce rate-limit awareness banners in frontend based on backend response metadata.
- Add secure secret handling guidance and token encryption-at-rest (if persistent DB used).

## Phase 4 — Product Enhancements (optional, roadmap)
- Saved searches.
- Weekly digest generation.
- OAuth login and scoped user data.
- Developer spotlight recommendation module.

## 5) Proposed New Functions and Components

## Backend function additions (conceptual)
- `build_search_cache_key(entity_type, query, page, per_page)`
- `get_cached_search_result(cache_key)` / `set_cached_search_result(cache_key, payload, ttl)`
- `normalize_search_request(req)`
- `paginate_items(items, page, per_page)` (if needed for local fallback datasets)
- `to_markdown_export(query, parsed, results, counts)`

## Frontend additions (conceptual)
- `usePaginatedSearch()` hook to encapsulate search + page state.
- `SearchFiltersPanel` component for advanced qualifiers.
- `ExportResultsButton` component integrated with results toolbar.
- `useRateLimitStatus()` hook for proactive UX warnings.

## 6) Implementation Order and Milestones

1. **M1: Baseline QA + tests** (must pass before refactor).
2. **M2: Backend modularization with no API breakage**.
3. **M3: Pagination + caching**.
4. **M4: Export + advanced filters**.
5. **M5: Reliability/security hardening and observability**.

## 7) Definition of Done (for upcoming implementation)

- Contract tests confirm all existing endpoints remain backward-compatible.
- Search endpoint supports pagination metadata and deterministic ordering.
- Cache layer has measurable hit rate in logs.
- Markdown export works for mixed entity results.
- Advanced filters are reflected in request payload and UI state.
- CI runs tests + lint on every PR.

## 8) Immediate Next Actions

1. Create architecture refactor branch checklist (modules, import boundaries, migration strategy).
2. Add minimal automated tests for `/api/search`, `/api/trending`, `/api/bookmarks`.
3. Implement pagination contract first (backend then frontend wiring).
4. Add cache schema + TTL index and instrumentation.
