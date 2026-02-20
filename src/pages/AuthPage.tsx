import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Sparkles, Brain, TrendingUp, Eye, ArrowRight, Loader2 } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const FEATURES = [
  { icon: Brain, label: "AI Product Intelligence", desc: "Deep-dive any discontinued product with live market data" },
  { icon: TrendingUp, label: "Revival Score Engine", desc: "Predict what's hot before the market catches on" },
  { icon: Sparkles, label: "Flip Ideas Generator", desc: "Turn old assumptions into bold new product concepts" },
  { icon: Eye, label: "First Principles Analysis", desc: "Deconstruct and redesign from the ground up" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  } as React.CSSProperties;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !firstName.trim()) {
      toast.error("Please enter your first name!");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({
            user_id: data.user.id,
            first_name: firstName.trim(),
          });
        }
        toast.success(`Welcome aboard, ${firstName}! Let's find something incredible. 🚀`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "hsl(220 20% 5% / 0.85)" }} />
        </div>
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Product Intelligence AI</span>
          </div>

          {/* Main pitch */}
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

          {/* Bottom quote */}
          <p className="text-white/40 text-xs italic">
            "The best opportunities are in the gap between what was and what could be."
          </p>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "hsl(var(--foreground))" }}>Product Intelligence AI</span>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
              {mode === "signup" ? "Create your workspace" : "Welcome back"}
            </h2>
            <p className="text-sm mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {mode === "signup"
                ? "Your personal intelligence lab awaits."
                : "Your analyses are saved and ready to pick up."}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl p-1 gap-1" style={{ background: "hsl(var(--muted))" }}>
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                style={mode === m
                  ? { background: "hsl(var(--primary))", color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {m === "signup" ? "Get Started" : "Sign In"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  First Name <span style={{ color: "hsl(var(--primary))" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="What should we call you?"
                  autoFocus
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Email
              </label>
              <input
                type="email"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus={mode === "login"}
                onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Password
              </label>
              <input
                type="password"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary))")}
                onBlur={(e) => (e.target.style.borderColor = "hsl(var(--border))")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all mt-2"
              style={{
                background: loading ? "hsl(var(--muted))" : "hsl(var(--primary))",
                color: loading ? "hsl(var(--muted-foreground))" : "white",
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> {mode === "signup" ? "Creating your workspace..." : "Signing in..."}</>
              ) : (
                <>{mode === "signup" ? "Start Discovering" : "Let's Go"} <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
            Your analyses auto-save and persist between sessions.{" "}
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-semibold underline"
              style={{ color: "hsl(var(--primary))" }}
            >
              {mode === "signup" ? "Sign in" : "Get started free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
