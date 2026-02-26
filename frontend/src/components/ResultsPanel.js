import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RepoCard } from "@/components/cards/RepoCard";
import { IssueCard } from "@/components/cards/IssueCard";
import { UserCard } from "@/components/cards/UserCard";
import { CodeCard } from "@/components/cards/CodeCard";
import { CommitCard } from "@/components/cards/CommitCard";
import { AlertCircle, Loader2 } from "lucide-react";

const ENTITY_LABELS = {
  repositories: "Repos",
  issues: "Issues",
  pull_requests: "PRs",
  users: "Users",
  code: "Code",
  commits: "Commits",
};

const formatCount = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export const ResultsPanel = ({ results, resultCounts, parsed, errors, loading, activeTab, setActiveTab }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" data-testid="loading-indicator">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-mono text-muted-foreground">Searching GitHub...</p>
      </div>
    );
  }

  if (!results) return null;

  const entityTypes = Object.keys(results);
  if (entityTypes.length === 0) {
    return (
      <div className="text-center py-24" data-testid="no-results">
        <p className="text-muted-foreground text-lg mb-2">No results found</p>
        <p className="text-muted-foreground/60 text-sm">Try rephrasing your query or broadening your search</p>
      </div>
    );
  }

  // Gather all items for "all" tab
  const allItems = [];
  entityTypes.forEach((type) => {
    (results[type] || []).forEach((item) => {
      allItems.push({ ...item, _entityType: type });
    });
  });

  const getItemsForTab = () => {
    if (activeTab === "all") return allItems;
    return (results[activeTab] || []).map((item) => ({ ...item, _entityType: activeTab }));
  };

  const displayItems = getItemsForTab();

  const totalResults = Object.values(resultCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="pb-16 mt-8" data-testid="results-panel">
      {/* Results summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/60">
            Results
          </p>
          <Badge variant="outline" className="text-[10px] font-mono" data-testid="total-count-badge">
            {formatCount(totalResults)} total
          </Badge>
        </div>
        {parsed && (
          <p className="text-xs text-muted-foreground/40 font-mono hidden md:block" data-testid="parsed-info">
            Searched: {entityTypes.join(", ")}
          </p>
        )}
      </div>

      {/* Error alerts */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 space-y-2">
          {Object.entries(errors).map(([type, msg]) => (
            <div
              key={type}
              className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 text-sm"
              data-testid={`error-${type}`}
            >
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                <strong className="uppercase font-mono text-xs text-primary">{type}:</strong>{" "}
                {msg}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap" data-testid="entity-tabs">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-mono text-xs uppercase tracking-wider px-4 py-2"
            data-testid="tab-all"
          >
            All
            <span className="ml-2 text-[10px] opacity-70">{formatCount(totalResults)}</span>
          </TabsTrigger>
          {entityTypes.map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-mono text-xs uppercase tracking-wider px-4 py-2"
              data-testid={`tab-${type}`}
            >
              {ENTITY_LABELS[type] || type}
              <span className="ml-2 text-[10px] opacity-70">
                {formatCount(resultCounts[type] || 0)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="results-grid">
        {displayItems.map((item, index) => {
          const staggerClass = `stagger-${(index % 8) + 1}`;
          return (
            <div key={`${item.url}-${index}`} className={`animate-fade-in-up opacity-0 ${staggerClass}`}>
              <ResultCard item={item} />
            </div>
          );
        })}
      </div>

      {displayItems.length === 0 && (
        <div className="text-center py-12" data-testid="tab-no-results">
          <p className="text-muted-foreground text-sm">No results in this category</p>
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ item }) => {
  const type = item.type || item._entityType;

  switch (type) {
    case "repository":
      return <RepoCard item={item} />;
    case "issue":
      return <IssueCard item={item} />;
    case "pull_request":
      return <IssueCard item={item} />;
    case "user":
      return <UserCard item={item} />;
    case "code":
      return <CodeCard item={item} />;
    case "commit":
      return <CommitCard item={item} />;
    default:
      return <RepoCard item={item} />;
  }
};
