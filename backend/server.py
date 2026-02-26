from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI client
openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Models ---

class SearchRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None  # filter to specific types

class GitHubTokenRequest(BaseModel):
    token: str

class SearchHistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    parsed_intent: Dict[str, Any] = {}
    result_counts: Dict[str, int] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# --- GitHub API Helper ---

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
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        url = f"{GITHUB_API_BASE}{endpoint}"
        resp = await http_client.get(url, headers=headers, params=params)
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="GitHub token is invalid or expired. Update it in Settings.")
        if resp.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Add a GitHub token in Settings for higher limits.")
        if resp.status_code == 422:
            raise HTTPException(status_code=422, detail="GitHub could not process the search query. Try rephrasing.")
        resp.raise_for_status()
        return resp.json()

# --- NLP Parser using OpenAI ---

PARSE_SYSTEM_PROMPT = """You are a query parser that converts natural language into GitHub search parameters.

Given a user query, extract:
1. entity_types: array of types to search. Options: "repositories", "issues", "pull_requests", "users", "code", "commits". Pick the most relevant ones based on the query. If ambiguous, include multiple.
2. search_queries: a dict mapping each entity_type to the GitHub search query string using GitHub's search qualifiers.

GitHub search qualifier examples:
- Repositories: "machine learning language:python stars:>1000"
- Issues: "authentication bug is:issue is:open"
- PRs: "fix memory leak is:pr is:merged"
- Users: "type:user location:\"San Francisco\""
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
        messages=[
            {"role": "system", "content": PARSE_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ],
        temperature=0.1,
        max_tokens=500
    )

    content = response.choices[0].message.content.strip()
    # Clean potential markdown fences
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)

# --- Search Functions ---

async def search_repositories(query: str, per_page: int = 10):
    data = await github_request("/search/repositories", {"q": query, "per_page": per_page, "sort": "stars", "order": "desc"})
    items = []
    for repo in data.get("items", []):
        items.append({
            "type": "repository",
            "name": repo.get("full_name", ""),
            "description": repo.get("description", ""),
            "url": repo.get("html_url", ""),
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "language": repo.get("language", ""),
            "topics": repo.get("topics", [])[:5],
            "updated_at": repo.get("updated_at", ""),
            "owner_avatar": repo.get("owner", {}).get("avatar_url", ""),
            "open_issues": repo.get("open_issues_count", 0),
            "license": (repo.get("license") or {}).get("spdx_id", ""),
            "watchers": repo.get("watchers_count", 0),
        })
    return items, data.get("total_count", 0)

async def search_issues(query: str, per_page: int = 10):
    data = await github_request("/search/issues", {"q": query, "per_page": per_page, "sort": "created", "order": "desc"})
    items = []
    for issue in data.get("items", []):
        is_pr = "pull_request" in issue
        items.append({
            "type": "pull_request" if is_pr else "issue",
            "title": issue.get("title", ""),
            "body": (issue.get("body", "") or "")[:200],
            "url": issue.get("html_url", ""),
            "state": issue.get("state", ""),
            "author": issue.get("user", {}).get("login", ""),
            "author_avatar": issue.get("user", {}).get("avatar_url", ""),
            "created_at": issue.get("created_at", ""),
            "updated_at": issue.get("updated_at", ""),
            "comments": issue.get("comments", 0),
            "labels": [l.get("name", "") for l in issue.get("labels", [])][:5],
            "repository": issue.get("repository_url", "").split("/repos/")[-1] if issue.get("repository_url") else "",
        })
    return items, data.get("total_count", 0)

async def search_users(query: str, per_page: int = 10):
    data = await github_request("/search/users", {"q": query, "per_page": per_page, "sort": "followers", "order": "desc"})
    items = []
    for user in data.get("items", []):
        items.append({
            "type": "user",
            "login": user.get("login", ""),
            "url": user.get("html_url", ""),
            "avatar_url": user.get("avatar_url", ""),
            "user_type": user.get("type", "User"),
            "score": user.get("score", 0),
        })
    return items, data.get("total_count", 0)

async def search_code(query: str, per_page: int = 10):
    data = await github_request("/search/code", {"q": query, "per_page": per_page})
    items = []
    for code in data.get("items", []):
        items.append({
            "type": "code",
            "name": code.get("name", ""),
            "path": code.get("path", ""),
            "url": code.get("html_url", ""),
            "repository": code.get("repository", {}).get("full_name", ""),
            "repo_url": code.get("repository", {}).get("html_url", ""),
            "score": code.get("score", 0),
        })
    return items, data.get("total_count", 0)

async def search_commits(query: str, per_page: int = 10):
    data = await github_request("/search/commits", {"q": query, "per_page": per_page, "sort": "author-date", "order": "desc"})
    items = []
    for commit in data.get("items", []):
        items.append({
            "type": "commit",
            "message": (commit.get("commit", {}).get("message", "") or "")[:200],
            "url": commit.get("html_url", ""),
            "author": commit.get("author", {}).get("login", "") if commit.get("author") else commit.get("commit", {}).get("author", {}).get("name", ""),
            "author_avatar": (commit.get("author") or {}).get("avatar_url", ""),
            "date": commit.get("commit", {}).get("author", {}).get("date", ""),
            "repository": commit.get("repository", {}).get("full_name", ""),
            "sha": commit.get("sha", "")[:7],
        })
    return items, data.get("total_count", 0)

SEARCH_FUNCTIONS = {
    "repositories": search_repositories,
    "issues": search_issues,
    "pull_requests": search_issues,  # uses same endpoint with is:pr qualifier
    "users": search_users,
    "code": search_code,
    "commits": search_commits,
}

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "GitOracle API"}

@api_router.post("/search")
async def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Parse NL query with LLM
    try:
        parsed = await parse_query_with_llm(req.query, req.entity_types)
    except Exception as e:
        logger.error(f"LLM parsing failed: {e}")
        # Fallback: search repos and issues with raw query
        parsed = {
            "entity_types": req.entity_types or ["repositories", "issues"],
            "search_queries": {}
        }
        for et in parsed["entity_types"]:
            parsed["search_queries"][et] = req.query

    entity_types = parsed.get("entity_types", ["repositories"])
    search_queries = parsed.get("search_queries", {})

    # If user specified entity_types filter, override
    if req.entity_types:
        entity_types = req.entity_types

    results = {}
    result_counts = {}
    errors = {}

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

    # Save to search history
    history_item = SearchHistoryItem(
        query=req.query,
        parsed_intent=parsed,
        result_counts=result_counts,
    )
    await db.search_history.insert_one(history_item.model_dump())

    return {
        "query": req.query,
        "parsed": parsed,
        "results": results,
        "result_counts": result_counts,
        "errors": errors,
    }

@api_router.get("/search/history")
async def get_search_history():
    items = await db.search_history.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    return items

@api_router.delete("/search/history/{item_id}")
async def delete_search_history(item_id: str):
    result = await db.search_history.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"status": "deleted"}

@api_router.delete("/search/history")
async def clear_search_history():
    await db.search_history.delete_many({})
    return {"status": "cleared"}

@api_router.post("/settings/github-token")
async def save_github_token(req: GitHubTokenRequest):
    # Validate token by making a test request
    headers = {
        "Authorization": f"Bearer {req.token}",
        "Accept": "application/vnd.github+json"
    }
    async with httpx.AsyncClient(timeout=10.0) as http_client:
        resp = await http_client.get(f"{GITHUB_API_BASE}/rate_limit", headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid GitHub token")
        rate_data = resp.json()

    await db.settings.update_one(
        {"key": "github_token"},
        {"$set": {"key": "github_token", "value": req.token}},
        upsert=True
    )
    return {
        "status": "saved",
        "rate_limit": rate_data.get("rate", {})
    }

@api_router.get("/settings/github-token")
async def get_github_token_status():
    doc = await db.settings.find_one({"key": "github_token"}, {"_id": 0})
    if doc and doc.get("value"):
        # Check rate limit
        headers = {
            "Authorization": f"Bearer {doc['value']}",
            "Accept": "application/vnd.github+json"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.get(f"{GITHUB_API_BASE}/rate_limit", headers=headers)
                rate_data = resp.json() if resp.status_code == 200 else {}
        except Exception:
            rate_data = {}
        return {
            "has_token": True,
            "token_preview": doc["value"][:4] + "..." + doc["value"][-4:],
            "rate_limit": rate_data.get("rate", {})
        }
    return {"has_token": False}

@api_router.delete("/settings/github-token")
async def delete_github_token():
    await db.settings.delete_one({"key": "github_token"})
    return {"status": "deleted"}

@api_router.get("/search/suggestions")
async def get_search_suggestions():
    return {
        "suggestions": [
            "Python projects about machine learning with over 1000 stars",
            "Recent open issues about authentication bugs",
            "React component libraries with TypeScript support",
            "Merged pull requests fixing memory leaks in Go",
            "Developers in San Francisco who work with Rust",
            "Code examples using TensorFlow in Jupyter notebooks",
            "Commits related to security patches this year",
            "FastAPI projects with Docker support",
        ]
    }

# Include router & middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
