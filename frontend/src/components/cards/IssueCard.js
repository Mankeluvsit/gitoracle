import { MessageSquare, ExternalLink, CircleDot, GitPullRequest } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export const IssueCard = ({ item }) => {
  const isPR = item.type === "pull_request";
  const Icon = isPR ? GitPullRequest : CircleDot;
  const stateColor = item.state === "open"
    ? "text-green-400"
    : item.state === "closed"
    ? "text-purple-400"
    : "text-muted-foreground";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300"
      data-testid={isPR ? "pr-card" : "issue-card"}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${stateColor}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {item.title}
              </h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors duration-200 flex-shrink-0 mt-0.5" />
            </div>

            {item.repository && (
              <p className="text-xs font-mono text-muted-foreground/50 mt-1">{item.repository}</p>
            )}

            {item.body && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-3">
                {item.body}
              </p>
            )}

            {item.labels && item.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.labels.map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-accent/10 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <Badge className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0 border-0 ${
          item.state === "open" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
        }`}>
          {item.state}
        </Badge>
        {item.author && (
          <span className="flex items-center gap-1.5">
            {item.author_avatar && (
              <img src={item.author_avatar} alt="" className="w-4 h-4 border border-border/50" />
            )}
            {item.author}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {item.comments}
        </span>
        <span className="ml-auto text-muted-foreground/40">{timeAgo(item.created_at)}</span>
      </div>
    </a>
  );
};
