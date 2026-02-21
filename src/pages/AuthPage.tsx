import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Sparkles, Brain, TrendingUp, Eye, ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react";
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

export default function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("Please enter your first name!");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address!");
      return;
    }
    setLoading(true);
    try {
      // Store first name in localStorage so we can save it to profile after magic link auth
      localStorage.setItem("pending_first_name", firstName.trim());

      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: {
          email: email.trim(),
          firstName: firstName.trim(),
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
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
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>No password to remember — ever</p>
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
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      <HeroPanel />

      {/* Right: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "hsl(var(--foreground))" }}>Market Disruptor</span>
          </div>

          <div>
          <h2 className="text-4xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Your next big idea starts here.
            </h2>
            <p className="text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
              Enter your name and email. We'll send you a magic link — your workspace auto-saves and persists every time you return.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                First Name
              </label>
              <input
                style={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex, Jordan, Sam…"
                autoFocus
                onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                Email Address
              </label>
              <input
                style={inputStyle}
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
                background: loading || !firstName.trim() || !email.trim() ? "hsl(var(--muted))" : "hsl(var(--primary))",
                color: loading || !firstName.trim() || !email.trim() ? "hsl(var(--muted-foreground))" : "white",
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Sending magic link…</>
              ) : (
                <>Send Magic Link <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            No password needed. Click the link in your email and you're in — every time.
          </p>
        </div>
      </div>
    </div>
  );
}
