import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Bookmark, Trash2, StickyNote, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const navigate = useNavigate();

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/bookmarks`);
      setBookmarks(resp.data);
    } catch (e) {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (id) => {
    try {
      await axios.delete(`${API}/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Bookmark removed");
    } catch (e) {
      toast.error("Failed to remove bookmark");
    }
  };

  const saveNote = async (id) => {
    try {
      await axios.put(`${API}/bookmarks/${id}/note`, { bookmark_id: id, note: noteText });
      setBookmarks((prev) => prev.map((b) => b.id === id ? { ...b, note: noteText } : b));
      setEditingNote(null);
      toast.success("Note saved");
    } catch (e) {
      toast.error("Failed to save note");
    }
  };

  const navigateToDetail = (bookmark) => {
    const data = bookmark.item_data;
    if (bookmark.item_type === "repository" && data.name) {
      const parts = data.name.split("/");
      if (parts.length === 2) navigate(`/repo/${parts[0]}/${parts[1]}`);
    } else if (bookmark.item_type === "user" && data.login) {
      navigate(`/user/${data.login}`);
    } else if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="bookmarks-page">
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter font-[Chivo]">
                Bookmarks
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Your saved GitHub resources with personal notes
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]" data-testid="bookmarks-count">
            {bookmarks.length} saved
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20" data-testid="bookmarks-empty">
            <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No bookmarks yet</p>
            <p className="text-muted-foreground/50 text-sm">
              Click the bookmark icon on any search result to save it here
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="bookmarks-list">
            {bookmarks.map((bookmark, i) => {
              const data = bookmark.item_data;
              const isEditing = editingNote === bookmark.id;
              return (
                <div
                  key={bookmark.id}
                  className={`bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300 animate-fade-in-up opacity-0 stagger-${(i % 8) + 1}`}
                  data-testid={`bookmark-item-${bookmark.id}`}
                >
                  <div className="p-5 flex items-start gap-4">
                    <Badge className="bg-accent text-muted-foreground border-0 text-[10px] font-mono uppercase tracking-wider mt-0.5 flex-shrink-0">
                      {bookmark.item_type}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigateToDetail(bookmark)}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors duration-200 text-left truncate block w-full"
                        data-testid={`bookmark-title-${bookmark.id}`}
                      >
                        {data.name || data.title || data.login || data.message || "Untitled"}
                      </button>
                      {data.description && (
                        <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{data.description}</p>
                      )}

                      {/* Note display/edit */}
                      {isEditing ? (
                        <div className="flex gap-2 mt-3">
                          <Input
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note..."
                            className="h-8 text-xs bg-background"
                            data-testid={`note-input-${bookmark.id}`}
                          />
                          <Button size="sm" onClick={() => saveNote(bookmark.id)} className="h-8 text-xs bg-primary text-primary-foreground" data-testid={`note-save-${bookmark.id}`}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)} className="h-8 text-xs">
                            Cancel
                          </Button>
                        </div>
                      ) : bookmark.note ? (
                        <button
                          onClick={() => { setEditingNote(bookmark.id); setNoteText(bookmark.note); }}
                          className="mt-2 flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary transition-colors duration-200"
                          data-testid={`note-display-${bookmark.id}`}
                        >
                          <StickyNote className="w-3 h-3" />
                          {bookmark.note}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground/30 mr-2">
                        {timeAgo(bookmark.created_at)}
                      </span>
                      <button
                        onClick={() => { setEditingNote(bookmark.id); setNoteText(bookmark.note || ""); }}
                        className="p-1.5 text-muted-foreground/40 hover:text-primary transition-colors duration-200"
                        data-testid={`note-edit-${bookmark.id}`}
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </button>
                      {data.url && (
                        <a
                          href={data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors duration-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors duration-200"
                        data-testid={`bookmark-delete-${bookmark.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
