import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Star, GitFork, Eye, ExternalLink, Loader2, BookmarkPlus,
  Circle, GitCommit, Users, AlertTriangle, Calendar, Shield,
  Sparkles, ArrowLeft, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c",
};

const formatNum = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

export default function RepoDetailPage() {
  const { owner, name } = useParams();
  const navigate = useNavigate();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetchRepo();
  }, [owner, name]); // eslint-disable-line

  const fetchRepo = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/repo/${owner}/${name}`);
      setRepo(resp.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to load repo");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const resp = await axios.post(`${API}/ai-insights`, { repo_full_name: `${owner}/${name}` });
      setAiInsight(resp.data.insight);
    } catch (e) {
      toast.error("Failed to generate insights");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      await axios.post(`${API}/bookmarks`, {
        item_type: "repository",
        item_data: { name: repo.name, description: repo.description, url: repo.url, stars: repo.stars, language: repo.language },
      });
      setBookmarked(true);
      toast.success("Bookmarked!");
    } catch (e) {
      toast.error("Failed to bookmark");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Repository not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const totalLangBytes = Object.values(repo.languages || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-background" data-testid="repo-detail-page">
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200" data-testid="back-button">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm" onClick={handleBookmark}
              className={bookmarked ? "text-primary" : "text-muted-foreground"}
              data-testid="bookmark-repo-button"
            >
              {bookmarked ? <Check className="w-4 h-4 mr-1" /> : <BookmarkPlus className="w-4 h-4 mr-1" />}
              {bookmarked ? "Saved" : "Bookmark"}
            </Button>
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="github-link">
                <ExternalLink className="w-4 h-4 mr-1" /> GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          {repo.owner?.avatar_url && (
            <img src={repo.owner.avatar_url} alt="" className="w-16 h-16 border-2 border-border/50" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-[Chivo] break-words" data-testid="repo-name">
              {repo.name}
            </h1>
            {repo.description && (
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">{repo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {repo.topics?.map((t) => (
                <Badge key={t} className="bg-primary/10 text-primary border-0 text-[10px] font-mono uppercase tracking-wider">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" data-testid="repo-stats">
          {[
            { icon: Star, label: "Stars", value: formatNum(repo.stars), color: "text-yellow-400" },
            { icon: GitFork, label: "Forks", value: formatNum(repo.forks), color: "text-blue-400" },
            { icon: Eye, label: "Watchers", value: formatNum(repo.subscribers_count || repo.watchers), color: "text-green-400" },
            { icon: AlertTriangle, label: "Issues", value: formatNum(repo.open_issues), color: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
              </div>
              <p className="text-2xl font-bold font-[Chivo]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Languages Bar */}
        {Object.keys(repo.languages || {}).length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3">Languages</h2>
            <div className="h-3 flex overflow-hidden" data-testid="language-bar">
              {Object.entries(repo.languages).map(([lang, bytes]) => (
                <div
                  key={lang}
                  className="h-full"
                  style={{ width: `${(bytes / totalLangBytes) * 100}%`, backgroundColor: LANG_COLORS[lang] || "#666", minWidth: "2px" }}
                  title={`${lang}: ${((bytes / totalLangBytes) * 100).toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(repo.languages).map(([lang, bytes]) => (
                <span key={lang} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Circle className="w-2 h-2 fill-current" style={{ color: LANG_COLORS[lang] || "#666" }} />
                  {lang} <span className="text-muted-foreground/40">{((bytes / totalLangBytes) * 100).toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* AI Insights */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border/50 p-6" data-testid="ai-insights-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-[Chivo] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Analysis
                </h2>
                {!aiInsight && (
                  <Button
                    size="sm" onClick={fetchInsight} disabled={insightLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider"
                    data-testid="generate-insights-button"
                  >
                    {insightLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                    Analyze
                  </Button>
                )}
              </div>
              {aiInsight ? (
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="ai-insight-content">
                  {aiInsight}
                </div>
              ) : !insightLoading ? (
                <p className="text-sm text-muted-foreground/40">Click "Analyze" for an AI-powered summary of this repository</p>
              ) : (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyzing repository...</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-4">
            <div className="bg-card border border-border/50 p-5 space-y-3 text-xs font-mono text-muted-foreground">
              {repo.license && (
                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> {repo.license}</div>
              )}
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Created {formatDate(repo.created_at)}</div>
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Updated {formatDate(repo.updated_at)}</div>
              <div className="flex items-center gap-2"><GitCommit className="w-3.5 h-3.5" /> Pushed {formatDate(repo.pushed_at)}</div>
              {repo.homepage && (
                <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block truncate">
                  {repo.homepage}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contributors */}
        {repo.contributors?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Top Contributors
            </h2>
            <div className="flex flex-wrap gap-3" data-testid="contributors-list">
              {repo.contributors.map((c) => (
                <button
                  key={c.login}
                  onClick={() => navigate(`/user/${c.login}`)}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border/50 hover:border-primary/30 transition-colors duration-200"
                  data-testid={`contributor-${c.login}`}
                >
                  <img src={c.avatar_url} alt="" className="w-6 h-6 border border-border/50" />
                  <span className="text-xs font-mono text-muted-foreground">{c.login}</span>
                  <span className="text-[10px] text-muted-foreground/40">{c.contributions} commits</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Commits */}
        {repo.recent_commits?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
              <GitCommit className="w-3.5 h-3.5" /> Recent Commits
            </h2>
            <div className="space-y-1" data-testid="recent-commits">
              {repo.recent_commits.map((c) => (
                <a
                  key={c.sha}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-card/50 border border-border/30 hover:border-primary/20 transition-colors duration-200"
                >
                  <span className="text-xs font-mono text-primary/70 font-bold flex-shrink-0">{c.sha}</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">{c.message}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/30 flex-shrink-0">{c.author}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/20 flex-shrink-0">{formatDate(c.date)}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* README */}
        {repo.readme && (
          <div className="mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-4">README</h2>
            <div className="bg-card border border-border/50 p-6" data-testid="readme-section">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                {repo.readme}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
