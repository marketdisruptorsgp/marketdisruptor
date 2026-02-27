import React, { useState, useRef, useCallback } from "react";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Upload, ArrowRight, Zap, ChevronDown, Shield, Sparkles, Mail, Lock, Eye, Share2, Copy, Check, TrendingUp, Search, Target, Presentation, ShieldCheck, ListChecks, Lightbulb, Rocket } from "lucide-react";
import { InfoExplainer } from "@/components/InfoExplainer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";

type AnalysisMode = "custom" | "service" | "business";
type AnalysisDepth = "quick" | "deep";

/** Strip [VISUAL], [CONTEXTUAL], [ASSUMPTION] etc. tags from AI output strings */
function stripSourceTags(text: string): string {
  return text.replace(/\s*\[(VISUAL|CONTEXTUAL|ASSUMPTION|DATA GAP|MODELED|USER PROVIDED|VISUAL INFERENCE)\]\s*/gi, " ").trim();
}

/** Recursively strip source tags from all string values in an object/array */
function deepStripTags<T>(val: T): T {
  if (typeof val === "string") return stripSourceTags(val) as unknown as T;
  if (Array.isArray(val)) return val.map(deepStripTags) as unknown as T;
  if (val && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) out[k] = deepStripTags(v);
    return out as T;
  }
  return val;
}

interface PhotoAnalysisResult {
  name: string;
  category: string;
  description: string;
  revivalScore: number;
  keyInsight: string;
  confidenceLevel: string;
  userJourney?: {steps: string[];frictionPoints: {step: string;friction: string;severity: string;source: string;}[];};
  supplyChain?: Record<string, unknown>;
  operationalIntel?: Record<string, unknown>;
  customerSentiment?: {likelyLikes: string[];likelyDislikes: string[];painPoints: string[];adoptionBarriers: string[];};
  defensibility?: {patentLandscape: string;competitiveAdvantages: string[];vulnerabilities: string[];source: string;};
  marketPosition?: {segment: string;priceRange: string;competitors: string[];differentiator: string;source: string;};
  disruptionPotential?: {score: number;summary: string;topOpportunities: string[];risks: string[];};
  [key: string]: unknown;
}

const MODE_CONFIG: Record<AnalysisMode, {label: string;description: string;cssVar: string;}> = {
  custom: { label: "Product", description: "Physical or digital products", cssVar: "--mode-product" },
  service: { label: "Service", description: "Service businesses & SaaS", cssVar: "--mode-service" },
  business: { label: "Business", description: "Business model analysis", cssVar: "--mode-business" }
};

function ScoreBadge({ score }: {score: number;}) {
  const semantic = score >= 8 ? "--success" : score >= 5 ? "--warning" : "--destructive";
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold"
      style={{ background: `hsl(var(${semantic}) / 0.12)`, color: `hsl(var(${semantic}))` }}>

      {score}/10
    </span>);

}

function ConfidenceBadge({ level }: {level: string;}) {
  const semanticMap: Record<string, string> = { high: "--success", medium: "--warning", low: "--destructive" };
  const token = semanticMap[level] || semanticMap.medium;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ background: `hsl(var(${token}) / 0.08)`, color: `hsl(var(${token}))`, borderColor: `hsl(var(${token}) / 0.2)` }}>

      {level}
    </span>);

}


