import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { GitCompare, Plus, X, Loader2, Star, GitFork, Eye, Circle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF",
};

const formatNum = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const formatBytes = (kb) => {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
};

export default function ComparePage() {
  const [repoInputs, setRepoInputs] = useState(["", ""]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addInput = () => {
    if (repoInputs.length < 4) setRepoInputs([...repoInputs, ""]);
  };

  const removeInput = (index) => {
    if (repoInputs.length > 2) {
      setRepoInputs(repoInputs.filter((_, i) => i !== index));
    }
  };

  const updateInput = (index, value) => {
    const updated = [...repoInputs];
    updated[index] = value;
    setRepoInputs(updated);
  };

  const handleCompare = async () => {
    const valid = repoInputs.filter((r) => r.trim() && r.includes("/"));
    if (valid.length < 2) {
      toast.error("Enter at least 2 repos in owner/name format");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/compare?repos=${valid.join(",")}`);
      setCompareData(resp.data.repos);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: "Stars", key: "stars", icon: Star },
    { label: "Forks", key: "forks", icon: GitFork },
    { label: "Watchers", key: "subscribers_count", icon: Eye },
    { label: "Issues", key: "open_issues", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="compare-page">
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-[Chivo]">
              Compare
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare GitHub repositories side by side
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl space-y-3 mb-8" data-testid="compare-inputs">
          {repoInputs.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/40 w-4">{i + 1}.</span>
              <Input
                value={val}
                onChange={(e) => updateInput(i, e.target.value)}
                placeholder="owner/repo (e.g., facebook/react)"
                className="bg-card border-border"
                data-testid={`compare-input-${i}`}
              />
              {repoInputs.length > 2 && (
                <button onClick={() => removeInput(i)} className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors duration-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            {repoInputs.length < 4 && (
              <Button variant="ghost" size="sm" onClick={addInput} className="text-xs font-mono" data-testid="compare-add-repo">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Repo
              </Button>
            )}
            <Button
              onClick={handleCompare}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider px-6"
              data-testid="compare-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
              Compare
            </Button>
          </div>
        </div>

        {/* Comparison Results */}
        {compareData && (
          <div className="space-y-8 animate-fade-in-up" data-testid="compare-results">
            {/* Metric Bars */}
            {metrics.map((metric) => {
              const values = compareData.filter(r => !r.error).map((r) => r[metric.key] || 0);
              const maxVal = Math.max(...values, 1);
              return (
                <div key={metric.key} className="space-y-3" data-testid={`metric-${metric.key}`}>
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
                      {metric.label}
                    </span>
                  </div>
                  {compareData.filter(r => !r.error).map((repo, i) => {
                    const val = repo[metric.key] || 0;
                    const pct = (val / maxVal) * 100;
                    const isMax = val === maxVal && values.filter(v => v === maxVal).length === 1;
                    return (
                      <div key={repo.name} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-40 truncate">{repo.name}</span>
                        <div className="flex-1 h-6 bg-accent/30 relative">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${isMax ? "bg-primary" : "bg-muted-foreground/30"}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono w-16 text-right ${isMax ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {formatNum(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Detail Cards */}
            <div className={`grid gap-4 ${compareData.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
              {compareData.filter(r => !r.error).map((repo) => (
                <div
                  key={repo.name}
                  className="bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300 cursor-pointer"
                  onClick={() => {
                    const parts = repo.name.split("/");
                    if (parts.length === 2) navigate(`/repo/${parts[0]}/${parts[1]}`);
                  }}
                  data-testid={`compare-card-${repo.name}`}
                >
                  <div className="p-5 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      {repo.owner_avatar && <img src={repo.owner_avatar} alt="" className="w-8 h-8 border border-border/50" />}
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{repo.name}</h3>
                        {repo.language && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                            <Circle className="w-2 h-2 fill-current" style={{ color: LANG_COLORS[repo.language] || "#666" }} />
                            {repo.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-2 text-xs font-mono text-muted-foreground">
                    {repo.description && <p className="text-sm font-sans line-clamp-2">{repo.description}</p>}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <span>Size: {formatBytes(repo.size)}</span>
                      <span>License: {repo.license || "None"}</span>
                      <span>Branch: {repo.default_branch}</span>
                      <span>Topics: {repo.topics?.length || 0}</span>
                    </div>
                    {repo.languages && Object.keys(repo.languages).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {Object.entries(repo.languages).slice(0, 5).map(([lang, bytes]) => (
                          <Badge key={lang} className="bg-accent text-muted-foreground border-0 text-[9px] font-mono">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
