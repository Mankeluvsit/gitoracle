from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import httpx
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Models ────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None

class GitHubTokenRequest(BaseModel):
    token: str

class BookmarkRequest(BaseModel):
    item_type: str
    item_data: Dict[str, Any]
    note: Optional[str] = ""

class NoteRequest(BaseModel):
    bookmark_id: str
    note: str

class AIInsightRequest(BaseModel):
    repo_full_name: Optional[str] = None
    issue_url: Optional[str] = None
    context: Optional[str] = None

class SearchHistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    parsed_intent: Dict[str, Any] = {}
    result_counts: Dict[str, int] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ─── GitHub API Helper ─────────────────────────────────────────────────

GITHUB_API_BASE = "https://api.github.com"

async def get_github_token():
    doc = await db.settings.find_one({"key": "github_token"}, {"_id": 0})
    if doc:
        return doc.get("value")
    return None

async def github_request(endpoint: str, params: dict = None, requires_auth: bool = False):
    token = await get_github_token()
    if requires_auth and not token:
        raise HTTPException(status_code=401, detail="This search type requires a GitHub token. Add one in Settings.")
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=30.0) as hc:
        resp = await hc.get(f"{GITHUB_API_BASE}{endpoint}", headers=headers, params=params)
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="GitHub token is invalid or expired. Update it in Settings.")
        if resp.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Add a GitHub token in Settings.")
        if resp.status_code == 422:
            raise HTTPException(status_code=422, detail="GitHub could not process the search query. Try rephrasing.")
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Resource not found on GitHub.")
        resp.raise_for_status()
        return resp.json()

# ─── NLP Parser ────────────────────────────────────────────────────────

PARSE_SYSTEM_PROMPT = """You are a query parser that converts natural language into GitHub search parameters.

Given a user query, extract:
1. entity_types: array of types to search. Options: "repositories", "issues", "pull_requests", "users", "code", "commits". Pick the most relevant ones based on the query. If ambiguous, include multiple.
2. search_queries: a dict mapping each entity_type to the GitHub search query string using GitHub's search qualifiers.

GitHub search qualifier examples:
- Repositories: "machine learning language:python stars:>1000"
- Issues: "authentication bug is:issue is:open"
- PRs: "fix memory leak is:pr is:merged"
- Users: "type:user location:\\"San Francisco\\""
- Code: "import tensorflow language:python"
- Commits: "fix typo author-date:>2024-01-01"

Rules:
- For repository searches: use qualifiers like language:, stars:>, forks:>, topic:, created:>, pushed:>
- For issue searches: always add "is:issue", use label:, state:open/closed
- For PR searches: always add "is:pr", use is:merged/is:open
- For user searches: use type:user, location:, followers:>, repos:>
- For code searches: use language:, filename:, path:, extension:
- For commit searches: use author:, committer:, author-date:>
- Convert natural language filters to proper qualifiers
- Keep the keyword terms from the user query

Respond ONLY with valid JSON. No markdown, no code fences.
Example response:
{"entity_types": ["repositories", "issues"], "search_queries": {"repositories": "machine learning language:python stars:>1000", "issues": "machine learning bug is:issue is:open"}}"""

async def parse_query_with_llm(query: str, entity_types: Optional[List[str]] = None) -> dict:
    user_msg = f"User query: \"{query}\""
    if entity_types:
        user_msg += f"\nOnly search these types: {', '.join(entity_types)}"
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": PARSE_SYSTEM_PROMPT}, {"role": "user", "content": user_msg}],
        temperature=0.1, max_tokens=500
    )
    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
    return json.loads(content)

# ─── Search Functions ──────────────────────────────────────────────────

async def search_repositories(query: str, per_page: int = 10):
    data = await github_request("/search/repositories", {"q": query, "per_page": per_page, "sort": "stars", "order": "desc"})
    items = []
    for r in data.get("items", []):
        items.append({
            "type": "repository", "name": r.get("full_name", ""), "description": r.get("description", ""),
            "url": r.get("html_url", ""), "stars": r.get("stargazers_count", 0), "forks": r.get("forks_count", 0),
            "language": r.get("language", ""), "topics": r.get("topics", [])[:5], "updated_at": r.get("updated_at", ""),
            "owner_avatar": r.get("owner", {}).get("avatar_url", ""), "open_issues": r.get("open_issues_count", 0),
            "license": (r.get("license") or {}).get("spdx_id", ""), "watchers": r.get("watchers_count", 0),
        })
    return items, data.get("total_count", 0)

