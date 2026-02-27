import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, ArrowRight, Loader2, Mail, CheckCircle2, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { buildPublicUrl } from "@/lib/publicUrl";

const QUOTES = [
  "The best opportunities are in the gap between what was and what could be.",
  "Every dead product is a blueprint someone forgot to read.",
  "The next billion-dollar idea is hiding in a discontinued aisle.",
  "Markets don't disappear — they wait for someone bold enough to reinvent them.",
  "What the crowd abandoned, the contrarian capitalizes on.",
];

type AuthMode = "magic" | "password";
type PasswordMode = "login" | "signup";

export default function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<AuthMode>("magic");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("login");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("saved_login_email"));
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_login_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setMode("password");
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, []);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { toast.error("Please enter your first name!"); return; }
    if (!email.trim()) { toast.error("Please enter your email address!"); return; }
    setLoading(true);
    try {
      localStorage.setItem("pending_first_name", firstName.trim());
      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: { email: email.trim(), firstName: firstName.trim(), redirectTo: buildPublicUrl("/") },
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
    if (passwordMode === "signup" && !firstName.trim()) { toast.error("Please enter your first name!"); return; }
    if (passwordMode === "signup" && password.trim().length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (passwordMode === "signup") {
        localStorage.setItem("pending_first_name", firstName.trim());
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { first_name: firstName.trim() },
            emailRedirectTo: buildPublicUrl("/"),
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setPasswordMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Invalid email or password. If you signed up with a magic link, set a password from your profile first.");
          } else {
            toast.error(error.message);
          }
        } else {
          if (rememberMe) {
            localStorage.setItem("saved_login_email", email.trim());
          } else {
            localStorage.removeItem("saved_login_email");
          }
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const HeroPanel = () => (
    <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-card border-r border-border">
      <div className="relative z-10 p-12 flex flex-col justify-between h-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
            <Zap size={18} />
          </div>
          <span className="font-bold text-lg text-foreground">Market Disruptor</span>
        </div>

        <div className="flex items-center justify-center px-12 -mt-24">
          <h1 className="text-3xl font-bold text-foreground leading-snug text-center max-w-md">
            "{quote}"
          </h1>
        </div>

        <div />
      </div>
    </div>
  );

  if (sent) {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        <HeroPanel />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto bg-muted border border-border text-primary">
              <Mail size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3 text-foreground">
                Check your inbox, {firstName}.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                We sent a secure sign-in link to <span className="font-semibold text-foreground">{email}</span>.
                Click the link in the email to access your workspace instantly — no password required.
              </p>
            </div>

            <div className="rounded-lg p-6 text-left space-y-3 bg-muted/50 border border-border">
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-primary">
                What to look for
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                The email will come from <span className="font-semibold text-primary">Market Disruptor</span> with the subject line <span className="font-semibold">"Your Magic Link"</span>.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Don't see it? Check your spam or promotions folder. The link expires in 1 hour.
              </p>
            </div>

            <div className="rounded-lg p-5 text-left space-y-2.5 bg-card border border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Your analyses persist across sessions</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Log back in anytime with the same email</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Set a password later for even faster logins</p>
              </div>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm underline text-muted-foreground hover:text-foreground"
            >
              Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <HeroPanel />

      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md space-y-6 sm:space-y-8">
          {/* Mobile hero section */}
          <div className="lg:hidden space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
                <Zap size={18} />
              </div>
              <span className="font-bold text-lg text-foreground">Market Disruptor</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
                Uncover the next <span className="text-primary">big thing</span> hiding in plain sight.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Products that once dominated markets don't just disappear — they evolve.
                Your job is to find them first.
              </p>
            </div>
          </div>

          {/* Desktop-only heading */}
          <div className="hidden lg:block">
             <h2 className="text-3xl font-bold mb-2 text-foreground">
               {mode === "magic" ? "Your next big idea starts here." : passwordMode === "signup" ? "Create your account." : "Welcome back."}
             </h2>
             <p className="text-base text-muted-foreground">
               {mode === "magic"
                 ? "Enter your name and email. We'll send you a magic link — your workspace auto-saves and persists every time you return."
                 : passwordMode === "signup"
                 ? "Set up your account with a password for instant access every time."
                 : "Sign in with your email and password to jump straight into your workspace."}
            </p>
          </div>

          {/* Mobile heading */}
          <div className="lg:hidden">
             <h2 className="text-xl font-bold text-foreground mb-1">
               {mode === "magic" ? "Sign in to your workspace" : passwordMode === "signup" ? "Create an account" : "Welcome back"}
             </h2>
             <p className="text-sm text-muted-foreground">
               {mode === "magic" ? "Magic link — no password needed." : passwordMode === "signup" ? "Sign up with email and password." : "Sign in with your password."}
             </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border bg-muted/30">
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${mode === "magic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <Mail size={13} /> Magic Link
            </button>
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${mode === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <Lock size={13} /> Password
            </button>
          </div>

          {mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                <input
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex, Jordan, Sam…"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !firstName.trim() || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-colors shadow-md bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending magic link…</> : <>Send Magic Link <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {passwordMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Alex, Jordan, Sam…"
                    autoFocus
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus={passwordMode === "login"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {passwordMode === "signup" ? "Create Password" : "Password"}
                </label>
                <input
                   ref={passwordRef}
                   className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder={passwordMode === "signup" ? "Min. 6 characters" : "Your password"}
                 />
              </div>
              {passwordMode === "login" && (
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Remember my email
                  </label>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || (passwordMode === "signup" && !firstName.trim())}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-colors shadow-md bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {passwordMode === "signup" ? "Creating account…" : "Signing in…"}</>
                  : <>{passwordMode === "signup" ? "Create Account" : "Sign In"} <ArrowRight size={16} /></>}
              </button>
              <p className="text-sm text-center text-muted-foreground">
                {passwordMode === "login" ? (
                  <>Don't have an account? <button type="button" onClick={() => setPasswordMode("signup")} className="text-primary font-semibold hover:underline">Sign up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => setPasswordMode("login")} className="text-primary font-semibold hover:underline">Sign in</button></>
                )}
              </p>
            </form>
          )}

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            Protected by reCAPTCHA.
          </p>
        </div>
      </div>
    </div>
  );
}
