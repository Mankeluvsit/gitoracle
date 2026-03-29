# GitOracle Pre-Implementation Audit & Upgrade Plan

Date: 2026-03-29

## 1) Repository Structure & Ownership Map

- `backend/server.py`: single-file FastAPI backend with API routes, GitHub API adapter, in-memory fallback DB adapter, and OpenAI integration.
- `frontend/src/`: React SPA with route-based pages and reusable card/components.
- `memory/PRD.md`: product scope, delivered features, and backlog.
- `scripts/`: dependency-audit helper scripts.
- `tests/`: currently minimal scaffold (`tests/__init__.py`) and ad-hoc test artifacts (`backend_test.py`, `test_result.md`, `test_reports/*`).

### Architectural diagnosis

Current implementation is feature-rich but centered around monolithic units:
- Backend concerns (models, integration clients, business logic, and routes) are co-located in one file.
- Frontend appears page/component oriented, but data-fetch concerns are distributed inside components rather than centralized service hooks.

This makes fast shipping easy but increases risk for regressions and slows future feature velocity as scope grows.

---

## 2) Current Capability Snapshot (validated from code)

### Backend strengths
- Natural-language search endpoint with optional LLM parsing fallback.
- Multi-entity GitHub search support (repositories/issues/PRs/users/code/commits).
- Trending, topics/languages exploration.
- Repo/user details, compare endpoint, bookmarks, token management, AI insights.
- In-memory DB fallback when Mongo is absent.

### Frontend strengths
- Multi-page navigation and discoverability (Search, Trending, Bookmarks, Compare, Repo/User detail).
- Result tabs and card-level rendering by entity type.
- Settings UX for GitHub token lifecycle and rate-limit status.

### Primary technical risks diagnosed
1. **Monolithic backend module risk**: `backend/server.py` holds nearly all logic, reducing maintainability and testability.
2. **Limited automated test surface**: no clear route-level or component-level test suite currently enforced.
3. **Potential API pressure/rate-limit risk**: no response caching/throttling layers for repeated trending/detail calls.
4. **Error normalization gap**: some endpoints return custom mapped HTTP errors, others append raw exception strings.
5. **Observability gap**: logging is present but no structured metrics/trace IDs for endpoint diagnostics.
6. **Security hardening opportunity**: token storage appears plain in DB settings object (not encrypted at rest at app layer).

---

## 3) Upgrade Objectives (pre-implementation)

1. Improve maintainability through modularization.
2. Improve reliability via tests and typed contracts.
3. Improve performance and API quota resilience via caching.
4. Improve user-facing search quality and explainability.
5. Improve operational safety (token handling, observability, error consistency).

---

## 4) Proposed New Features & Function Additions

## A. Search Quality & Productivity

1. **Saved Searches (P1)**
   - Add CRUD API for named saved queries (with selected entity filters).
   - Frontend quick-launch panel for recurring queries.

2. **Advanced Filters Panel (P1)**
   - Backend parser extension for date ranges, stars/forks intervals, archived/fork toggles.
   - Frontend side panel with chips + sliders to generate deterministic qualifiers.

3. **Search Result Export (P1)**
   - Add `POST /api/export/markdown` accepting result payload + metadata.
   - Generate markdown report suitable for sharing.

4. **Pagination / Infinite Scroll (P1)**
   - Add per-entity pagination cursor/page parameters.
   - Frontend progressively loads tabs to prevent large initial payloads.

## B. Intelligence & Analysis

5. **Repository Health Score (new)**
   - Function to compute weighted score from stars growth proxy, issue velocity, last push age, bus factor (contributors count).
   - Surface score in repo cards/detail page with simple rubric.

6. **Compare Delta Insights (new)**
   - Add derived metrics in compare endpoint (e.g., stars-per-day since creation).
   - Frontend delta badges: best/worst per metric.

7. **Trend Alerts (new)**
   - Backend scheduled digest-ready model for “topic rising this week”.
   - Foundation for future weekly digest/email feature.

## C. Platform & Reliability

8. **Result Caching Layer (P1)**
   - Add cache service (TTL, key hashing by endpoint+params).
   - Prioritize trending, repo detail, compare, and suggestions.

9. **Unified Error Envelope (new)**
   - Introduce consistent error schema (`code`, `message`, `hint`, `retryable`).
   - Apply across all API routes.

10. **Audit Logging & Request IDs (new)**
    - Middleware to stamp request IDs and latency metrics.
    - Structured logs for endpoint, status, GitHub call count, cache hit/miss.

---

## 5) Refactor Plan (Incremental, low-risk)

### Phase 0 — Baseline & Safety Nets
- Freeze current API contracts by documenting request/response JSON examples.
- Add smoke tests for key routes (`/search`, `/trending`, `/repo/*`, `/compare`, `/bookmarks`).

### Phase 1 — Backend Modularization
Target package layout:
- `backend/app/main.py` (FastAPI app assembly)
- `backend/app/api/routes/*.py` (route handlers)
- `backend/app/services/github_client.py`
- `backend/app/services/search_parser.py`
- `backend/app/services/insights_service.py`
- `backend/app/repositories/*` (Mongo/in-memory adapters)
- `backend/app/models/*` (Pydantic models)

Approach:
- Move logic with adapter shims to preserve endpoint behavior.
- Keep route URLs unchanged to avoid frontend breakage.

### Phase 2 — Frontend Data Layer Cleanup
- Add centralized API client module with typed response transformers.
- Introduce reusable hooks (`useSearch`, `useTrending`, `useRepoDetail`, etc.).
- Keep visual components dumb/presentational.

### Phase 3 — Feature Delivery
- Deliver pagination + saved searches + export markdown.
- Add compare delta insights and repo health scoring.

### Phase 4 — Observability, Security, Hardening
- Add request-id middleware + structured logging.
- Encrypt tokens at rest (app-level secret + rotation support).
- Add cache invalidation strategy and usage telemetry.

---

## 6) Testing & Quality Strategy

### Backend
- Unit tests: parser fallback logic, GitHub error mapping, score calculations.
- Contract tests: route response schemas for top 8 endpoints.
- Integration tests: in-memory DB mode and mocked GitHub API responses.

### Frontend
- Component tests: `ResultsPanel`, cards, settings modal flows.
- Page tests: Search and Trending core flows.
- E2E smoke (optional CI): search, bookmark, compare, open detail.

### CI upgrades
- Keep dependency audits.
- Add `pytest` + coverage gate and frontend test command gate.
- Add formatting/static checks (ruff/black or eslint/prettier as configured).

---

## 7) Suggested Delivery Sequence (feature-by-feature)

1. Add tests + API contract snapshots.
2. Introduce backend modular structure (no behavior changes).
3. Add caching and request-id middleware.
4. Implement pagination backend then frontend.
5. Implement saved searches.
6. Implement markdown export.
7. Implement health score + compare deltas.
8. Final hardening pass (security + observability dashboards).

---

## 8) Definition of Done for next implementation cycle

- No breaking API contract changes on existing routes.
- Search and trending latency reduced for repeated calls (cache hit path).
- Added tests for every new feature and regression tests for existing core flows.
- Frontend UX supports loading/error/empty states for all new endpoints.
- Operational logs include request IDs and top-level diagnostic fields.

---

## 9) Immediate Actionable Backlog (ready to implement)

1. Scaffold backend module structure and move GitHub request helper into service class.
2. Add test harness with mocked `httpx` responses for GitHub endpoints.
3. Introduce response envelope utility for standardized errors/success metadata.
4. Add pagination query params to `/search` + frontend tab incremental loading.
5. Add saved-search model + endpoints + UI entry points.