async def search_issues(query: str, per_page: int = 10):
    data = await github_request("/search/issues", {"q": query, "per_page": per_page, "sort": "created", "order": "desc"})
    items = []
    for i in data.get("items", []):
        is_pr = "pull_request" in i
        items.append({
            "type": "pull_request" if is_pr else "issue", "title": i.get("title", ""),
            "body": (i.get("body", "") or "")[:200], "url": i.get("html_url", ""), "state": i.get("state", ""),
            "author": i.get("user", {}).get("login", ""), "author_avatar": i.get("user", {}).get("avatar_url", ""),
            "created_at": i.get("created_at", ""), "updated_at": i.get("updated_at", ""), "comments": i.get("comments", 0),
            "labels": [l.get("name", "") for l in i.get("labels", [])][:5],
            "repository": i.get("repository_url", "").split("/repos/")[-1] if i.get("repository_url") else "",
        })
    return items, data.get("total_count", 0)

async def search_users(query: str, per_page: int = 10):
    data = await github_request("/search/users", {"q": query, "per_page": per_page, "sort": "followers", "order": "desc"})
    items = []
    for u in data.get("items", []):
        items.append({
            "type": "user", "login": u.get("login", ""), "url": u.get("html_url", ""),
            "avatar_url": u.get("avatar_url", ""), "user_type": u.get("type", "User"), "score": u.get("score", 0),
        })
    return items, data.get("total_count", 0)

async def search_code(query: str, per_page: int = 10):
    data = await github_request("/search/code", {"q": query, "per_page": per_page}, requires_auth=True)
    items = []
    for c in data.get("items", []):
        items.append({
            "type": "code", "name": c.get("name", ""), "path": c.get("path", ""),
            "url": c.get("html_url", ""), "repository": c.get("repository", {}).get("full_name", ""),
            "repo_url": c.get("repository", {}).get("html_url", ""), "score": c.get("score", 0),
        })
    return items, data.get("total_count", 0)

async def search_commits(query: str, per_page: int = 10):
    data = await github_request("/search/commits", {"q": query, "per_page": per_page, "sort": "author-date", "order": "desc"})
    items = []
    for c in data.get("items", []):
        items.append({
            "type": "commit", "message": (c.get("commit", {}).get("message", "") or "")[:200],
            "url": c.get("html_url", ""),
            "author": c.get("author", {}).get("login", "") if c.get("author") else c.get("commit", {}).get("author", {}).get("name", ""),
            "author_avatar": (c.get("author") or {}).get("avatar_url", ""),
            "date": c.get("commit", {}).get("author", {}).get("date", ""),
            "repository": c.get("repository", {}).get("full_name", ""), "sha": c.get("sha", "")[:7],
        })
    return items, data.get("total_count", 0)

SEARCH_FUNCTIONS = {
    "repositories": search_repositories, "issues": search_issues,
    "pull_requests": search_issues, "users": search_users,
    "code": search_code, "commits": search_commits,
}

# ─── Search Route ──────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "GitOracle API"}

@api_router.post("/search")
async def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        parsed = await parse_query_with_llm(req.query, req.entity_types)
    except Exception as e:
        logger.error(f"LLM parsing failed: {e}")
        parsed = {"entity_types": req.entity_types or ["repositories", "issues"], "search_queries": {}}
        for et in parsed["entity_types"]:
            parsed["search_queries"][et] = req.query

    entity_types = parsed.get("entity_types", ["repositories"])
    search_queries = parsed.get("search_queries", {})
    if req.entity_types:
        entity_types = req.entity_types

    results, result_counts, errors = {}, {}, {}
    for etype in entity_types:
        query_str = search_queries.get(etype, req.query)
        search_fn = SEARCH_FUNCTIONS.get(etype)
        if not search_fn:
            continue
        try:
            items, total = await search_fn(query_str)
            results[etype] = items
            result_counts[etype] = total
        except HTTPException as he:
            errors[etype] = he.detail
        except Exception as e:
            logger.error(f"Search failed for {etype}: {e}")
            errors[etype] = str(e)

    history_item = SearchHistoryItem(query=req.query, parsed_intent=parsed, result_counts=result_counts)
    await db.search_history.insert_one(history_item.model_dump())
    return {"query": req.query, "parsed": parsed, "results": results, "result_counts": result_counts, "errors": errors}

# ─── Search History ────────────────────────────────────────────────────

