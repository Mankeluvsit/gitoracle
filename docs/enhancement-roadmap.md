# GitOracle Enhancement Roadmap (Exploration Draft)

## Current-state summary (from repository review)
- FastAPI backend proxies GitHub APIs, parses natural language with optional OpenAI usage, and stores settings/history/bookmarks in MongoDB or in-memory fallback.
- React frontend offers pages for Search, Trending, Bookmarks, Compare, repo detail, and user detail.
- The repo has lightweight docs and ad-hoc API test script coverage, but limited architectural decomposition and limited production hardening.

---

## 1) Core search intelligence upgrades

### 1.1 Intent confidence + “editable parsed query”
- **What / problem**: Return parser confidence and expose parsed qualifiers in UI for correction before execution.
- **Value**: Users can fix misunderstandings quickly (fewer bad searches, less trial-and-error).
- **Complexity**: **Medium**.

### 1.2 Advanced filter builder (structured + NL hybrid)
- **What / problem**: Add side panel for stars/forks/date/license/language/state filters while retaining NL query.
- **Value**: Power users get precision; new users keep simple NL workflow.
- **Complexity**: **Medium**.

### 1.3 Multi-query decomposition (“find X then compare Y”)
- **What / problem**: Parse compound prompts into sequential searches and merged result views.
- **Value**: Handles real-world asks that single GitHub query syntax cannot express.
- **Complexity**: **High**.

### 1.4 Relevance ranking layer across entity types
- **What / problem**: Normalize heterogeneous scores from repo/issue/user/code endpoints and rank globally for “All” tab.
- **Value**: Better mixed-result quality; easier discovery.
- **Complexity**: **High**.

### 1.5 Search result deduplication + canonicalization
- **What / problem**: Detect duplicates across multiple entity buckets and repeated searches.
- **Value**: Cleaner feeds and less cognitive load.
- **Complexity**: **Low**.

### 1.6 Explain-why cards (“why this result matched”)
- **What / problem**: Surface matched terms/qualifiers and key metadata rationale per result.
- **Value**: Trust and faster refinement.
- **Complexity**: **Medium**.

---

## 2) Repository and code intelligence features

### 2.1 PR health and release cadence insights
- **What / problem**: Add cadence metrics (commit frequency, release rhythm, issue closure velocity).
- **Value**: Better project quality evaluation for adopters.
- **Complexity**: **Medium**.

### 2.2 Security/compliance snapshot per repo
- **What / problem**: Integrate advisory/license/dependency risk signals into detail page.
- **Value**: Essential for enterprise and production adoption decisions.
- **Complexity**: **High**.

### 2.3 “Alternatives to this repo” recommendations
- **What / problem**: Suggest similar repositories by language/topic/stars/activity vectors.
- **Value**: Discovery engine beyond direct search.
- **Complexity**: **Medium**.

### 2.4 Architecture auto-summary from README + tree
- **What / problem**: Generate concise architecture map, key modules, setup complexity.
- **Value**: Faster repo triage for evaluators.
- **Complexity**: **Medium**.

### 2.5 Code search snippet preview and symbol extraction
- **What / problem**: Show highlighted snippet context and inferred symbol/function/class metadata.
- **Value**: Reduces click-outs to GitHub for quick validation.
- **Complexity**: **Medium**.

---

## 3) Compare, evaluate, and decision workflows

### 3.1 Weighted comparison scoring
- **What / problem**: Let users assign metric weights (stars vs freshness vs issue health).
- **Value**: Personalized, decision-ready comparisons.
- **Complexity**: **Medium**.

### 3.2 Saved comparison sets + diff history
- **What / problem**: Persist compare sets and show changes over time.
- **Value**: Supports recurring technology evaluation workflows.
- **Complexity**: **Medium**.

### 3.3 “Choose for me” recommender mode
- **What / problem**: Ask use-case constraints and return ranked recommendation with rationale.
- **Value**: High leverage for teams selecting libraries/frameworks.
- **Complexity**: **High**.

### 3.4 Exportable decision brief
- **What / problem**: One-click Markdown/PDF export of comparison metrics and AI rationale.
- **Value**: Shareable artifact for team decisions and RFCs.
- **Complexity**: **Low-Medium**.

---

## 4) Personalization, memory, and collaboration

### 4.1 Saved searches + alerts (daily/weekly)
- **What / problem**: Save query + filters and notify on new high-signal matches.
- **Value**: Turns GitOracle into proactive monitoring.
- **Complexity**: **High**.

### 4.2 Collections/workspaces (team-level)
- **What / problem**: Organize bookmarks into named collections with tags and owners.
- **Value**: Team knowledge base for tools/research.
- **Complexity**: **Medium**.

### 4.3 Notes with AI auto-summarization and action items
- **What / problem**: Convert bookmark notes into concise summaries and follow-up tasks.
- **Value**: Better retention and handoff.
- **Complexity**: **Medium**.

### 4.4 Activity timeline and research journal
- **What / problem**: Chronological trail of searches, compares, bookmarks, and insights.
- **Value**: Supports long-running evaluation projects.
- **Complexity**: **Medium**.

---

## 5) GitHub integration depth

### 5.1 OAuth login + per-user identity
- **What / problem**: Replace raw PAT-only settings with OAuth and user-scoped data.
- **Value**: Safer auth UX, multi-user readiness.
- **Complexity**: **High**.

### 5.2 GitHub App integration (org install)
- **What / problem**: Installable app for org-scoped insights and permissions.
- **Value**: Enterprise adoption path.
- **Complexity**: **High**.

### 5.3 GraphQL enrichment pipeline
- **What / problem**: Use GitHub GraphQL for richer, denser query and batching patterns.
- **Value**: Better performance + richer metadata in fewer requests.
- **Complexity**: **High**.

