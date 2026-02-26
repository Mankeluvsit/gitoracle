import { ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const UserCard = ({ item }) => {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300"
      data-testid="user-card"
    >
      <div className="p-6 flex items-center gap-4">
        {item.avatar_url ? (
          <img
            src={item.avatar_url}
            alt={item.login}
            className="w-14 h-14 border-2 border-border/50 group-hover:border-primary/40 transition-colors duration-200"
          />
        ) : (
          <div className="w-14 h-14 bg-accent flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">
              {item.login}
            </h3>
            <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors duration-200 flex-shrink-0" />
          </div>
          <Badge className="mt-1.5 bg-accent text-muted-foreground border-0 text-[10px] font-mono uppercase tracking-wider">
            {item.user_type}
          </Badge>
        </div>
      </div>
    </a>
  );
};
