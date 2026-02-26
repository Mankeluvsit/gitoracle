import { Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = ({ onSettingsClick }) => {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      data-testid="app-header"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight font-[Chivo]" data-testid="app-logo">
            GitOracle
          </span>
          <span className="hidden sm:inline text-xs font-mono tracking-widest uppercase text-muted-foreground/60 ml-2">
            Intelligence Engine
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          data-testid="settings-button"
          className="hover:bg-accent"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