### 5.4 PR/Issue drill-down actions
- **What / problem**: From results, open focused view with timeline, labels, participants, linked commits.
- **Value**: Keeps investigation inside GitOracle.
- **Complexity**: **Medium**.

### 5.5 Slack / Teams notifications for saved monitors
- **What / problem**: Push notable repo/activity events to team channels.
- **Value**: Collaboration and visibility.
- **Complexity**: **Medium**.

---

## 6) UX and interaction improvements

### 6.1 Progressive loading + infinite scroll + pagination controls
- **What / problem**: Current fixed result count limits depth.
- **Value**: Better exploration for broad queries.
- **Complexity**: **Medium**.

### 6.2 Command palette and keyboard-first navigation
- **What / problem**: Power users need fast navigation/search actions.
- **Value**: Strong DX-like UX for developers.
- **Complexity**: **Medium**.

### 6.3 Query assistant chips and rewrite suggestions
- **What / problem**: New users struggle with phrasing.
- **Value**: Higher success rate on first query.
- **Complexity**: **Low-Medium**.

### 6.4 Session-based “investigation board”
- **What / problem**: No visual workspace for comparing findings across pages.
- **Value**: Better synthesis and triage.
- **Complexity**: **Medium**.

### 6.5 Accessibility and responsive hardening
- **What / problem**: Ensure keyboard flow, contrast, screen-reader semantics.
- **Value**: Broader usability and compliance.
- **Complexity**: **Medium**.

---

## 7) Platform architecture and backend hardening

### 7.1 Service decomposition (search, insights, profile, persistence)
- **What / problem**: Single-file backend limits maintainability and testability.
- **Value**: Easier scaling, onboarding, and ownership.
- **Complexity**: **Medium-High**.

### 7.2 Caching layer with TTL + cache invalidation strategy
- **What / problem**: Repeated GitHub calls inflate latency and rate-limit pressure.
- **Value**: Faster responses and lower external API cost/risk.
- **Complexity**: **Medium**.

### 7.3 Async job queue for expensive insight generation
- **What / problem**: AI insight requests can block user flows.
- **Value**: Better reliability and smoother UX.
- **Complexity**: **High**.

### 7.4 API versioning + typed contracts
- **What / problem**: Evolving payloads can break frontend silently.
- **Value**: Safer iteration and integrator trust.
- **Complexity**: **Medium**.

### 7.5 Centralized error model + retry/backoff policy
- **What / problem**: Inconsistent exception handling across endpoints.
- **Value**: Predictable UX and easier incident debugging.
- **Complexity**: **Low-Medium**.

---

## 8) Reliability, performance, and observability

### 8.1 Request budget management + adaptive throttling
- **What / problem**: GitHub API limits can degrade app unpredictably.
- **Value**: Graceful quality under constrained quota.
- **Complexity**: **Medium**.

### 8.2 Telemetry: traces, structured logs, endpoint SLO dashboards
- **What / problem**: Minimal operational visibility today.
- **Value**: Faster diagnosis and performance tuning.
- **Complexity**: **Medium**.

### 8.3 Frontend performance budget and bundle optimization
- **What / problem**: CRA baseline and broad deps can bloat load time.
- **Value**: Faster initial render, better mobile UX.
- **Complexity**: **Medium**.

### 8.4 Synthetic checks for key journeys
- **What / problem**: Regressions in external integrations may go unnoticed.
- **Value**: Early warning for broken search/detail/compare flows.
- **Complexity**: **Low-Medium**.

---

## 9) Developer experience and quality engineering

### 9.1 Replace ad-hoc API tester with pytest + contract tests
- **What / problem**: Current test script is useful but not CI-grade unit/integration coverage.
- **Value**: Repeatable confidence and faster refactors.
- **Complexity**: **Medium**.

### 9.2 Typed frontend API client + schema validation
- **What / problem**: Implicit contracts increase runtime bugs.
- **Value**: Safer frontend evolution.
- **Complexity**: **Medium**.

### 9.3 Local dev bootstrap (`make dev`, docker-compose profile)
- **What / problem**: Setup is partially documented and manual.
- **Value**: Faster onboarding.
- **Complexity**: **Low-Medium**.

### 9.4 Lint/format/pre-commit and architectural conventions docs
- **What / problem**: Style drift and structural inconsistency risk growth pains.
- **Value**: Maintainer velocity and reduced review overhead.
- **Complexity**: **Low**.

### 9.5 End-to-end UI tests for critical flows
- **What / problem**: Search/trending/compare/bookmark UX paths are vulnerable to regressions.
- **Value**: Stable releases.
- **Complexity**: **Medium**.

---

## 10) Product and go-to-market extensions

### 10.1 Use-case presets (hiring, due diligence, OSS monitoring)
- **What / problem**: New users need guided starting points.
- **Value**: Faster time-to-value and improved retention.
- **Complexity**: **Low-Medium**.

### 10.2 Team plans and shared dashboards
- **What / problem**: Single-user utility limits monetization.
- **Value**: Collaboration + revenue path.
- **Complexity**: **High**.

### 10.3 API/CLI access for automation
- **What / problem**: Developers may want GitOracle in CI or scripts.
- **Value**: Expands platform from app to programmable service.
- **Complexity**: **Medium-High**.

### 10.4 Insight newsletters / weekly brief digests
- **What / problem**: Useful findings stay trapped in app sessions.
- **Value**: Recurring engagement and passive value delivery.
- **Complexity**: **Medium**.

---

## Suggested prioritization lens (for selection)
- **Near-term quick wins**: 1.2, 3.4, 6.3, 7.2, 9.4.
- **Strategic differentiation**: 1.4, 2.3, 3.3, 5.3.
- **Enterprise readiness**: 5.1, 5.2, 7.4, 8.2.

