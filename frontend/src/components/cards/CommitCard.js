import { GitCommit, ExternalLink } from "lucide-react";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export const CommitCard = ({ item }) => {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300"
      data-testid="commit-card"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <GitCommit className="w-4 h-4 mt-0.5 text-secondary/60 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {item.message}
              </h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors duration-200 flex-shrink-0 mt-0.5" />
            </div>
            {item.repository && (
              <p className="text-xs font-mono text-muted-foreground/50 mt-1">{item.repository}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-accent/10 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span className="text-primary/70 font-bold">{item.sha}</span>
        {item.author && (
          <span className="flex items-center gap-1.5">
            {item.author_avatar && (
              <img src={item.author_avatar} alt="" className="w-4 h-4 border border-border/50" />
            )}
            {item.author}
          </span>
        )}
        <span className="ml-auto text-muted-foreground/40">{timeAgo(item.date)}</span>
      </div>
    </a>
  );
};
