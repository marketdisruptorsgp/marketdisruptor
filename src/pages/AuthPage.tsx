import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Sparkles, Brain, TrendingUp, Eye, ArrowRight, Loader2, Mail, CheckCircle2, Lock, KeyRound } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const FEATURES = [
  { icon: Brain, label: "AI Product Intelligence", desc: "Deep-dive any discontinued product with live market data" },
  { icon: TrendingUp, label: "Revival Score Engine", desc: "Predict what's hot before the market catches on" },
  { icon: Sparkles, label: "Flip Ideas Generator", desc: "Turn old assumptions into bold new product concepts" },
  { icon: Eye, label: "First Principles Analysis", desc: "Deconstruct and redesign from the ground up" },
];

const inputStyle = {
  border: "1.5px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s",
} as React.CSSProperties;

type AuthMode = "magic" | "password";

export default function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<AuthMode>("magic");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { toast.error("Please enter your first name!"); return; }
    if (!email.trim()) { toast.error("Please enter your email address!"); return; }
    setLoading(true);
    try {
      localStorage.setItem("pending_first_name", firstName.trim());
      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: { email: email.trim(), firstName: firstName.trim(), redirectTo: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email address!"); return; }
    if (!password.trim()) { toast.error("Please enter your password!"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Invalid email or password. If you haven't set a password yet, use the magic link to sign in first, then set one from your profile.");
        } else {
          toast.error(error.message);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const HeroPanel = () => (
    <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "hsl(220 20% 5% / 0.85)" }} />
      </div>
      <div className="relative z-10 p-12 flex flex-col justify-between h-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Market Disruptor</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Uncover the next{" "}
              <span style={{ color: "hsl(var(--primary-light))" }}>big thing</span>{" "}
              hiding in plain sight.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Products that once dominated markets don't just disappear — they evolve.
              Your job is to find them first.
            </p>
          </div>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--primary) / 0.25)", border: "1px solid hsl(var(--primary) / 0.4)" }}
                >
                  <Icon size={16} style={{ color: "hsl(var(--primary-light))" }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/55 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs italic">
          "The best opportunities are in the gap between what was and what could be."
        </p>
      </div>
    </div>
  );

  if (sent) {
    return (
      <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
        <HeroPanel />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
            >
              <Mail size={28} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold mb-3" style={{ color: "hsl(var(--foreground))" }}>
                Check your inbox, {firstName}.
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                We sent a secure sign-in link to <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{email}</span>.
                Click the link in the email to access your workspace instantly — no password required.
              </p>
            </div>

            <div
              className="rounded-xl p-5 text-left space-y-3"
              style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.15)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>
                What to look for
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                The email will come from <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>Market Disruptor</span> (hello@marketdisruptor.sgpcapital.com) with the subject line <span className="font-semibold">"Your Magic Link"</span>.
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                Don't see it? Check your spam or promotions folder. The link expires in 1 hour.
              </p>
            </div>

            <div
              className="rounded-xl p-4 text-left space-y-2"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Your analyses persist across sessions</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Log back in anytime with the same email</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Set a password later for even faster logins</p>
              </div>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm underline"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220 20% 5%)" }}>
      <HeroPanel />

      {/* Right: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(165deg, hsl(220 30% 8%) 0%, hsl(220 20% 5%) 50%, hsl(217 40% 10%) 100%)" }} />
        <div className="absolute inset-0 hidden lg:block" style={{ background: "hsl(var(--background))" }} />

        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Mobile hero section */}
          <div className="lg:hidden space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white">Market Disruptor</span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
                Uncover the next{" "}
                <span style={{ color: "hsl(var(--primary-light))" }}>big thing</span>{" "}
                hiding in plain sight.
              </h1>
              <p className="text-sm text-white/60 leading-relaxed">
                Products that once dominated markets don't just disappear — they evolve. 
                Your job is to find them first.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.2)" }}
                  >
                    <Icon size={14} style={{ color: "hsl(var(--primary-light))" }} />
                  </div>
                  <p className="text-white font-semibold text-xs leading-tight">{label}</p>
                  <p className="text-white/45 text-[10px] leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider on mobile */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--primary) / 0.2)" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary) / 0.5)" }}>Get Started</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--primary) / 0.2)" }} />
          </div>

          {/* Desktop-only heading */}
          <div className="hidden lg:block">
            <h2 className="text-4xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              {mode === "magic" ? "Your next big idea starts here." : "Welcome back."}
            </h2>
            <p className="text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
              {mode === "magic"
                ? "Enter your name and email. We'll send you a magic link — your workspace auto-saves and persists every time you return."
                : "Sign in with your email and password to jump straight into your workspace."}
            </p>
          </div>

          {/* Mobile heading */}
          <div className="lg:hidden">
            <h2 className="text-xl font-extrabold text-white mb-1">
              {mode === "magic" ? "Sign in to your workspace" : "Welcome back"}
            </h2>
            <p className="text-xs text-white/50">
              {mode === "magic" ? "Magic link — no password needed." : "Sign in with your password."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1.5px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: mode === "magic" ? "hsl(var(--primary))" : "transparent",
                color: mode === "magic" ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              <Mail size={14} /> Magic Link
            </button>
            <button
              type="button"
              onClick={() => setMode("password")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: mode === "password" ? "hsl(var(--primary))" : "transparent",
                color: mode === "password" ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              <Lock size={14} /> Password
            </button>
          </div>

          {mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider lg:text-muted-foreground text-white/50">First Name</label>
                <input
                  style={inputStyle}
                  className="lg:bg-background lg:text-foreground lg:border-border"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex, Jordan, Sam…"
                  autoFocus
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider lg:text-muted-foreground text-white/50">Email Address</label>
                <input
                  style={inputStyle}
                  className="lg:bg-background lg:text-foreground lg:border-border"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !firstName.trim() || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
                style={{
                  background: loading || !firstName.trim() || !email.trim() ? "hsl(220 20% 15%)" : "hsl(var(--primary))",
                  color: loading || !firstName.trim() || !email.trim() ? "hsl(220 10% 40%)" : "white",
                  boxShadow: !loading && firstName.trim() && email.trim() ? "0 4px 16px -2px hsl(217 91% 50% / 0.4)" : "none",
                }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending magic link…</> : <>Send Magic Link <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider lg:text-muted-foreground text-white/50">Email Address</label>
                <input
                  style={inputStyle}
                  className="lg:bg-background lg:text-foreground lg:border-border"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider lg:text-muted-foreground text-white/50">Password</label>
                <input
                  style={inputStyle}
                  className="lg:bg-background lg:text-foreground lg:border-border"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
                style={{
                  background: loading || !email.trim() || !password.trim() ? "hsl(220 20% 15%)" : "hsl(var(--primary))",
                  color: loading || !email.trim() || !password.trim() ? "hsl(220 10% 40%)" : "white",
                  boxShadow: !loading && email.trim() && password.trim() ? "0 4px 16px -2px hsl(217 91% 50% / 0.4)" : "none",
                }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
              </button>
              <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                Don't have a password yet? Switch to <button type="button" onClick={() => setMode("magic")} className="underline font-semibold" style={{ color: "hsl(var(--primary))" }}>Magic Link</button> to sign in, then set one from your profile.
              </p>
            </form>
          )}

          <p className="text-xs lg:text-muted-foreground text-white/35 text-center">
            {mode === "magic"
              ? "No password needed. Click the link in your email and you're in."
              : "Forgot your password? Use a magic link to sign in and reset it from your profile."}
          </p>
        </div>
      </div>
    </div>
  );
}