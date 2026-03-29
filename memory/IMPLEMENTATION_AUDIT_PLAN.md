# GitOracle Audit & Implementation Plan

## 1) Repository Structure and Current Architecture

- `backend/server.py`: monolithic FastAPI application containing:
  - In-memory data layer fallback classes.
  - API clients (GitHub + OpenAI).
  - Pydantic request/response-adjacent models.
  - Core domain logic for search, trending, compare, details, bookmarks, and AI insights.
  - Route declarations and CORS setup.
- `frontend/src`: React app (CRA + CRACO + Tailwind) with page-level screens in `pages/`, reusable components in `components/`, and simple utility helpers in `lib/`.
- `backend_test.py`: script-style integration checks for API endpoints (not integrated with pytest).
- `tests/`: currently minimal/no substantive automated tests.
- `memory/PRD.md`: product context reference.

## 2) High-Level Findings (Audit Diagnosis)

### Strengths
- Broad feature surface already implemented: search, history, token settings, trending repos/topics, repo/user detail, compare, bookmarks, AI insights.
- Graceful no-key behavior for OpenAI and no-DB behavior via in-memory fallback.
- Frontend routes and UX are organized by feature pages and card-based renderers.

### Gaps / Risks
1. **Backend maintainability risk**
   - `backend/server.py` holds all responsibilities (routing, services, data-access abstractions, external APIs), creating high change risk and low testability.
2. **Data contract drift risk**
   - No typed shared contract between backend payloads and frontend expectations.
3. **Limited validation & guardrails**
   - Input validation is basic; limited pagination control, minimal schema-level constraints, and little normalization.
4. **Error handling consistency**
   - Endpoint responses vary in shape and detail; some failures are swallowed with generic fallback.
5. **Testing maturity**
   - No comprehensive unit test suite; integration checks rely on a manual script and external network dependencies.
6. **Operational observability**
   - Basic logging only; no request correlation, metrics, structured error taxonomy, or health/readiness endpoints.
7. **Performance/cost risk**
   - Potential repeated API calls without caching/rate-aware throttling.
8. **Security posture**
   - Token handling exists but lacks stronger operational controls (e.g., stricter masking policies, audit events).

## 3) Feature, Function, and Upgrade Plan

## Phase 0: Baseline & Safety Nets (Do First)

### Goals
- Reduce deployment risk before feature expansion.

### Additions / Upgrades
- Introduce backend package structure:
  - `backend/app/main.py`
  - `backend/app/api/routes/*.py`
  - `backend/app/services/*.py`
  - `backend/app/schemas/*.py`
  - `backend/app/repositories/*.py`
- Add centralized config (`pydantic-settings`) and environment validation.
- Add unified error response schema and exception handlers.
- Add `/healthz` and `/readyz` routes.
- Introduce structured logging with request IDs.

### Deliverables
- No behavior change expected for existing endpoints.
- New project layout and wiring with parity tests.

---

## Phase 1: API Hardening & Contract Stabilization

### Goals
- Improve consistency and client confidence.

### Additions / Upgrades
- Define strict Pydantic response models for all endpoints.
- Add pagination parameters (`page`, `per_page`) where applicable.
- Add sort options and safer defaults for large result sets.
- Standardize error envelope:
  - `code`, `message`, `details`, `request_id`.
- Add backend OpenAPI metadata improvements.

### Deliverables
- Versioned API docs and stable response contracts.
- Frontend updated to rely on typed payload assumptions.

---

## Phase 2: Search Quality and Relevance Enhancements

### Goals
- Improve result quality and user control.

### New Features
- Advanced filter builder on frontend (language, stars, updated range, state).
- Saved filter presets.
- Search result deduplication and re-ranking strategy.
- Optional query explainability section (why each entity was searched).

### Function Additions
- Backend query normalization utility.
- Relevance scoring module that combines stars/recency/engagement.
- Query telemetry events (search latency, entity hit rates).

### Deliverables
- More predictable search outcomes with transparent query interpretation.

---

## Phase 3: Developer-Intelligence Features (Core Product Upgrade)

### Goals
- Increase product differentiation beyond raw GitHub proxying.

### New Features
- Repository health score (activity, issue hygiene, release cadence, contributor diversity).
- Side-by-side compare insights (strengths/risks per repo).
- Watchlist with alerts for tracked repositories.
- “Why trending” explanation cards.

### Function Additions
- Scoring engine service and reusable metric calculators.
- Background refresh job hooks (future cron/task runner).
- Summary generation service with fallback templates.

### Deliverables
- Insight-first workflows on top of existing browsing experience.

---

## Phase 4: Data Layer and Persistence Upgrade

### Goals
- Move from basic storage to reliable, scalable persistence.

### Additions / Upgrades
- Repository pattern for Mongo-backed collections.
- Optional Redis cache for high-traffic GitHub responses.
- Data retention policy for history/bookmarks metadata.
- Index strategy for common query paths.

### Deliverables
- Faster repeated queries, lower API pressure, cleaner data lifecycle.

---

## Phase 5: Test Strategy and CI/CD Quality Gates

### Goals
- Improve confidence and release cadence.

### Additions / Upgrades
- Backend:
  - `pytest` + `pytest-asyncio` unit tests for services.
  - route tests with `httpx.AsyncClient` and dependency overrides.
- Frontend:
  - RTL tests for core pages/components.
  - contract tests for API adapters.
- Add coverage thresholds and failing gates in CI.

### Deliverables
- Repeatable automated validation beyond manual script checks.

---

## 4) Proposed Near-Term Backlog (First 2 Sprints)

## Sprint 1
1. Refactor backend into modular folders with no API behavior changes.
2. Add health/readiness endpoints and centralized exception mapping.
3. Introduce typed response schemas for search and trending endpoints.
4. Add baseline backend unit tests for parser fallback and error handling.

## Sprint 2
1. Add frontend API layer abstraction (`frontend/src/api/*`) and typed response adapters.
2. Introduce pagination controls to search/trending UI.
3. Add advanced filters (language/stars/state/date) with URL-sync.
4. Add integration tests for search flow and trending view.

## 5) Suggested Implementation Principles

- Preserve backwards compatibility for existing routes until a versioned API rollout is ready.
- Ship internal refactor + tests before large UX features.
- Keep OpenAI-dependent capabilities optional with deterministic fallbacks.
- Prefer thin routes + service layer + explicit schemas over implicit dict assembly.
- Add observability and quality gates before scaling data/storage complexity.

## 6) Definition of Done for the Planning Stage

- Architecture and module boundaries agreed.
- Prioritized backlog with effort/risk tags.
- API contracts defined for top traffic endpoints.
- Test matrix and CI quality gates approved.
- Rollout strategy documented (no downtime, feature flags where needed).
