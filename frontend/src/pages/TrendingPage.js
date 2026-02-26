import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TrendingUp, Flame, Hash, Loader2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RepoCard } from "@/components/cards/RepoCard";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PERIODS = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
  { key: "3months", label: "3 Months" },
  { key: "6months", label: "6 Months" },
  { key: "yearly", label: "1 Year" },
];

const LANGUAGES = [
  "", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Java",
  "C++", "C", "Ruby", "PHP", "Swift", "Kotlin", "Dart", "Shell",
];

export default function TrendingPage() {
  const [period, setPeriod] = useState("weekly");
  const [language, setLanguage] = useState("");
  const [repos, setRepos] = useState([]);
  const [topics, setTopics] = useState([]);
  const [trendingLangs, setTrendingLangs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeView, setActiveView] = useState("repos");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
    fetchTopics();
  }, [period, language]); // eslint-disable-line

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (language) params.append("language", language);
      const resp = await axios.get(`${API}/trending?${params}`);
      setRepos(resp.data.items || []);
      setTotalCount(resp.data.total_count || 0);
    } catch (e) {
      toast.error("Failed to fetch trending repos");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const resp = await axios.get(`${API}/trending/topics?period=${period}`);
      setTopics(resp.data.topics || []);
      setTrendingLangs(resp.data.languages || []);
    } catch (e) {
      // silent
    } finally {
      setTopicsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="trending-page">
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-[Chivo]">
                Trending
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover what's gaining traction on GitHub across any time period
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]" data-testid="trending-total">
            {totalCount.toLocaleString()} repos
          </Badge>
        </div>

        {/* Time Period Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
              Time Period
            </span>
          </div>
          <div className="flex flex-wrap gap-2" data-testid="period-selector">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                data-testid={`period-${p.key}`}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors duration-200 ${
                  period === p.key
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(255,176,0,0.2)]"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Tabs + Language Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2" data-testid="view-tabs">
            <button
              onClick={() => setActiveView("repos")}
              data-testid="view-repos"
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors duration-200 ${
                activeView === "repos"
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Repositories
            </button>
            <button
              onClick={() => setActiveView("topics")}
              data-testid="view-topics"
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors duration-200 ${
                activeView === "topics"
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hash className="w-3.5 h-3.5" /> Topics & Languages
            </button>
          </div>

          {activeView === "repos" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
                Language:
              </span>
              {LANGUAGES.map((l) => (
                <button
                  key={l || "all"}
                  onClick={() => setLanguage(l)}
                  data-testid={`lang-${l || "all"}`}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors duration-200 ${
                    language === l
                      ? "bg-secondary/10 border-secondary/40 text-secondary"
                      : "border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
                  }`}
                >
                  {l || "All"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {activeView === "repos" && (
          loading ? (
            <div className="flex items-center justify-center py-20" data-testid="trending-loading">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="trending-grid">
              {repos.map((repo, i) => (
                <div
                  key={repo.url}
                  className={`animate-fade-in-up opacity-0 stagger-${(i % 8) + 1} cursor-pointer`}
                  onClick={(e) => {
                    if (e.target.closest('a')) return;
                    const parts = repo.name.split("/");
                    if (parts.length === 2) navigate(`/repo/${parts[0]}/${parts[1]}`);
                  }}
                >
                  <RepoCard item={repo} />
                </div>
              ))}
            </div>
          )
        )}

        {activeView === "topics" && (
          topicsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Trending Languages */}
              <div>
                <h2 className="text-lg font-bold font-[Chivo] mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  Trending Languages
                </h2>
                <div className="flex flex-wrap gap-3" data-testid="trending-languages">
                  {trendingLangs.map((l, i) => (
                    <button
                      key={l.name}
                      onClick={() => { setLanguage(l.name); setActiveView("repos"); }}
                      data-testid={`trending-lang-${l.name}`}
                      className={`group px-4 py-3 border border-border/50 hover:border-primary/40 bg-card transition-colors duration-200 animate-fade-in-up opacity-0 stagger-${(i % 8) + 1}`}
                    >
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">{l.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">{l.count} repos</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div>
                <h2 className="text-lg font-bold font-[Chivo] mb-4 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  Trending Topics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="trending-topics-grid">
                  {topics.map((topic, i) => (
                    <div
                      key={topic.name}
                      className={`bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300 animate-fade-in-up opacity-0 stagger-${(i % 8) + 1}`}
                      data-testid={`topic-card-${topic.name}`}
                    >
                      <div className="p-5 border-b border-border/30">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground">#{topic.name}</h3>
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-mono">
                            {topic.count} repos
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {topic.repos.map((r) => (
                          <button
                            key={r.name}
                            onClick={() => {
                              const parts = r.name.split("/");
                              if (parts.length === 2) navigate(`/repo/${parts[0]}/${parts[1]}`);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-accent/30 transition-colors duration-200 group"
                            data-testid={`topic-repo-${r.name}`}
                          >
                            <p className="text-xs font-mono text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                              {r.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{r.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
