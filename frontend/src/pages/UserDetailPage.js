import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Users, MapPin, Building, Link as LinkIcon, ExternalLink,
  Loader2, BookmarkPlus, ArrowLeft, Star, GitFork, Circle, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d", Ruby: "#701516",
};

const formatNum = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "";

export default function UserDetailPage() {
  const { login } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => { fetchUser(); }, [login]); // eslint-disable-line

  const fetchUser = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/user/${login}`);
      setUser(resp.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      await axios.post(`${API}/bookmarks`, {
        item_type: "user",
        item_data: { login: user.login, name: user.name, avatar_url: user.avatar_url, url: user.url, bio: user.bio },
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

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="user-detail-page">
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
              data-testid="bookmark-user-button"
            >
              {bookmarked ? <Check className="w-4 h-4 mr-1" /> : <BookmarkPlus className="w-4 h-4 mr-1" />}
              {bookmarked ? "Saved" : "Bookmark"}
            </Button>
            <a href={user.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="github-link">
                <ExternalLink className="w-4 h-4 mr-1" /> GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="flex-shrink-0">
            <img src={user.avatar_url} alt={user.login} className="w-32 h-32 border-2 border-border/50" data-testid="user-avatar" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-[Chivo]" data-testid="user-name">
              {user.name || user.login}
            </h1>
            {user.name && (
              <p className="text-sm font-mono text-muted-foreground/50 mt-0.5">@{user.login}</p>
            )}
            {user.bio && (
              <p className="text-base text-muted-foreground mt-3 leading-relaxed max-w-2xl">{user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-muted-foreground">
              {user.company && (
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {user.company}</span>
              )}
              {user.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {user.location}</span>
              )}
              {user.blog && (
                <a href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" /> {user.blog}
                </a>
              )}
              {user.twitter && (
                <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  @{user.twitter}
                </a>
              )}
            </div>
            <Badge className="mt-3 bg-accent text-muted-foreground border-0 text-[10px] font-mono uppercase tracking-wider">
              {user.user_type} since {formatDate(user.created_at)}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" data-testid="user-stats">
          {[
            { label: "Repos", value: user.public_repos, icon: "folder" },
            { label: "Gists", value: user.public_gists, icon: "code" },
            { label: "Followers", value: user.followers, icon: "users" },
            { label: "Following", value: user.following, icon: "user-plus" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border/50 p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
              <p className="text-2xl font-bold font-[Chivo] mt-1">{formatNum(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Repositories */}
        {user.repos?.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Top Repositories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="user-repos">
              {user.repos.map((repo, i) => (
                <button
                  key={repo.name}
                  onClick={() => {
                    const parts = repo.name.split("/");
                    if (parts.length === 2) navigate(`/repo/${parts[0]}/${parts[1]}`);
                  }}
                  className={`text-left bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300 p-5 group animate-fade-in-up opacity-0 stagger-${(i % 8) + 1}`}
                  data-testid={`user-repo-${repo.name}`}
                >
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground/60 mt-1.5 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs font-mono text-muted-foreground/50">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-current" style={{ color: LANG_COLORS[repo.language] || "#666" }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {formatNum(repo.stars)}</span>
                    <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {formatNum(repo.forks)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
