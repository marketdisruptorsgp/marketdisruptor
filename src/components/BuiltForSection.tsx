import { useIsMobile } from "@/hooks/use-mobile";

const LANES = [
  {
    trigger: "I have an idea",
    emoji: "💡",
    steps: ["Validate", "Stress Test"],
    outcome: "Go / No-Go",
  },
  {
    trigger: "There's got to be\na better way",
    emoji: "🔍",
    steps: ["Teardown", "Gap Analysis"],
    outcome: "Disruption Paths",
  },
  {
    trigger: "I need to pitch",
    emoji: "📊",
    steps: ["Intel", "Pitch Deck"],
    outcome: "Export & Ship",
  },
];

/* ── single vertical lane as SVG ── */
function Lane({
  trigger,
  emoji,
  steps,
  outcome,
}: (typeof LANES)[number]) {
  const w = 160;
  const nodeW = 110;
  const nodeH = 30;
  const cx = w / 2;
  const nodeX = cx - nodeW / 2;

  // vertical positions
  const triggerY = 18;
  const emojiY = 42;
  const lineStart = 56;
  const firstNodeY = 72;
  const gap = 64;
  const stepPositions = steps.map((_, i) => firstNodeY + i * gap);
  const lastNodeBottom = stepPositions[stepPositions.length - 1] + nodeH;
  const outcomeY = lastNodeBottom + 36;
  const totalH = outcomeY + 20;

  return (
    <svg
      viewBox={`0 0 ${w} ${totalH}`}
      className="w-full max-w-[180px] mx-auto"
      aria-label={`${trigger} flow`}
    >
      {/* trigger phrase */}
      <text
        x={cx}
        y={triggerY}
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 11, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}
      >
        {trigger.includes("\n") ? (
          trigger.split("\n").map((line, i) => (
            <tspan key={i} x={cx} dy={i === 0 ? 0 : 13}>
              "{line}
              {i === trigger.split("\n").length - 1 ? '"' : ""}
            </tspan>
          ))
        ) : (
          <>"{trigger}"</>
        )}
      </text>

      {/* emoji */}
      <text
        x={cx}
        y={emojiY}
        textAnchor="middle"
        style={{ fontSize: 18 }}
      >
        {emoji}
      </text>

      {/* line from emoji to first node */}
      <line
        x1={cx}
        y1={lineStart}
        x2={cx}
        y2={firstNodeY}
        className="stroke-border"
        strokeWidth={1.5}
      />

      {/* step nodes + connecting lines */}
      {stepPositions.map((y, i) => (
        <g key={i}>
          {/* node rect */}
          <rect
            x={nodeX}
            y={y}
            width={nodeW}
            height={nodeH}
            rx={6}
            className="fill-primary/10 stroke-primary/30"
            strokeWidth={1}
          />
          {/* node label */}
          <text
            x={cx}
            y={y + nodeH / 2 + 4}
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 12, fontWeight: 600, fontFamily: "Space Grotesk, sans-serif" }}
          >
            {steps[i]}
          </text>

          {/* arrow down to next node or outcome */}
          {i < stepPositions.length - 1 && (
            <>
              <line
                x1={cx}
                y1={y + nodeH}
                x2={cx}
                y2={stepPositions[i + 1]}
                className="stroke-border"
                strokeWidth={1.5}
              />
              {/* small arrowhead */}
              <polygon
                points={`${cx - 3.5},${stepPositions[i + 1] - 4} ${cx},${stepPositions[i + 1]} ${cx + 3.5},${stepPositions[i + 1] - 4}`}
                className="fill-border"
              />
            </>
          )}
        </g>
      ))}

      {/* line from last node to outcome */}
      <line
        x1={cx}
        y1={lastNodeBottom}
        x2={cx}
        y2={outcomeY - 12}
        className="stroke-border"
        strokeWidth={1.5}
      />
      <polygon
        points={`${cx - 3.5},${outcomeY - 16} ${cx},${outcomeY - 12} ${cx + 3.5},${outcomeY - 16}`}
        className="fill-border"
      />

      {/* outcome label */}
      <text
        x={cx}
        y={outcomeY}
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}
      >
        {outcome}
      </text>
    </svg>
  );
}

export function BuiltForSection() {
  const isMobile = useIsMobile();

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 text-center">
        What brings you here?
      </p>
      <div
        className={`flex ${isMobile ? "flex-col items-center gap-10" : "justify-center gap-12"}`}
      >
        {LANES.map((lane) => (
          <Lane key={lane.trigger} {...lane} />
        ))}
      </div>
    </div>
  );
}
