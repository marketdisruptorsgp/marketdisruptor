export function DisruptionPathBanner() {
  return (
    <div className="rounded border px-6 py-6 space-y-3" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
      <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
        Choose Your Analysis Mode
      </h2>
      <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
        Each mode runs a different AI pipeline. Select the one that matches your input and objective.
      </p>
      <p className="text-xs text-muted-foreground/60 max-w-xl leading-relaxed">
        All connections encrypted. Analysis runs in isolated serverless functions — nothing retained by AI providers.
      </p>
    </div>
  );
}