@api_router.get("/search/history")
async def get_search_history():
    return await db.search_history.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)

@api_router.delete("/search/history/{item_id}")
async def delete_search_history(item_id: str):
    r = await db.search_history.delete_one({"id": item_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}

@api_router.delete("/search/history")
async def clear_search_history():
    await db.search_history.delete_many({})
    return {"status": "cleared"}

# ─── GitHub Token Settings ─────────────────────────────────────────────

@api_router.post("/settings/github-token")
async def save_github_token(req: GitHubTokenRequest):
    headers = {"Authorization": f"Bearer {req.token}", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=10.0) as hc:
        resp = await hc.get(f"{GITHUB_API_BASE}/rate_limit", headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid GitHub token")
        rate_data = resp.json()
    await db.settings.update_one({"key": "github_token"}, {"$set": {"key": "github_token", "value": req.token}}, upsert=True)
    return {"status": "saved", "rate_limit": rate_data.get("rate", {})}

@api_router.get("/settings/github-token")
async def get_github_token_status():
    doc = await db.settings.find_one({"key": "github_token"}, {"_id": 0})
    if doc and doc.get("value"):
        headers = {"Authorization": f"Bearer {doc['value']}", "Accept": "application/vnd.github+json"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as hc:
                resp = await hc.get(f"{GITHUB_API_BASE}/rate_limit", headers=headers)
                rate_data = resp.json() if resp.status_code == 200 else {}
        except Exception:
            rate_data = {}
        return {"has_token": True, "token_preview": doc["value"][:4] + "..." + doc["value"][-4:], "rate_limit": rate_data.get("rate", {})}
    return {"has_token": False}

@api_router.delete("/settings/github-token")
async def delete_github_token():
    await db.settings.delete_one({"key": "github_token"})
    return {"status": "deleted"}

@api_router.get("/search/suggestions")
async def get_search_suggestions():
    return {"suggestions": [
        "Python projects about machine learning with over 1000 stars",
        "Recent open issues about authentication bugs",
        "React component libraries with TypeScript support",
        "Merged pull requests fixing memory leaks in Go",
        "Developers in San Francisco who work with Rust",
        "Code examples using TensorFlow in Jupyter notebooks",
        "Commits related to security patches this year",
        "FastAPI projects with Docker support",
    ]}

# ─── Trending ──────────────────────────────────────────────────────────

PERIOD_MAP = {
    "daily": 1, "weekly": 7, "monthly": 30,
    "3months": 90, "6months": 180, "yearly": 365,
}

@api_router.get("/trending")
async def get_trending(
    period: str = Query("weekly", regex="^(daily|weekly|monthly|3months|6months|yearly)$"),
    language: str = Query("", description="Filter by language"),
):
    days = PERIOD_MAP.get(period, 7)
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    q = f"created:>{date_from} stars:>5"
    if language:
        q += f" language:{language}"
    data = await github_request("/search/repositories", {"q": q, "sort": "stars", "order": "desc", "per_page": 20})
    items = []
    for r in data.get("items", []):
        items.append({
            "type": "repository", "name": r.get("full_name", ""), "description": r.get("description", ""),
            "url": r.get("html_url", ""), "stars": r.get("stargazers_count", 0), "forks": r.get("forks_count", 0),
            "language": r.get("language", ""), "topics": r.get("topics", [])[:5], "updated_at": r.get("updated_at", ""),
            "created_at": r.get("created_at", ""), "owner_avatar": r.get("owner", {}).get("avatar_url", ""),
            "license": (r.get("license") or {}).get("spdx_id", ""),
        })
    return {"period": period, "language": language, "date_from": date_from, "total_count": data.get("total_count", 0), "items": items}

@api_router.get("/trending/topics")
async def get_trending_topics(
    period: str = Query("weekly", regex="^(daily|weekly|monthly|3months|6months|yearly)$"),
):
    days = PERIOD_MAP.get(period, 7)
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    q = f"created:>{date_from} stars:>10"
    data = await github_request("/search/repositories", {"q": q, "sort": "stars", "order": "desc", "per_page": 100})

    # Aggregate topics from trending repos
    topic_counts = {}
    topic_repos = {}
    for r in data.get("items", []):
        for t in r.get("topics", []):
            topic_counts[t] = topic_counts.get(t, 0) + 1
            if t not in topic_repos:
                topic_repos[t] = []
            if len(topic_repos[t]) < 3:
                topic_repos[t].append({
                    "name": r.get("full_name", ""), "stars": r.get("stargazers_count", 0),
                    "description": (r.get("description") or "")[:100], "url": r.get("html_url", ""),
                })

    # Also aggregate languages
    lang_counts = {}
    for r in data.get("items", []):
        lang = r.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    sorted_langs = sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:15]

    topics = [{"name": t, "count": c, "repos": topic_repos.get(t, [])} for t, c in sorted_topics]
    languages = [{"name": l, "count": c} for l, c in sorted_langs]

    return {"period": period, "date_from": date_from, "topics": topics, "languages": languages}

# ─── Repo Detail ───────────────────────────────────────────────────────

@api_router.get("/repo/{owner}/{name}")
async def get_repo_detail(owner: str, name: str):
    repo = await github_request(f"/repos/{owner}/{name}")
    # Get README
    readme_content = ""
    try:
        readme_data = await github_request(f"/repos/{owner}/{name}/readme")
        if readme_data.get("content"):
            readme_content = base64.b64decode(readme_data["content"]).decode("utf-8", errors="replace")
    except Exception:
        pass

    # Get contributors (top 10)
    contributors = []
    try:
        contribs = await github_request(f"/repos/{owner}/{name}/contributors", {"per_page": 10})
        for c in contribs:
            contributors.append({
                "login": c.get("login", ""), "avatar_url": c.get("avatar_url", ""),
                "contributions": c.get("contributions", 0), "url": c.get("html_url", ""),
            })
    except Exception:
        pass

    # Get recent commits (5)
    recent_commits = []
    try:
        commits = await github_request(f"/repos/{owner}/{name}/commits", {"per_page": 5})
        for c in commits:
            recent_commits.append({
                "sha": c.get("sha", "")[:7], "message": (c.get("commit", {}).get("message", "") or "")[:120],
                "author": (c.get("author") or {}).get("login", c.get("commit", {}).get("author", {}).get("name", "")),
                "date": c.get("commit", {}).get("author", {}).get("date", ""),
                "url": c.get("html_url", ""),
            })
    except Exception:
        pass

    # Get languages
    languages = {}
    try:
        languages = await github_request(f"/repos/{owner}/{name}/languages")
    except Exception:
        pass

    return {
        "name": repo.get("full_name", ""), "description": repo.get("description", ""),
        "url": repo.get("html_url", ""), "homepage": repo.get("homepage", ""),
        "stars": repo.get("stargazers_count", 0), "forks": repo.get("forks_count", 0),
        "watchers": repo.get("watchers_count", 0), "open_issues": repo.get("open_issues_count", 0),
        "language": repo.get("language", ""), "topics": repo.get("topics", []),
        "license": (repo.get("license") or {}).get("spdx_id", ""),
        "created_at": repo.get("created_at", ""), "updated_at": repo.get("updated_at", ""),
        "pushed_at": repo.get("pushed_at", ""), "default_branch": repo.get("default_branch", "main"),
        "owner": {"login": repo.get("owner", {}).get("login", ""), "avatar_url": repo.get("owner", {}).get("avatar_url", ""), "url": repo.get("owner", {}).get("html_url", "")},
        "readme": readme_content[:15000],
        "contributors": contributors, "recent_commits": recent_commits,
        "languages": languages, "size": repo.get("size", 0),
        "is_fork": repo.get("fork", False), "archived": repo.get("archived", False),
        "subscribers_count": repo.get("subscribers_count", 0),
        "network_count": repo.get("network_count", 0),
    }

# ─── User Detail ───────────────────────────────────────────────────────

@api_router.get("/user/{login}")
async def get_user_detail(login: str):
    user = await github_request(f"/users/{login}")
    # Get repos
    repos = []
    try:
        repo_data = await github_request(f"/users/{login}/repos", {"sort": "stars", "direction": "desc", "per_page": 10})
        for r in repo_data:
            repos.append({
                "name": r.get("full_name", ""), "description": (r.get("description") or "")[:120],
                "url": r.get("html_url", ""), "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0), "language": r.get("language", ""),
                "updated_at": r.get("updated_at", ""),
            })
    except Exception:
        pass

    return {
        "login": user.get("login", ""), "name": user.get("name", ""),
        "avatar_url": user.get("avatar_url", ""), "url": user.get("html_url", ""),
        "bio": user.get("bio", ""), "company": user.get("company", ""),
        "location": user.get("location", ""), "blog": user.get("blog", ""),
        "twitter": user.get("twitter_username", ""),
        "public_repos": user.get("public_repos", 0), "public_gists": user.get("public_gists", 0),
        "followers": user.get("followers", 0), "following": user.get("following", 0),
        "created_at": user.get("created_at", ""), "user_type": user.get("type", "User"),
        "repos": repos,
    }

# ─── Compare Repos ─────────────────────────────────────────────────────

@api_router.get("/compare")
async def compare_repos(repos: str = Query(..., description="Comma-separated owner/name pairs")):
    repo_list = [r.strip() for r in repos.split(",") if r.strip()]
    if len(repo_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 repos to compare")
    if len(repo_list) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 repos to compare")

    results = []
    for repo_name in repo_list:
        parts = repo_name.split("/")
        if len(parts) != 2:
            continue
        try:
            repo = await github_request(f"/repos/{parts[0]}/{parts[1]}")
            languages = {}
            try:
                languages = await github_request(f"/repos/{parts[0]}/{parts[1]}/languages")
            except Exception:
                pass
            results.append({
                "name": repo.get("full_name", ""), "description": repo.get("description", ""),
                "url": repo.get("html_url", ""), "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0), "watchers": repo.get("watchers_count", 0),
                "open_issues": repo.get("open_issues_count", 0), "language": repo.get("language", ""),
                "topics": repo.get("topics", [])[:5], "created_at": repo.get("created_at", ""),
                "updated_at": repo.get("updated_at", ""), "pushed_at": repo.get("pushed_at", ""),
                "license": (repo.get("license") or {}).get("spdx_id", ""),
                "owner_avatar": repo.get("owner", {}).get("avatar_url", ""),
                "size": repo.get("size", 0), "languages": languages,
                "subscribers_count": repo.get("subscribers_count", 0),
                "default_branch": repo.get("default_branch", "main"),
            })
        except Exception as e:
            results.append({"name": repo_name, "error": str(e)})
    return {"repos": results}

# ─── Bookmarks ─────────────────────────────────────────────────────────

@api_router.post("/bookmarks")
async def add_bookmark(req: BookmarkRequest):
    bookmark = {
        "id": str(uuid.uuid4()), "item_type": req.item_type,
        "item_data": req.item_data, "note": req.note or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookmarks.insert_one(bookmark)
    bookmark.pop("_id", None)
    return bookmark

@api_router.get("/bookmarks")
async def get_bookmarks():
    return await db.bookmarks.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    r = await db.bookmarks.delete_one({"id": bookmark_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"status": "deleted"}

@api_router.put("/bookmarks/{bookmark_id}/note")
async def update_bookmark_note(bookmark_id: str, req: NoteRequest):
    r = await db.bookmarks.update_one({"id": bookmark_id}, {"$set": {"note": req.note}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"status": "updated"}

# ─── AI Insights ───────────────────────────────────────────────────────

@api_router.post("/ai-insights")
async def get_ai_insights(req: AIInsightRequest):
    context = req.context or ""
    if req.repo_full_name:
        try:
            parts = req.repo_full_name.split("/")
            repo = await github_request(f"/repos/{parts[0]}/{parts[1]}")
            readme_content = ""
            try:
                rd = await github_request(f"/repos/{parts[0]}/{parts[1]}/readme")
                if rd.get("content"):
                    readme_content = base64.b64decode(rd["content"]).decode("utf-8", errors="replace")[:3000]
            except Exception:
                pass
            context = f"""Repository: {repo.get('full_name')}
Description: {repo.get('description', 'N/A')}
Language: {repo.get('language', 'N/A')}
Stars: {repo.get('stargazers_count', 0)} | Forks: {repo.get('forks_count', 0)}
Topics: {', '.join(repo.get('topics', []))}
README excerpt: {readme_content[:2000]}"""
        except Exception as e:
            context = f"Repository: {req.repo_full_name} (could not fetch details: {e})"

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a technical analyst. Provide a concise, insightful analysis. Include: 1) What this project does in 1-2 sentences, 2) Key strengths, 3) Tech stack analysis, 4) Who should use this, 5) One interesting fact or insight. Be direct and technical. No fluff."},
            {"role": "user", "content": f"Analyze this GitHub resource:\n{context}"}
        ],
        temperature=0.3, max_tokens=600
    )
    return {"insight": response.choices[0].message.content}

# ─── Include router & middleware ───────────────────────────────────────

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
