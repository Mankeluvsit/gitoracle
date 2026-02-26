# GitOracle - GitHub Natural Language Search

## Problem Statement
Build a web application that enables users to search across all GitHub resources using natural language queries instead of GitHub's standard search syntax. Users can find repositories, issues, pull requests, users, organizations, code snippets, commits, discussions through conversational search terms.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Dark "Tactical Noir" theme, Electric Amber accents)
- **Backend**: FastAPI + MongoDB + OpenAI GPT-4o-mini
- **NLP Layer**: OpenAI GPT-4o-mini translates natural language → GitHub search qualifiers
- **GitHub Integration**: REST API for repos, issues, PRs, users, code, commits

## User Personas
- Developers searching for open-source tools
- Project managers exploring repositories
- Non-technical users who don't know GitHub search syntax

## Core Requirements
- Natural language search bar with suggestions
- NLP parsing of queries to GitHub search parameters
- Categorized results display (repos, issues, PRs, users, code, commits)
- GitHub Personal Access Token management for rate limits
- Search history tracking
- Entity type tab filtering

## What's Been Implemented (Feb 2026)
- Full-stack app with FastAPI backend + React frontend
- OpenAI GPT-4o-mini integration for NL → GitHub query translation
- GitHub REST API integration for all entity types
- Repository cards with stars, forks, language, topics, license
- Issue/PR cards with state, labels, comments, author
- User cards with avatar and type
- Code cards with file path and repository
- Commit cards with SHA, author, date
- Settings modal for GitHub token management with validation
- Search history with clear functionality
- Suggestions dropdown with 8 example queries
- Dark theme with Chivo/Manrope/JetBrains Mono typography
- Staggered entrance animations on results

## P0 (Done)
- [x] NL search with LLM parsing
- [x] Multi-entity GitHub search
- [x] Results display with metadata
- [x] GitHub token settings
- [x] Search history

## P1 (Backlog)
- [ ] Pagination for search results
- [ ] Search result caching in MongoDB
- [ ] Advanced filter sidebar (language, date range, stars range)
- [ ] Export search results

## P2 (Backlog)
- [ ] GitHub OAuth login
- [ ] Saved searches / bookmarks
- [ ] Search analytics dashboard
- [ ] Compare repositories side-by-side

## Next Tasks
1. Add pagination to load more results
2. Implement result caching for repeated queries
3. Add advanced filter controls
