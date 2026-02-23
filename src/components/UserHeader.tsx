import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, Sparkles, CreditCard, Crown, ArrowRight, KeyRound, Loader2, X, Check, Share2, Copy, Gift, Mail, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UserHeader() {
  const { user, profile, signOut } = useAuth();
  const { tier, subscribed, openPortal, remainingAnalyses } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [referralStats, setReferralStats] = useState({ count: 0 });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!profile || !user) return null;

  const initials = profile.first_name.slice(0, 2).toUpperCase();
  const tierConfig = TIERS[tier];

  const handleOpenShare = async () => {
    setOpen(false);
    // Get or create referral code
    const { data: existing } = await (supabase.from("referral_codes") as any)
      .select("code")
      .eq("user_id", user.id)
      .maybeSingle();

    let code = existing?.code;
    if (!code) {
      code = user.id.slice(0, 8);
      await (supabase.from("referral_codes") as any).insert({ user_id: user.id, code });
    }

    // Get referral count
    const { data: refs } = await (supabase.from("referrals") as any)
      .select("id")
      .eq("referrer_id", user.id);

    setReferralStats({ count: refs?.length || 0 });
    setShareUrl(`${window.location.origin}/share?ref=${code}`);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Referral link copied!");
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const { error } = await supabase.functions.invoke("send-referral-email", {
        body: { recipientEmail, recipientName, shareUrl },
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success("Invitation sent!");
      setRecipientEmail("");
      setRecipientName("");
    } catch {
      toast.error("Failed to send email. Try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleManage = async () => {
    setLoadingPortal(true);
    await openPortal();
    setLoadingPortal(false);
    setOpen(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password set! You can now sign in with your email and password.");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--muted))",
    color: "hsl(var(--foreground))",
    borderRadius: "var(--radius)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  return (
    <>
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded transition-colors"
          style={{
            background: open ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.12)",
            border: open ? "1.5px solid hsl(var(--primary))" : "1.5px solid hsl(var(--primary) / 0.4)",
          }}
        >
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
            style={{ background: open ? "hsl(var(--primary-foreground) / 0.2)" : "hsl(var(--primary))" }}
          >
            {initials}
          </div>
          <span className="text-sm font-bold" style={{ color: open ? "white" : "hsl(var(--primary))" }}>
            {profile.first_name}
          </span>
          <ChevronDown size={14} style={{ color: open ? "white" : "hsl(var(--primary))", transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "14rem",
              borderRadius: "var(--radius)",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.35)",
              overflow: "hidden",
              zIndex: 99999,
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Your Workspace</p>
              </div>
              <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{profile.first_name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Crown size={10} style={{ color: tierConfig.color }} />
                <p className="text-[10px] font-semibold" style={{ color: tierConfig.color }}>
                  {tierConfig.name} Plan
                  {remainingAnalyses() !== null && ` · ${remainingAnalyses()} left`}
                </p>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => { setOpen(false); navigate("/pricing"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <CreditCard size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                {subscribed ? "View Plans" : "View Upgrade Options"}
              </button>

              {subscribed && (
                <button
                  onClick={handleManage}
                  disabled={loadingPortal}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                  Manage Subscription
                </button>
              )}

              <button
                onClick={handleOpenShare}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                style={{ color: "hsl(142 71% 45%)" }}
              >
                <Gift size={14} style={{ color: "hsl(142 71% 45%)" }} />
                Share & Earn Analyses
              </button>

              <button
                onClick={() => { setOpen(false); setShowPasswordModal(true); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <KeyRound size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                Set / Change Password
              </button>

              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <LogOut size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Set Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 100000, background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded p-6 space-y-5"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 20px 60px -15px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} style={{ color: "hsl(var(--primary))" }} />
                <h3 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>Set Password</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded hover:bg-muted transition-colors">
                <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            </div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Set a password so you can sign in faster next time — no magic link needed.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>New Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Confirm Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-colors"
                style={{
                  background: savingPassword || !newPassword || !confirmPassword ? "hsl(var(--muted))" : "hsl(var(--primary))",
                  color: savingPassword || !newPassword || !confirmPassword ? "hsl(var(--muted-foreground))" : "white",
                }}
              >
                {savingPassword ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Password</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 100000, background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
        >
          <div
            className="w-full max-w-md rounded p-6 space-y-5"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", boxShadow: "0 20px 60px -15px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={18} style={{ color: "hsl(142 71% 45%)" }} />
                <h3 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>Share & Earn</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-1 rounded hover:bg-muted transition-colors">
                <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            </div>

            <div className="rounded p-4 space-y-2" style={{ background: "hsl(142 71% 45% / 0.08)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
              <p className="text-sm font-bold" style={{ color: "hsl(142 71% 45%)" }}>
                You both get +5 bonus analyses!
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                When someone signs up through your link, you <strong>and</strong> they each receive 5 extra analyses. Share as many times as you like.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Your Referral Link</label>
              <div
                className="rounded p-3 text-sm font-mono break-all"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              >
                {shareUrl}
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-colors"
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                <Copy size={14} /> Copy Link
              </button>
            </div>

            {/* Send via Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: "hsl(var(--primary))" }} />
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Or Send via Email</label>
              </div>
              <form onSubmit={handleSendEmail} className="space-y-2">
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Their name (optional)"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="Their email address"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); setEmailSent(false); }}
                  required
                />
                <button
                  type="submit"
                  disabled={sendingEmail || !recipientEmail}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-colors"
                  style={{
                    background: emailSent ? "hsl(142 71% 45%)" : sendingEmail || !recipientEmail ? "hsl(var(--muted))" : "hsl(var(--primary))",
                    color: sendingEmail || !recipientEmail ? "hsl(var(--muted-foreground))" : "white",
                  }}
                >
                  {sendingEmail ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : emailSent ? <><Check size={14} /> Sent</> : <><Send size={14} /> Send Invitation</>}
                </button>
              </form>
              <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                We'll send them a professionally designed email explaining the platform with your referral link included.
              </p>
            </div>

            {referralStats.count > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <Share2 size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {referralStats.count} {referralStats.count === 1 ? "person has" : "people have"} signed up through your link
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}