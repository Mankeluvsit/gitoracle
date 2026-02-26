import { GitFork, CircleDot, GitPullRequest, User, FileCode, GitCommit } from "lucide-react";

const RESOURCE_TYPES = [
  { key: "repositories", label: "Repos", icon: GitFork },
  { key: "issues", label: "Issues", icon: CircleDot },
  { key: "pull_requests", label: "PRs", icon: GitPullRequest },
  { key: "users", label: "Users", icon: User },
  { key: "code", label: "Code", icon: FileCode },
  { key: "commits", label: "Commits", icon: GitCommit },
];

export const ResourceFilter = ({ selected, onChange }) => {
  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 max-w-3xl mx-auto flex-wrap" data-testid="resource-filter">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 mr-1">
        Search in:
      </span>
      {RESOURCE_TYPES.map((rt) => {
        const isActive = selected.includes(rt.key);
        return (
          <button
            key={rt.key}
            onClick={() => toggle(rt.key)}
            data-testid={`filter-${rt.key}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-colors duration-200 ${
              isActive
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
            }`}
          >
            <rt.icon className="w-3 h-3" />
            {rt.label}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          data-testid="filter-clear"
          className="text-[10px] font-mono text-muted-foreground/50 hover:text-destructive ml-1 transition-colors duration-200"
        >
          Clear
        </button>
      )}
    </div>
  );
};
