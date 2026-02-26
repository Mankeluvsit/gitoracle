import { NavLink, useLocation } from "react-router-dom";
import { Zap, Search, TrendingUp, Bookmark, GitCompare, Settings } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/SettingsModal";

const navItems = [
  { to: "/", icon: Search, label: "Search" },
  { to: "/trending", icon: TrendingUp, label: "Trending" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { to: "/compare", icon: GitCompare, label: "Compare" },
];

export const NavBar = () => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
        data-testid="nav-bar"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
              <div className="w-7 h-7 bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-base tracking-tight font-[Chivo] group-hover:text-primary transition-colors duration-200">
                GitOracle
              </span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors duration-200 ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            data-testid="settings-button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-200"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center border-t border-border/30">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${
                  isActive
                    ? "text-primary bg-primary/5 border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};
