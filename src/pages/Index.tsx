import { useState } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { sampleProducts, type Product } from "@/data/mockProducts";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import {
  Zap,
  Search,
  Filter,
  Layers,
  RotateCcw,
  Target,
  BarChart3,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STEPS = [
  { icon: Search, label: "Discover & Collect" },
  { icon: Filter, label: "Prioritize & Filter" },
  { icon: Layers, label: "Deconstruct" },
  { icon: RotateCcw, label: "Challenge Assumptions" },
  { icon: Zap, label: "Generate Flips" },
  { icon: BarChart3, label: "Output & Score" },
];

export default function Index() {
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products] = useState<Product[]>(sampleProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>("discovery");

  const handleAnalyze = (_params: { category: string; era: string; audience: string; batchSize: number }) => {
    setIsLoading(true);
    setHasAnalyzed(false);
    setTimeout(() => {
      setIsLoading(false);
      setHasAnalyzed(true);
      setSelectedProduct(sampleProducts[0]);
      setExpandedSection("discovery");
    }, 2200);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Product Intelligence AI"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "hsl(220 20% 5% / 0.72)" }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: "hsl(var(--primary-light))" }} />
            <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "hsl(var(--primary-light))" }}>
              Product Intelligence AI
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            Discover, Deconstruct &{" "}
            <span style={{ color: "hsl(var(--primary-light))" }}>Flip</span> Products
          </h1>
          <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
            Autonomous product intelligence that scans eBay, Etsy, Reddit, TikTok &amp; more — then
            challenges every assumption to generate high-value innovation opportunities.
          </p>

          {/* Process pipeline */}
          <div className="mt-10 flex flex-wrap gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: "hsl(var(--primary) / 0.2)",
                    color: "white",
                    border: "1px solid hsl(var(--primary) / 0.4)",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {i + 1}
                  </span>
                  <Icon size={13} />
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* FORM */}
        <AnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* LOADING STATE */}
        {isLoading && (
          <div className="card-intelligence p-10 flex flex-col items-center justify-center space-y-4">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full animate-bounce"
                  style={{
                    background: "hsl(var(--primary))",
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
            <p className="font-semibold text-foreground">Running Product Intelligence Analysis…</p>
            <p className="text-sm text-muted-foreground text-center">
              Scanning eBay · Etsy · Reddit · TikTok · Kickstarter · Historical archives
            </p>
          </div>
        )}

        {/* RESULTS */}
        {hasAnalyzed && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Products Scanned", value: "10", icon: Search },
                { label: "Top Candidates", value: String(products.length), icon: Filter },
                { label: "Flipped Ideas", value: String(products.reduce((acc, p) => acc + p.flippedIdeas.length, 0)), icon: Zap },
                { label: "Avg Revival Score", value: (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1) + "/10", icon: TrendingUp },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card-intelligence p-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(var(--primary-muted))" }}
                    >
                      <Icon size={18} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-foreground leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── SECTION: DISCOVERY LIST ── */}
            <SectionAccordion
              id="discovery"
              title="Product Discovery List"
              subtitle={`${products.length} prioritized candidates · Sorted by Revival Score`}
              icon={<Search size={16} style={{ color: "hsl(var(--primary))" }} />}
              expanded={expandedSection === "discovery"}
              onToggle={() => toggleSection("discovery")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProduct?.id === product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setExpandedSection("detail");
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Click a product card to view full deconstruction, assumptions map, and flipped ideas.
              </p>
            </SectionAccordion>

            {/* ── SECTION: SELECTED PRODUCT DETAIL ── */}
            {selectedProduct && (
              <SectionAccordion
                id="detail"
                title={selectedProduct.name}
                subtitle="Full deconstruction · Assumptions Map · Flipped Ideas · Confidence Scores"
                icon={<Target size={16} style={{ color: "hsl(var(--primary))" }} />}
                expanded={expandedSection === "detail"}
                onToggle={() => toggleSection("detail")}
              >
                <div className="space-y-8">
                  {/* Product overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full rounded-xl object-cover h-52"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tag-pill">{selectedProduct.category}</span>
                        <span className="tag-pill">{selectedProduct.era}</span>
                        <RevivalScoreBadge score={selectedProduct.revivalScore} size="md" />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{selectedProduct.description}</p>
                      <div
                        className="text-xs px-3 py-2 rounded-lg font-mono"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                      >
                        Specs: {selectedProduct.specs}
                      </div>

                      {/* Sources */}
                      <div>
                        <p className="section-label text-[10px] mb-2">Data Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sources.map((src) => (
                            <a
                              key={src.label}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                              style={{
                                background: "hsl(var(--secondary))",
                                border: "1px solid hsl(var(--border))",
                              }}
                            >
                              <ExternalLink size={10} />
                              {src.label}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Confidence scores */}
                      <div>
                        <p className="section-label text-[10px] mb-3">Confidence Scores</p>
                        <div className="grid grid-cols-1 gap-2">
                          <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores.adoptionLikelihood} />
                          <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores.feasibility} />
                          <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores.emotionalResonance} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews + Social Signals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                        <MessageSquare size={12} /> Reviews & Sentiment
                      </p>
                      <div className="space-y-2">
                        {selectedProduct.reviews.map((review, i) => (
                          <div
                            key={i}
                            className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                            style={{ background: "hsl(var(--muted))" }}
                          >
                            <span
                              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                review.sentiment === "positive"
                                  ? "bg-green-500"
                                  : review.sentiment === "negative"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            />
                            <span className="text-foreground/80">{review.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                        <TrendingUp size={12} /> Social Signals
                      </p>
                      <div className="space-y-2">
                        {selectedProduct.socialSignals.map((sig, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{
                              background: "hsl(var(--primary-muted))",
                              border: "1px solid hsl(var(--primary) / 0.15)",
                            }}
                          >
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>
                                {sig.platform}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                            </div>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                              }}
                            >
                              {sig.volume}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Competitors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProduct.competitors.map((c) => (
                            <span key={c} className="tag-pill">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions Map */}
                  <div>
                    <p className="section-label text-[10px] mb-3">Assumptions Map</p>
                    <AssumptionsMap product={selectedProduct} />
                  </div>

                  {/* Flipped Ideas */}
                  <div>
                    <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                      <Zap size={12} /> Flipped Product Ideas (Ranked)
                    </p>
                    <div className="space-y-4">
                      {selectedProduct.flippedIdeas.map((idea, i) => (
                        <FlippedIdeaCard key={idea.name} idea={idea} rank={i + 1} />
                      ))}
                    </div>
                  </div>
                </div>
              </SectionAccordion>
            )}
          </div>
        )}

        {/* CTA when not yet analyzed */}
        {!hasAnalyzed && !isLoading && (
          <div
            className="text-center py-16 space-y-4 rounded-2xl"
            style={{ background: "hsl(var(--secondary))", border: "2px dashed hsl(var(--border))" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "hsl(var(--primary-muted))" }}
            >
              <Zap size={28} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Ready to Discover Hidden Opportunities</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Configure your parameters above and click "Run Product Intelligence Analysis" to discover,
              deconstruct, and flip vintage &amp; discontinued products into actionable innovation ideas.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-xs text-muted-foreground">
          Product Intelligence AI · Discovers · Deconstructs · Flips · All sources linked above
        </p>
      </footer>
    </div>
  );
}

// ── Accordion section wrapper ──
function SectionAccordion({
  id,
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card-intelligence overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary-muted))" }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {expanded && <div className="px-5 pb-6 border-t" style={{ borderColor: "hsl(var(--border))" }}><div className="pt-5">{children}</div></div>}
    </div>
  );
}
