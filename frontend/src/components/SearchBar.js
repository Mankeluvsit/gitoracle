import { useState, useEffect } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SearchBar = ({ query, setQuery, onSearch, loading }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const resp = await axios.get(`${API}/search/suggestions`);
        setSuggestions(resp.data.suggestions || []);
      } catch (e) {
        // silent
      }
    };
    fetchSuggestions();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto z-20" data-testid="search-bar-wrapper">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => !query && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search GitHub in plain English..."
            className="h-14 md:h-16 pl-14 pr-14 text-base md:text-lg bg-card border-2 border-border focus-visible:border-primary focus-visible:ring-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/50 font-[Manrope]"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            data-testid="search-submit-button"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,176,0,0.3)] h-9 w-9"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute top-full mt-2 w-full bg-card border border-border shadow-2xl z-30"
          data-testid="search-suggestions"
        >
          <div className="p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 px-2">
              Try searching for
            </p>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-150 flex items-center gap-3"
                data-testid={`suggestion-${i}`}
              >
                <Search className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
