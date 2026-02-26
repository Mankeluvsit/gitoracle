import { Clock, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const SearchHistory = ({ history, onHistoryClick, onClearHistory }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto mt-12" data-testid="search-history">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            Recent Searches
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-xs text-muted-foreground/40 hover:text-destructive h-auto py-1 px-2"
          data-testid="clear-history-button"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
      <div className="space-y-1">
        {history.slice(0, 8).map((item) => (
          <button
            key={item.id}
            onClick={() => onHistoryClick(item.query)}
            className="w-full text-left px-4 py-3 bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card transition-colors duration-200 flex items-center gap-3 group"
            data-testid={`history-item-${item.id}`}
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors duration-200 flex-shrink-0" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200 truncate flex-1">
              {item.query}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/30 flex-shrink-0">
              {timeAgo(item.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
