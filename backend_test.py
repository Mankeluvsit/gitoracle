import requests
import sys
import json
from datetime import datetime

class GitOracleAPITester:
    def __init__(self, base_url="https://repofinder-ai.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    self.test_results[name] = {"status": "PASSED", "data": response_data}
                except:
                    response_data = {}
                    self.test_results[name] = {"status": "PASSED", "data": {}}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_content = response.text
                    print(f"   Error: {error_content}")
                    self.test_results[name] = {"status": "FAILED", "expected": expected_status, "actual": response.status_code, "error": error_content}
                except:
                    self.test_results[name] = {"status": "FAILED", "expected": expected_status, "actual": response.status_code}

            return success, response_data if success else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after 30 seconds")
            self.test_results[name] = {"status": "FAILED", "error": "Timeout"}
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results[name] = {"status": "FAILED", "error": str(e)}
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_search_suggestions(self):
        """Test search suggestions endpoint"""
        success, response = self.run_test("Search Suggestions", "GET", "search/suggestions", 200)
        if success and 'suggestions' in response:
            print(f"   ✓ Found {len(response['suggestions'])} suggestions")
        return success

    def test_search_basic(self):
        """Test basic search functionality"""
        search_data = {"query": "python machine learning"}
        success, response = self.run_test("Basic Search", "POST", "search", 200, search_data)
        if success:
            if 'results' in response:
                print(f"   ✓ Search returned results: {list(response['results'].keys())}")
            if 'result_counts' in response:
                total_results = sum(response['result_counts'].values())
                print(f"   ✓ Total results: {total_results}")
        return success

    def test_search_with_entity_filter(self):
        """Test search with entity type filtering"""
        search_data = {"query": "javascript", "entity_types": ["repositories"]}
        success, response = self.run_test("Filtered Search", "POST", "search", 200, search_data)
        if success and 'results' in response:
            entity_types = list(response['results'].keys())
            print(f"   ✓ Filtered search returned: {entity_types}")
        return success

    def test_search_empty_query(self):
        """Test search with empty query (should fail)"""
        search_data = {"query": ""}
        return self.run_test("Empty Query Search", "POST", "search", 400, search_data)

    def test_github_token_get_status(self):
        """Test getting GitHub token status"""
        return self.run_test("GitHub Token Status", "GET", "settings/github-token", 200)

    def test_github_token_invalid_save(self):
        """Test saving invalid GitHub token"""
        token_data = {"token": "invalid_token_12345"}
        return self.run_test("Invalid GitHub Token Save", "POST", "settings/github-token", 400, token_data)

    def test_search_history_get(self):
        """Test getting search history"""
        success, response = self.run_test("Search History Get", "GET", "search/history", 200)
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} history items")
        return success

    def test_search_history_clear(self):
        """Test clearing search history"""
        return self.run_test("Clear Search History", "DELETE", "search/history", 200)

    def test_comprehensive_search(self):
        """Test search across multiple entity types"""
        search_data = {"query": "React TypeScript components"}
        success, response = self.run_test("Comprehensive Search", "POST", "search", 200, search_data)
        if success:
            results = response.get('results', {})
            if results:
                print(f"   ✓ Multi-entity search found: {', '.join(results.keys())}")
                for entity_type, items in results.items():
                    if items:
                        print(f"   ✓ {entity_type}: {len(items)} items")
        return success

    def test_trending_repos(self):
        """Test trending repositories endpoint"""
        success, response = self.run_test("Trending Repos", "GET", "trending?period=weekly", 200)
        if success and 'items' in response:
            print(f"   ✓ Found {len(response['items'])} trending repos")
            if response.get('total_count'):
                print(f"   ✓ Total trending repos: {response['total_count']}")
        return success

    def test_trending_with_language(self):
        """Test trending repositories with language filter"""
        success, response = self.run_test("Trending Python", "GET", "trending?period=monthly&language=Python", 200)
        if success and 'items' in response:
            print(f"   ✓ Found {len(response['items'])} Python trending repos")
        return success

    def test_trending_topics(self):
        """Test trending topics endpoint"""
        success, response = self.run_test("Trending Topics", "GET", "trending/topics?period=weekly", 200)
        if success:
            if 'topics' in response:
                print(f"   ✓ Found {len(response['topics'])} trending topics")
            if 'languages' in response:
                print(f"   ✓ Found {len(response['languages'])} trending languages")
        return success

    def test_repo_detail(self):
        """Test repository detail endpoint"""
        success, response = self.run_test("Repo Detail", "GET", "repo/facebook/react", 200)
        if success:
            required_fields = ['name', 'description', 'stars', 'forks', 'language']
            found_fields = [f for f in required_fields if f in response]
            print(f"   ✓ Repo detail has {len(found_fields)}/{len(required_fields)} required fields")
            if 'contributors' in response:
                print(f"   ✓ Found {len(response.get('contributors', []))} contributors")
        return success

    def test_user_detail(self):
        """Test user detail endpoint"""
        success, response = self.run_test("User Detail", "GET", "user/torvalds", 200)
        if success:
            required_fields = ['login', 'avatar_url', 'public_repos', 'followers']
            found_fields = [f for f in required_fields if f in response]
            print(f"   ✓ User detail has {len(found_fields)}/{len(required_fields)} required fields")
            if 'repos' in response:
                print(f"   ✓ Found {len(response.get('repos', []))} user repos")
        return success

    def test_compare_repos(self):
        """Test repository comparison endpoint"""
        success, response = self.run_test("Compare Repos", "GET", "compare?repos=facebook/react,vuejs/vue", 200)
        if success and 'repos' in response:
            print(f"   ✓ Comparing {len(response['repos'])} repos")
            for repo in response['repos']:
                if 'error' not in repo:
                    print(f"   ✓ {repo.get('name', 'Unknown')}: {repo.get('stars', 0)} stars")
        return success

    def test_compare_single_repo(self):
        """Test repository comparison with single repo (should fail)"""
        return self.run_test("Compare Single Repo", "GET", "compare?repos=facebook/react", 400)

    def test_bookmarks_get_empty(self):
        """Test getting bookmarks (initially empty)"""
        success, response = self.run_test("Get Empty Bookmarks", "GET", "bookmarks", 200)
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} bookmarks")
        return success

    def test_bookmarks_add_repo(self):
        """Test adding a repository bookmark"""
        bookmark_data = {
            "item_type": "repository",
            "item_data": {
                "name": "facebook/react",
                "description": "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
                "url": "https://github.com/facebook/react",
                "stars": 220000,
                "language": "JavaScript"
            },
            "note": "Popular React library"
        }
        success, response = self.run_test("Add Repo Bookmark", "POST", "bookmarks", 200, bookmark_data)
        if success and 'id' in response:
            print(f"   ✓ Created bookmark with ID: {response['id']}")
            # Store the bookmark ID for later tests
            self.bookmark_id = response['id']
        return success

    def test_bookmarks_get_with_items(self):
        """Test getting bookmarks after adding one"""
        success, response = self.run_test("Get Bookmarks", "GET", "bookmarks", 200)
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   ✓ Found {len(response)} bookmarks")
            bookmark = response[0]
            if 'note' in bookmark:
                print(f"   ✓ Bookmark has note: {bookmark['note'][:50]}...")
        return success

    def test_bookmarks_update_note(self):
        """Test updating bookmark note"""
        if not hasattr(self, 'bookmark_id'):
            print("   ⚠️  Skipping - no bookmark ID available")
            return True
        
        note_data = {"bookmark_id": self.bookmark_id, "note": "Updated note for React"}
        return self.run_test("Update Bookmark Note", "PUT", f"bookmarks/{self.bookmark_id}/note", 200, note_data)

    def test_bookmarks_delete(self):
        """Test deleting a bookmark"""
        if not hasattr(self, 'bookmark_id'):
            print("   ⚠️  Skipping - no bookmark ID available")
            return True
        
        return self.run_test("Delete Bookmark", "DELETE", f"bookmarks/{self.bookmark_id}", 200)

    def test_ai_insights_repo(self):
        """Test AI insights for repository"""
        insight_data = {"repo_full_name": "facebook/react"}
        success, response = self.run_test("AI Insights Repo", "POST", "ai-insights", 200, insight_data)
        if success and 'insight' in response:
            insight_len = len(response['insight'])
            print(f"   ✓ Generated AI insight ({insight_len} chars)")
            if insight_len > 100:
                print(f"   ✓ Insight preview: {response['insight'][:100]}...")
        return success

