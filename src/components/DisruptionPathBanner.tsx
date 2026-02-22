export function DisruptionPathBanner() {
  return (
    <div className="rounded-2xl border border-primary/20 px-6 py-8 text-center space-y-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary-muted)) 0%, hsl(var(--secondary)) 100%)" }}>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display tracking-tight">
        Choose Your Disruption Path
      </h2>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Each mode runs a different AI pipeline. Pick the one that matches what you have and what you want to learn.
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
        Powered by deep web crawling, vision AI, and multi-model strategic analysis that challenges every assumption and helps you uncover new routes to market.
      </p>
      <div className="flex items-start justify-center gap-2.5 pt-2 max-w-2xl mx-auto text-left">
        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "hsl(var(--success) / 0.15)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="hsl(var(--success))" className="w-3 h-3"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Privacy by design:</span> All connections use TLS encryption in transit. Analysis runs in isolated serverless functions that process your data and discard it after responding — nothing is logged or retained by AI providers. When you choose to save an analysis, it's encrypted at rest and scoped exclusively to your account via row-level security policies. We never sell, share, or train on your data.
        </p>
      </div>
    </div>
  );
}