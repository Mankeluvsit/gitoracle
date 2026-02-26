import { ExternalLink, User, BookmarkPlus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const UserCard = ({ item }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const navigate = useNavigate();

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.post(`${API}/bookmarks`, {
        item_type: "user",
        item_data: { login: item.login, avatar_url: item.avatar_url, url: item.url, user_type: item.user_type },
      });
      setBookmarked(true);
      toast.success("Bookmarked!");
    } catch (err) {
      toast.error("Failed to bookmark");
    }
  };

  return (
    <div
      onClick={() => navigate(`/user/${item.login}`)}
      className="group block bg-card border border-border/50 hover:border-primary/40 transition-colors duration-300 cursor-pointer"
      data-testid="user-card"
    >
      <div className="p-6 flex items-center gap-4">
        {item.avatar_url ? (
          <img src={item.avatar_url} alt={item.login} className="w-14 h-14 border-2 border-border/50 group-hover:border-primary/40 transition-colors duration-200" />
        ) : (
          <div className="w-14 h-14 bg-accent flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">{item.login}</h3>
            <div className="flex items-center gap-1">
              <button onClick={handleBookmark} className={`p-1 transition-colors duration-200 ${bookmarked ? "text-primary" : "text-muted-foreground/30 hover:text-primary/60"}`} data-testid="bookmark-button">
                {bookmarked ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              </button>
              <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-primary/60 transition-colors duration-200" />
              </a>
            </div>
          </div>
          <Badge className="mt-1.5 bg-accent text-muted-foreground border-0 text-[10px] font-mono uppercase tracking-wider">{item.user_type}</Badge>
        </div>
      </div>
    </div>
  );
};
