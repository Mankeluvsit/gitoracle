# GitOracle - GitHub Natural Language Search

## Problem Statement
Build a web application that enables users to search across all GitHub resources using natural language queries. Features expanded to include trending exploration, bookmarks, repo comparison, detail pages, and AI insights.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Dark "Tactical Noir" theme)
- **Backend**: FastAPI + MongoDB + OpenAI GPT-4o-mini
- **NLP Layer**: OpenAI for query parsing + AI repo analysis

## What's Been Implemented (Feb 2026)

### Core Search
- Natural language search with GPT-4o-mini query parsing
- Resource type filter chips (repos, issues, PRs, users, code, commits)
- Search history with clear functionality
- Suggestions dropdown

### Navigation & Pages
- NavBar: Search, Trending, Bookmarks, Compare + Settings
- Detail pages: /repo/:owner/:name, /user/:login
- All pages with consistent dark theme + amber accents

### Trending Explorer
- Time period selector: Today, This Week, This Month, 3 Months, 6 Months, 1 Year
- Language filter (15+ languages)
- Two views: Repositories view + Topics & Languages view
- Trending topics with associated repos
- Trending language breakdown

### Detail Pages
- Repo: Stats (stars/forks/watchers/issues), language breakdown bar, top contributors, recent commits, README, AI Analysis button, bookmark
- User: Profile info, stats (repos/gists/followers/following), top repos, company/location/links

### Bookmarks
- Save any result (repo, user, issue, etc.)
- Personal notes on bookmarks
- Delete bookmarks
- Navigate from bookmark to detail page

### Compare
- Compare 2-4 repos side-by-side
- Visual metric bars (stars, forks, watchers, issues)
- Detail cards with languages and metadata

### AI Insights
- GPT-4o-mini powered repo analysis
- Shows: what it does, strengths, tech stack, audience, interesting fact

## P0 (Done)
- [x] NL search with LLM parsing
- [x] Resource type selector
- [x] Detail pages (repo + user)
- [x] Trending explorer with historical time ranges
- [x] Trending topics & languages
- [x] Bookmarks with notes
- [x] Repo comparison
- [x] AI insights
- [x] Navigation system

## P1 (Backlog)
- [ ] Pagination / infinite scroll
- [ ] Result caching in MongoDB
- [ ] Export search results as Markdown
- [ ] Advanced filter sidebar (stars range, date range)

## P2 (Backlog)
- [ ] GitHub OAuth login
- [ ] Saved search queries
- [ ] Weekly digest
- [ ] Developer spotlight (random profiles)
