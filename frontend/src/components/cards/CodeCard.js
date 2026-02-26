import { FileCode, ExternalLink, FolderOpen } from "lucide-react";

export const CodeCard = ({ item }) => {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300"
      data-testid="code-card"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <FileCode className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate font-mono">
                {item.name}
              </h3>
              <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors duration-200 flex-shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono text-muted-foreground/50">
              <FolderOpen className="w-3 h-3" />
              <span className="truncate">{item.path}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-accent/10 flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span className="truncate">{item.repository}</span>
      </div>
    </a>
  );
};
