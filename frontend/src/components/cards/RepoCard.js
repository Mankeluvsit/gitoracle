import { Star, GitFork, ExternalLink, Circle, BookmarkPlus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatNumber = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c",
};

export const RepoCard = ({ item }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.post(`${API}/bookmarks`, {
        item_type: "repository",
        item_data: { name: item.name, description: item.description, url: item.url, stars: item.stars, language: item.language },
      });
      setBookmarked(true);
      toast.success("Bookmarked!");
    } catch (err) {
      toast.error("Failed to bookmark");
    }
  };

  const handleClick = (e) => {
    if (e.target.closest('[data-action]')) return;
    const parts = item.name?.split("/");
    if (parts?.length === 2) {
      navigate(`/repo/${parts[0]}/${parts[1]}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300 cursor-pointer"
      data-testid="repo-card"
    >
      <div className="p-5 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {item.owner_avatar && (
              <img src={item.owner_avatar} alt="" className="w-8 h-8 flex-shrink-0 border border-border/50" />
            )}
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
              {item.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleBookmark}
              data-action="bookmark"
              className={`p-1 transition-colors duration-200 ${bookmarked ? "text-primary" : "text-muted-foreground/30 hover:text-primary/60"}`}
              data-testid="bookmark-button"
            >
              {bookmarked ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            </button>
            <a href={item.url} target="_blank" rel="noopener noreferrer" data-action="link" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-primary/60 transition-colors duration-200" />
            </a>
          </div>
        </div>
      </div>

      <div className="p-5">
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{item.description}</p>
        )}
        {item.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.topics.map((topic) => (
              <Badge key={topic} className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-accent/10 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        {item.language && (
          <span className="flex items-center gap-1.5">
            <Circle className="w-2.5 h-2.5 fill-current" style={{ color: LANG_COLORS[item.language] || "#666" }} />
            {item.language}
          </span>
        )}
        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {formatNumber(item.stars)}</span>
        <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {formatNumber(item.forks)}</span>
        {item.license && <span className="text-muted-foreground/50">{item.license}</span>}
        <span className="ml-auto text-muted-foreground/40">{timeAgo(item.updated_at)}</span>
      </div>
    </div>
  );
};