export default function InstantAnalysisPage() {
  const { tier } = useSubscription();
  const { user, loading: authLoading, isAnonymous, claimAccount } = useAnonymousAuth();
  const [mode, setMode] = useState<AnalysisMode>("custom");
  const [depth, setDepth] = useState<AnalysisDepth>("quick");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const modeColor = MODE_CONFIG[mode].cssVar;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    setResult(null);

    // Generate previews
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    // Auto-trigger analysis
    runAnalysis(files);
  }, [mode, depth, user]);

  const runAnalysis = async (files: File[]) => {
    if (!user) {
      toast.error("Setting up your session...");
      return;
    }

    // Gate deep dive behind authentication
    if (depth === "deep" && isAnonymous) {
      toast("Sign in required for Deep Dive", {
        description: "Create a free account to unlock full intelligence layers.",
        action: { label: "Sign In", onClick: () => setShowClaimForm(true) }
      });
      return;
    }

    setAnalyzing(true);

    try {
      // Upload images to storage
      const imageUrls: string[] = [];
      for (const file of files) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.
        from("analysis-photos").
        upload(filePath, file, { contentType: file.type });

        if (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload image");
          setAnalyzing(false);
          return;
        }

        const { data: urlData } = supabase.storage.
        from("analysis-photos").
        getPublicUrl(data.path);
        imageUrls.push(urlData.publicUrl);
      }

      // Call photo analysis edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("photo-analysis", {
        body: { imageUrls, mode, depth }
      });

      if (analysisError) {
        throw new Error(analysisError.message || "Analysis failed");
      }

      if (analysisData?.error) {
        throw new Error(analysisData.error);
      }

      setResult(deepStripTags(analysisData.analysis));
      toast.success("Analysis complete!");

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

      // Auto-save to saved_analyses
      try {
        await (supabase.from("saved_analyses") as any).insert({
          user_id: user.id,
          title: analysisData.analysis.name || "Photo Analysis",
          category: analysisData.analysis.category || "General",
          era: "All Eras / Current",
          audience: "",
          batch_size: 1,
          products: JSON.parse(JSON.stringify([analysisData.analysis])),
          product_count: 1,
          avg_revival_score: analysisData.analysis.revivalScore || 0,
          analysis_type: mode === "service" ? "service" : "product",
          analysis_depth: depth,
          is_anonymous: isAnonymous,
          analysis_data: analysisData.analysis
        });
      } catch (saveErr) {
        console.error("Auto-save failed:", saveErr);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimLoading(true);
    const { error } = await claimAccount(claimEmail, claimPassword);
    setClaimLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Account created! Check your email to confirm.");
      setShowClaimForm(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `hsl(var(${modeColor}))` }}>
            <Camera size={20} className="text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `hsl(var(${modeColor}))` }} />
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="typo-page-title text-foreground mb-2">
            Point. Shoot. Understand Everything.
          </h1>
          <p className="typo-card-body text-muted-foreground max-w-lg mx-auto mb-4">
            Take a photo and instantly decode what's really going on.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 typo-card-meta text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> Supply chain mapping</span>
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> User journey & friction</span>
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> Customer sentiment</span>
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> Patent landscape</span>
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> Market positioning</span>
            <span className="flex items-center gap-1"><Zap size={11} style={{ color: `hsl(var(${modeColor}))` }} /> Disruption potential</span>
          </div>
          <p className="typo-card-meta font-semibold" style={{ color: `hsl(var(${modeColor}))` }}>
            No signup required for Quick Analysis
          </p>
        </div>

        {/* Mode Picker */}
        <div className="flex gap-2 justify-center mb-6">
          {(Object.entries(MODE_CONFIG) as [AnalysisMode, typeof MODE_CONFIG["custom"]][]).map(([key, cfg]) =>
          <button
            key={key}
            onClick={() => {setMode(key);setResult(null);}}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
              mode === key ?
              "text-white border-transparent" :
              "bg-card text-muted-foreground border-border hover:border-foreground/20"
            )}
            style={mode === key ? { background: `hsl(var(${cfg.cssVar}))` } : undefined}>

              {cfg.label}
            </button>
          )}
        </div>

        {/* Depth Toggle */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setDepth("quick")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                depth === "quick" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
              )}>

              Quick Analysis
            </button>
            <button
              onClick={() => {
                if (isAnonymous) {
                  toast("Sign in required for Deep Dive", {
                    description: "Create a free account to unlock full intelligence layers.",
                    action: { label: "Sign In", onClick: () => setShowClaimForm(true) }
                  });
                  return;
                }
                setDepth("deep");
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                depth === "deep" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
              )}>

              {isAnonymous && <Lock size={10} />}
              Deep Dive
            </button>
          </div>
          {isAnonymous &&
          <p className="typo-card-meta text-muted-foreground">
              <Lock size={9} className="inline mr-0.5 mb-px" /> Deep Dive: full intelligence layers including pitch decks, patent maps, and disruption scoring — free to try
            </p>
          }
        </div>

        {/* Upload Area */}
        <div
          className="rounded-xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-colors hover:border-opacity-60 relative"
          style={{ borderColor: `hsl(var(${modeColor}) / 0.4)` }}
          onClick={() => fileInputRef.current?.click()}>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect} />


          {previews.length > 0 ?
          <div className="flex gap-3 justify-center flex-wrap">
              {previews.map((url, i) =>
            <img
              key={i}
              src={url}
              alt={`Upload ${i + 1}`}
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-border" />

            )}
            </div> :

          <div className="flex flex-col items-center gap-3">
              <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `hsl(var(${modeColor}) / 0.1)` }}>

                <Camera size={28} style={{ color: `hsl(var(${modeColor}))` }} />
              </div>
              <div>
                <p className="typo-card-title text-foreground mb-1">
                  Tap to upload photos
                </p>
                <p className="typo-card-body text-muted-foreground">
                  Supports multiple images · iPhone photo picker optimized
                </p>
              </div>
            </div>
          }

          {analyzing &&
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: `hsl(var(${modeColor}))` }} />
                <p className="typo-card-body text-foreground font-medium">Analyzing...</p>
                <p className="typo-card-meta text-muted-foreground">Visual intelligence engine processing</p>
              </div>
            </div>
          }
        </div>

        {!analyzing && previews.length > 0 && !result &&
        <div className="mt-4 text-center">
            <Button
            onClick={() => runAnalysis(selectedFiles)}
            className="w-full sm:w-auto gap-2"
            style={{ background: `hsl(var(${modeColor}))` }}>

              <Sparkles size={16} /> Re-analyze
            </Button>
          </div>
        }

        {/* Results */}
        {result &&
        <div ref={resultsRef} className="mt-8 space-y-6">
            {/* Header Card */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6" style={{ borderTop: `3px solid hsl(var(${modeColor}))` }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <p className="typo-card-eyebrow uppercase tracking-widest mb-1" style={{ color: `hsl(var(${modeColor}))` }}>
                    {MODE_CONFIG[mode].label} Analysis
                  </p>
                  <h2 className="typo-section-title text-foreground">{result.name}</h2>
                  <p className="typo-card-body text-muted-foreground mt-1">{result.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ScoreBadge score={result.revivalScore} />
                  {result.confidenceLevel && <ConfidenceBadge level={result.confidenceLevel} />}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="typo-card-eyebrow text-muted-foreground mb-1">Key Insight</p>
                <p className="typo-card-body text-foreground font-medium">{result.keyInsight}</p>
              </div>
            </div>

            {/* User Journey */}
            {result.userJourney &&
          <ResultSection title="User Journey" modeColor={modeColor} explainerKey="instant-user-journey">
                <div className="space-y-2">
                  {result.userJourney.steps.map((step, i) =>
              <div key={i} className="flex items-start gap-3 py-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: `hsl(var(${modeColor}))` }}>
                        {i + 1}
                      </div>
                      <p className="typo-card-body text-foreground">{step}</p>
                    </div>
              )}
                </div>
                {result.userJourney.frictionPoints.length > 0 &&
            <div className="mt-4 space-y-2">
                    <p className="typo-card-eyebrow text-muted-foreground">Friction Points</p>
                    {result.userJourney.frictionPoints.map((fp, i) =>
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `hsl(var(${fp.severity === "high" ? "--destructive" : fp.severity === "medium" ? "--warning" : "--success"}) / 0.12)`, color: `hsl(var(${fp.severity === "high" ? "--destructive" : fp.severity === "medium" ? "--warning" : "--success"}))` }}>
                          {fp.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="typo-card-body text-foreground">{fp.friction}</p>
                          <p className="typo-card-meta text-muted-foreground mt-0.5">{fp.step}</p>
                        </div>
                      </div>
              )}
                  </div>
            }
              </ResultSection>
          }

            {/* Supply Chain or Operational Intel */}
            {result.supplyChain &&
          <ResultSection title="Supply Chain & Delivery" modeColor={modeColor} explainerKey="instant-supply-chain">
                <InfoGrid data={result.supplyChain as Record<string, string>} />
              </ResultSection>
          }
            {result.operationalIntel &&
          <ResultSection title="Operational Intelligence" modeColor={modeColor} explainerKey="instant-operations">
                <InfoGrid data={result.operationalIntel as Record<string, unknown>} />
              </ResultSection>
          }

            {/* Customer Sentiment */}
            {result.customerSentiment &&
          <ResultSection title="Customer Sentiment" modeColor={modeColor} explainerKey="instant-sentiment">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SentimentList title="Likely Likes" items={result.customerSentiment.likelyLikes} type="positive" />
                  <SentimentList title="Likely Dislikes" items={result.customerSentiment.likelyDislikes} type="negative" />
                  <SentimentList title="Pain Points" items={result.customerSentiment.painPoints} type="warning" />
                  <SentimentList title="Adoption Barriers" items={result.customerSentiment.adoptionBarriers} type="neutral" />
                </div>
              </ResultSection>
          }

            {/* Defensibility */}
            {result.defensibility &&
          <ResultSection title="Patent & Defensibility" modeColor={modeColor} explainerKey="instant-defensibility">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="typo-card-eyebrow text-muted-foreground mb-1">Patent Landscape</p>
                    <p className="typo-card-body text-foreground">{result.defensibility.patentLandscape}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SentimentList title="Competitive Advantages" items={result.defensibility.competitiveAdvantages} type="positive" />
                    <SentimentList title="Vulnerabilities" items={result.defensibility.vulnerabilities} type="negative" />
                  </div>
                </div>
              </ResultSection>
          }

            {/* Market Position */}
            {result.marketPosition &&
          <ResultSection title="Market Positioning" modeColor={modeColor} explainerKey="instant-market">
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Segment" value={result.marketPosition.segment} />
                  <InfoItem label="Price Range" value={result.marketPosition.priceRange} />
                  <InfoItem label="Differentiator" value={result.marketPosition.differentiator} />
                  <InfoItem label="Competitors" value={result.marketPosition.competitors.join(", ")} />
                </div>
              </ResultSection>
          }

            {/* Disruption Potential */}
            {result.disruptionPotential &&
          <ResultSection title="Disruption Potential" modeColor={modeColor} explainerKey="instant-disruption">
                <div className="flex items-center gap-3 mb-3">
                  <ScoreBadge score={result.disruptionPotential.score} />
                  <p className="typo-card-body text-foreground">{result.disruptionPotential.summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SentimentList title="Top Opportunities" items={result.disruptionPotential.topOpportunities} type="positive" />
                  <SentimentList title="Key Risks" items={result.disruptionPotential.risks} type="negative" />
                </div>
              </ResultSection>
          }

            {/* Share CTA */}
            <ShareAnalysisCTA result={result} modeColor={modeColor} mode={mode} />

            {/* Upgrade / Claim CTA */}
            {depth === "quick" && isAnonymous ?
          <DeepDiveShowstopper modeColor={modeColor} onSignUp={() => setShowClaimForm(true)} /> :
          depth === "quick" && !isAnonymous ?
          <div className="rounded-xl border border-border bg-card p-5 text-center">
                <Button
              onClick={() => {setDepth("deep");runAnalysis(selectedFiles);}}
              className="w-full sm:w-auto gap-2"
              style={{ background: `hsl(var(${modeColor}))` }}>

                  <ArrowRight size={16} /> Upgrade to Deep Dive
                </Button>
              </div> :
          isAnonymous ?
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-3">
                <p className="typo-card-meta text-muted-foreground mb-2">Save your analysis permanently</p>
                <Button variant="outline" size="sm" onClick={() => setShowClaimForm(true)} className="gap-1">
                  <Mail size={14} /> Create Account
                </Button>
              </div> :
          null}
          </div>
        }
      </main>

      {/* Claim Account Modal */}
      {showClaimForm &&
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowClaimForm(false)}>
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="typo-section-title text-foreground">Claim Your Account</h3>
              <p className="typo-card-body text-muted-foreground mt-1">All your analyses will be preserved.</p>
            </div>
            <form onSubmit={handleClaimAccount} className="space-y-3">
              <div>
                <label className="typo-card-meta text-muted-foreground mb-1 block">Email</label>
                <input
                type="email"
                required
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="you@example.com" />

              </div>
              <div>
                <label className="typo-card-meta text-muted-foreground mb-1 block">Password</label>
                <input
                type="password"
                required
                minLength={6}
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="Min 6 characters" />

              </div>
              <Button type="submit" className="w-full" disabled={claimLoading} style={{ background: `hsl(var(${modeColor}))` }}>
                {claimLoading ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </div>
        </div>
      }

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield size={11} /> Your data is encrypted & stored securely
        </div>
      </footer>
    </div>);

}

