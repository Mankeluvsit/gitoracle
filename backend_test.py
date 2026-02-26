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

def main():
    print("🚀 Starting GitOracle API Tests")
    print("="*60)
    
    tester = GitOracleAPITester()

    # Run all tests in logical order
    tests_to_run = [
        tester.test_root_endpoint,
        tester.test_search_suggestions,
        tester.test_github_token_get_status,
        tester.test_search_basic,
        tester.test_search_with_entity_filter,
        tester.test_comprehensive_search,
        tester.test_search_empty_query,
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