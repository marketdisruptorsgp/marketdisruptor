import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Share2, Link2, Mail, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShareAnalysisProps {
  analysisId: string;
  analysisTitle?: string;
  accentColor?: string;
}

export function ShareAnalysis({ analysisId, analysisTitle, accentColor = "hsl(var(--primary))" }: ShareAnalysisProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [sending, setSending] = useState(false);

  const shareUrl = `${window.location.origin}/share?ref=${user?.id}&preview=${analysisId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("share-analysis", {
        body: {
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          shareUrl,
          analysisTitle: analysisTitle || "Analysis",
        },
      });
      if (error) throw error;
      toast.success(`Shared with ${recipientEmail}!`);
      setRecipientEmail("");
      setRecipientName("");
      setEmailMode(false);
    } catch (err) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-medium transition-colors"
        style={{
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Share2 size={12} /> Share
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-[9999] p-4 space-y-3"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Share This Analysis</p>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
              <X size={12} className="text-muted-foreground" />
            </button>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            {copied ? <Check size={14} style={{ color: "hsl(var(--score-high))" }} /> : <Link2 size={14} style={{ color: accentColor }} />}
            <span className="text-foreground">{copied ? "Copied!" : "Copy shareable link"}</span>
          </button>

          {/* Email */}
          {!emailMode ? (
            <button
              onClick={() => setEmailMode(true)}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted"
              style={{ border: "1px solid hsl(var(--border))" }}
            >
              <Mail size={14} style={{ color: accentColor }} />
              <span className="text-foreground">Email to team</span>
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient name"
                className="w-full text-xs px-3 py-2 rounded-lg"
                style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient email"
                className="w-full text-xs px-3 py-2 rounded-lg"
                style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
              <button
                onClick={handleSendEmail}
                disabled={sending || !recipientEmail.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: accentColor, color: "white" }}
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                {sending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          )}

          <p className="text-[9px] text-muted-foreground text-center">
            Your referral link is embedded — every share earns you credit.
          </p>
        </div>
      )}
    </div>
  );
}