// --- Share CTA Component ---

function ShareAnalysisCTA({ result, modeColor, mode }: {result: PhotoAnalysisResult;modeColor: string;mode: AnalysisMode;}) {
  const [copied, setCopied] = useState(false);

  const insightCount = [
  result.userJourney && "User Journey",
  result.supplyChain && "Supply Chain",
  result.operationalIntel && "Operations",
  result.customerSentiment && "Sentiment",
  result.defensibility && "Defensibility",
  result.marketPosition && "Market Position",
  result.disruptionPotential && "Disruption"].
  filter(Boolean);

  const shareText = `🔥 Just analyzed "${result.name}" with Market Disruptor — got ${insightCount.length} deep intelligence layers from a single photo!\n\nRevival Score: ${result.revivalScore}/10\nKey insight: "${result.keyInsight}"\n\nTry it free (no signup):`;
  const shareUrl = `${window.location.origin}/instant-analysis`;

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${result.name} — Market Disruptor Analysis`,
          text: shareText,
          url: shareUrl
        });
      } catch {/* user cancelled */}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `2px solid hsl(var(${modeColor}))`, background: `hsl(var(${modeColor}) / 0.06)` }}>

      <div className="p-6 sm:p-8 text-center space-y-5">
        <div className="flex items-center justify-center gap-2">
          <Share2 size={22} style={{ color: `hsl(var(${modeColor}))` }} />
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Know someone who needs this?
          </p>
        </div>
        <p className="typo-card-body text-muted-foreground max-w-md mx-auto">
          {insightCount.length} intelligence layers from one photo — user journeys, disruption paths, market positioning. Share this tool with your team, co-founder, or that friend with a business idea.
        </p>

        {/* Big primary share button */}
        <Button
          onClick={handleNativeShare}
          size="lg"
          className="text-white font-bold px-10 py-3 text-base shadow-lg hover:shadow-xl transition-all gap-2"
          style={{ background: `hsl(var(${modeColor}))` }}>

          <Share2 size={18} /> Share Instant Analysis
        </Button>

        {/* Secondary social row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              Post on X
            </Button>
          </a>
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              LinkedIn
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2">

            {copied ? <Check size={15} style={{ color: "hsl(var(--success))" }} /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <p className="typo-card-meta text-muted-foreground">
          Free for everyone · No signup required · Works on any product photo
        </p>
      </div>
    </div>);

}

// --- Helper Components ---

function ResultSection({ title, modeColor, children, explainerKey }: {title: string;modeColor: string;children: React.ReactNode;explainerKey?: string;}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <h3 className="typo-card-title text-foreground">{title}</h3>
        {explainerKey && <InfoExplainer explainerKey={explainerKey} />}
      </div>
      <div className="p-5">{children}</div>
    </div>);

}

function SentimentList({ title, items, type }: {title: string;items: string[];type: "positive" | "negative" | "warning" | "neutral";}) {
  const tokenMap: Record<string, string> = {
    positive: "--success",
    negative: "--destructive",
    warning: "--warning",
    neutral: "--muted-foreground"
  };
  const token = tokenMap[type] || tokenMap.neutral;
  return (
    <div>
      <p className="typo-card-eyebrow mb-2" style={{ color: type === "neutral" ? undefined : `hsl(var(${token}))` }}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) =>
        <li key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: `hsl(var(${token}))` }} />
            <span className="typo-card-body text-foreground">{item}</span>
          </li>
        )}
      </ul>
    </div>);

}

// --- Deep Dive Showstopper CTA ---

const DEEP_DIVE_CAPABILITIES = [
{ icon: Lightbulb, title: "Flipped Ideas", desc: "Radical creative concepts you'd never think of — assumptions turned inside-out into breakthrough opportunities" },
{ icon: TrendingUp, title: "Disruption Scoring", desc: "Quantified vulnerability and opportunity analysis with go-to-market strategy" },
{ icon: Presentation, title: "Investor-Ready Pitch Deck", desc: "12-slide deck with market sizing, unit economics, and a compelling narrative — ready to present" },
{ icon: Rocket, title: "Go-To-Market Playbook", desc: "Phased launch plan with budgets, milestones, and quick wins to capitalize immediately" },
{ icon: ShieldCheck, title: "Patent & IP Landscape", desc: "See who owns the ideas around this space and where white space exists" },
{ icon: Target, title: "Competitive Moat Analysis", desc: "Defensibility breakdown showing exactly how to build an unfair advantage" }];


function DeepDiveShowstopper({ modeColor, onSignUp }: {modeColor: string;onSignUp: () => void;}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `hsl(var(${modeColor}) / 0.3)`, background: `hsl(var(${modeColor}) / 0.03)` }}>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Headline */}
        <div className="text-center space-y-3">
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            You just scratched the surface.
          </h3>
          <p className="typo-card-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Deep Dive doesn't just analyze — it <strong className="text-foreground">invents</strong>. Get flipped ideas and creative approaches you've never considered, then a complete playbook to bring them to market and capitalize on the opportunity.
          </p>
          <p className="typo-card-meta font-semibold" style={{ color: `hsl(var(${modeColor}))` }}>
            The intelligence that takes consulting firms weeks — in seconds.
          </p>
        </div>

        {/* Capability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEEP_DIVE_CAPABILITIES.map((cap) =>
          <div
            key={cap.title}
            className="rounded-lg border border-border bg-card p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">

              <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `hsl(var(${modeColor}) / 0.1)` }}>

                <cap.icon size={18} style={{ color: `hsl(var(${modeColor}))` }} />
              </div>
              <div className="min-w-0">
                <p className="typo-card-meta font-bold text-foreground">{cap.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{cap.desc}</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Button
            onClick={onSignUp}
            size="lg"
            className="text-white font-bold px-8 py-3 text-base shadow-lg hover:shadow-xl transition-shadow"
            style={{ background: `hsl(var(${modeColor}))` }}>

            <Sparkles size={18} /> Start Free — 10 Analyses, No Credit Card
          </Button>
          <p className="typo-card-meta text-muted-foreground">
            Simple email signup. Your current analysis is preserved.
          </p>
        </div>
      </div>
    </div>);

}

function InfoGrid({ data }: {data: Record<string, unknown>;}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(data).filter(([_, v]) => v && typeof v !== "object").map(([key, value]) =>
      <InfoItem key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={String(value)} />
      )}
    </div>);

}

function InfoItem({ label, value }: {label: string;value: string;}) {
  return (
    <div className="p-2.5 rounded-lg bg-muted">
      <p className="typo-card-meta text-muted-foreground mb-0.5 capitalize">{label}</p>
      <p className="typo-card-body text-foreground">{value}</p>
    </div>);

}