import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { SearchBar } from "@/components/SearchBar";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SearchHistory } from "@/components/SearchHistory";
import { HeroSection } from "@/components/HeroSection";
import { ResourceFilter } from "@/components/ResourceFilter";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [resultCounts, setResultCounts] = useState({});
  const [parsed, setParsed] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      const resp = await axios.get(`${API}/search/history`);
      setHistory(resp.data);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSearch = async (searchQuery, entityTypes = null) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setErrors({});
    try {
      const payload = { query: q };
      const resources = entityTypes || (selectedResources.length > 0 ? selectedResources : null);
      if (resources) payload.entity_types = resources;
      const resp = await axios.post(`${API}/search`, payload);
      setResults(resp.data.results);
      setResultCounts(resp.data.result_counts || {});
      setParsed(resp.data.parsed);
      setErrors(resp.data.errors || {});
      setActiveTab("all");
      fetchHistory();
      if (Object.keys(resp.data.errors || {}).length > 0) {
        toast.warning(`Some searches failed: ${Object.keys(resp.data.errors).join(", ")}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API}/search/history`);
      setHistory([]);
      toast.success("History cleared");
    } catch (e) { toast.error("Failed to clear history"); }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="search-page">
      <main className="max-w-7xl mx-auto px-6 md:px-12">
        {!hasSearched && <HeroSection />}

        <div className={hasSearched ? "pt-8" : "pt-0"}>
          <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />
          <ResourceFilter selected={selectedResources} onChange={setSelectedResources} />
        </div>

        {!hasSearched && history.length > 0 && (
          <SearchHistory history={history} onHistoryClick={handleHistoryClick} onClearHistory={handleClearHistory} />
        )}

        {hasSearched && (
          <ResultsPanel
            results={results} resultCounts={resultCounts} parsed={parsed}
            errors={errors} loading={loading} activeTab={activeTab} setActiveTab={setActiveTab}
          />
        )}
      </main>
    </div>
  );
}
