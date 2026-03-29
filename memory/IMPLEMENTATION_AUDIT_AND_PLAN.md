# GitOracle Pre-Implementation Audit, Diagnosis, and Delivery Plan

## 1) Current System Familiarization

### Repository layout
- `backend/`: FastAPI API service, GitHub + OpenAI integrations, persistence abstraction.
- `frontend/`: React (CRA + CRACO) client, route-based pages, Tailwind + shadcn-style UI.
- `scripts/`: local audit helpers for frontend and Python dependency vulnerability checks.
- `memory/`: product docs and planning artifacts.

### Backend architecture snapshot
- Single service entrypoint in `backend/server.py` currently hosts:
  - in-memory DB adapter fallback when Mongo is unavailable,
  - GitHub API request wrapper + token handling,
  - query parsing (OpenAI-backed with deterministic fallback),
  - all search/trending/detail/bookmark/AI endpoints.
- API scope is broad and feature-rich (search, trending, repo/user details, compare, bookmarks, AI insights), but concentrated in one file.

### Frontend architecture snapshot
- Top-level router in `frontend/src/App.js` wires pages:
  - Search, Trending, Bookmarks, Compare, Repo Detail, User Detail.
- Search UX pipeline (`SearchPage`):
  - user query + optional resource chips,
  - POST `/api/search`,
  - tabbed multi-entity result rendering via `ResultsPanel`,
  - search history load/clear.
- Bookmarks page supports CRUD + note editing + deep-links to entity details.

### Existing quality signals
- `backend_test.py` provides broad endpoint-level smoke/integration coverage.
- `test_reports/iteration_1.json` and `iteration_2.json` indicate high functional pass rates, with only minor/low-priority UI selector concerns noted historically.

---

## 2) Diagnosis (What is strong vs what needs upgrades)

### Strengths
1. **Feature completeness at MVP+ level** (search, compare, bookmarks, trending, AI insights).
2. **Graceful operational fallback** (in-memory mode if Mongo is absent).
3. **Clear user-facing error handling** for common GitHub failure modes (rate limit, invalid token, malformed queries).
4. **Reasonably modular frontend by page/component**, allowing targeted feature additions.

### Gaps and technical debt
1. **Backend file concentration risk**
   - `backend/server.py` is a monolith combining models, data layer, external integrations, and route handlers.
   - Impact: slower feature velocity, higher regression surface, difficult isolated testing.
2. **Search orchestration lacks explicit service boundaries**
   - Query parsing, per-entity search fanout, and response normalization live in one area.
   - Impact: hard to add new entities/features (e.g., pagination or caching) safely.
3. **No explicit backend test package structure**
   - Current testing uses one script-like runner rather than unit/integration split with fixtures.
   - Impact: weak confidence for refactor-heavy upgrades.
4. **Frontend data layer tightly coupled to components**
   - Direct axios calls inside page components with repeated API URL patterns.
   - Impact: difficult retries, caching, optimistic updates, and standardized error policies.
5. **Potential dependency/runtime drift**
   - CRA-based stack is stable but aging; incremental modernization path is not documented.
   - Impact: future upgrades become more expensive if deferred.

---

## 3) New Features / Function Additions / Upgrade Plan

## Phase 0 — Stabilization baseline (before adding major features)
**Goal:** reduce change risk and create measurable baseline.

1. Define API contracts for all existing endpoints (request/response examples + error schema).
2. Add backend pytest suite scaffolding:
   - fast unit tests for parser fallback, GitHub error mapping, bookmark logic,
   - integration tests for high-value endpoints.
3. Add frontend API client layer (`src/lib/api.js`) and migrate one page first (SearchPage).
4. Add structured logging IDs for external calls (GitHub/OpenAI).

**Exit criteria:** reproducible test baseline + contract doc accepted.

## Phase 1 — High-value functional additions
**Goal:** unlock immediate user-visible value with low UX friction.

1. **Pagination / incremental loading for search and trending**
   - Backend: extend search functions with `page` + `per_page` controls where supported.
   - Frontend: add “Load more” UX and preserve tab/entity context.
2. **Saved searches**
   - Backend: collection + CRUD endpoints.
   - Frontend: save/re-run controls on SearchPage.
3. **Result export (Markdown)**
   - Frontend utility + backend optional server-side export endpoint for large payloads.
4. **Advanced filters**
   - Add stars/date qualifiers in UI and integrate into query payload.

**Exit criteria:** user can run large searches progressively, persist search intents, and export outcomes.

## Phase 2 — Reliability and performance upgrades
**Goal:** support growth and reduce latency/cost.

1. **Backend modularization**
   - split into `routers/`, `services/`, `repositories/`, `schemas/`.
2. **Search result caching**
   - key by normalized query + entity + page + token scope,
   - short TTL + invalidation strategy.
3. **Resilience layer**
   - retries/backoff for transient GitHub/OpenAI errors,
   - partial failure envelopes with per-entity status metadata.
4. **Rate-limit observability**
   - expose GitHub quota metadata (if available) to UI.

**Exit criteria:** lower average latency and better degraded-mode behavior under API pressure.

## Phase 3 — Product upgrades
**Goal:** move from utility tool to sticky workflow product.

1. GitHub OAuth login and user-scoped persistence.
2. Weekly digest and recommended repositories/users.
3. Team features (shared bookmarks/search sets).
4. AI-assisted compare insights and watchlist alerts.

**Exit criteria:** personalized retention loops and collaborative usage.

---

## 4) Recommended Immediate Work Breakdown (next 2 sprints)

### Sprint A (foundation)
1. Backend refactor prep: extract search service and bookmarks repository without behavior change.
2. Add pytest + CI test command for backend service.
3. Create frontend API module and migrate Search + Bookmarks pages.
4. Introduce shared error object parsing and toast policy.

### Sprint B (feature delivery)
1. Implement search pagination (repos/issues/PR/users first).
2. Add saved searches endpoint + UI list/run/delete.
3. Add Markdown export action for current result set.
4. Ship telemetry dashboard basics (request count, failure rate, latency).

---

## 5) Implementation Guardrails

1. Preserve backward compatibility for existing route paths.
2. Any refactor should be behavior-preserving with snapshot tests on representative responses.
3. New user-facing features must include:
   - optimistic UX state,
   - empty/loading/error states,
   - test IDs for regression automation.
4. Keep OpenAI dependency optional as today; fallback path must remain first-class.

---

## 6) Definition of Done for upcoming feature work

A feature is complete only when:
1. backend + frontend changes are covered by automated tests,
2. endpoint contracts are documented,
3. manual smoke pass succeeds for Search, Trending, Bookmarks, Compare,
4. changelog/plan artifact is updated in `memory/`.
