import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, Trash2, CheckCircle, Shield, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SettingsModal = ({ open, onOpenChange }) => {
  const [token, setToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTokenStatus();
    }
  }, [open]);

  const fetchTokenStatus = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/settings/github-token`);
      setTokenStatus(resp.data);
    } catch (e) {
      setTokenStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    try {
      const resp = await axios.post(`${API}/settings/github-token`, { token });
      toast.success("GitHub token saved successfully");
      setTokenStatus({
        has_token: true,
        token_preview: token.slice(0, 4) + "..." + token.slice(-4),
        rate_limit: resp.data.rate_limit,
      });
      setToken("");
    } catch (e) {
      const detail = e.response?.data?.detail || "Failed to save token";
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/settings/github-token`);
      toast.success("Token removed");
      setTokenStatus({ has_token: false });
    } catch (e) {
      toast.error("Failed to remove token");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-[Chivo] flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Add your GitHub Personal Access Token for higher API rate limits (5,000 req/hr vs 60 unauthenticated).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : tokenStatus?.has_token ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/5 border border-secondary/20">
                <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Token Active</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5" data-testid="token-preview">
                    {tokenStatus.token_preview}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  data-testid="delete-token-button"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {tokenStatus.rate_limit && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-accent/20 border border-border/50">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">Remaining</p>
                    <p className="text-lg font-bold text-foreground mt-1" data-testid="rate-remaining">
                      {tokenStatus.rate_limit.remaining?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-accent/20 border border-border/50">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">Limit</p>
                    <p className="text-lg font-bold text-foreground mt-1" data-testid="rate-limit">
                      {tokenStatus.rate_limit.limit?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="github-token" className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">
                  GitHub Personal Access Token
                </Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="github-token"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="pl-10 bg-background border-border"
                      data-testid="github-token-input"
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !token.trim()}
                    data-testid="save-token-button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider px-6"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                Generate a token at{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  data-testid="github-tokens-link"
                >
                  github.com/settings/tokens
                </a>
                . Only public read access is needed.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