def main():
    print("🚀 Starting GitOracle API Tests")
    print("="*60)
    
    tester = GitOracleAPITester()

    # Run all tests in logical order
    tests_to_run = [
        # Basic API tests
        tester.test_root_endpoint,
        tester.test_search_suggestions,
        tester.test_github_token_get_status,
        
        # Search functionality tests
        tester.test_search_basic,
        tester.test_search_with_entity_filter,
        tester.test_comprehensive_search,
        tester.test_search_empty_query,
        
        # Trending functionality tests
        tester.test_trending_repos,
        tester.test_trending_with_language,
        tester.test_trending_topics,
        
        # Detail page tests
        tester.test_repo_detail,
        tester.test_user_detail,
        
        # Compare functionality tests
        tester.test_compare_repos,
        tester.test_compare_single_repo,
        
        # Bookmark functionality tests
        tester.test_bookmarks_get_empty,
        tester.test_bookmarks_add_repo,
        tester.test_bookmarks_get_with_items,
        tester.test_bookmarks_update_note,
        tester.test_bookmarks_delete,
        
        # AI functionality tests
        tester.test_ai_insights_repo,
        
        # Cleanup tests
        tester.test_github_token_invalid_save,
        tester.test_search_history_get,
        tester.test_search_history_clear,
    ]

    print(f"\n📋 Running {len(tests_to_run)} API tests...")
    
    for test in tests_to_run:
        test()

    # Print final results
    print("\n" + "="*60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed_tests = [name for name, result in tester.test_results.items() if result.get("status") == "FAILED"]
        print(f"⚠️  Failed tests: {', '.join(failed_tests)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())