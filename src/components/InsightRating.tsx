import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from "lucide-react";

interface InsightRatingProps {
  sectionId: string;
  compact?: boolean;
}

export const InsightRating = ({ sectionId, compact }: InsightRatingProps) => {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeText, setChallengeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (r: "up" | "down") => {
    setRating(r);
    if (r === "down") setShowChallenge(true);
  };

  const handleSubmitChallenge = () => {
    setSubmitted(true);
    setShowChallenge(false);
    // In future, this could feed back into a re-analysis
  };

  return (
    <div className="mt-3">
      <div className={`flex items-center gap-2 ${compact ? "" : "pt-2 border-t"}`} style={{ borderColor: "hsl(var(--border))" }}>
        <span className="text-[10px] text-muted-foreground font-medium">Optional — rate to help improve results:</span>
        <button
          onClick={() => handleRate("up")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
          style={{
            background: rating === "up" ? "hsl(142 70% 45% / 0.15)" : "hsl(var(--muted))",
            color: rating === "up" ? "hsl(142 70% 30%)" : "hsl(var(--muted-foreground))",
            border: rating === "up" ? "1px solid hsl(142 70% 45% / 0.3)" : "1px solid hsl(var(--border))",
          }}
        >
          <ThumbsUp size={10} /> Agree
        </button>
        <button
          onClick={() => handleRate("down")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
          style={{
            background: rating === "down" ? "hsl(var(--destructive) / 0.12)" : "hsl(var(--muted))",
            color: rating === "down" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
            border: rating === "down" ? "1px solid hsl(var(--destructive) / 0.3)" : "1px solid hsl(var(--border))",
          }}
        >
          <ThumbsDown size={10} /> Challenge
        </button>
        {submitted && (
          <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
            ✓ Feedback noted
          </span>
        )}
      </div>

      {showChallenge && (
        <div className="mt-2 p-3 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
              <MessageSquare size={10} /> What do you disagree with?
            </span>
            <button onClick={() => setShowChallenge(false)} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>
          <textarea
            value={challengeText}
            onChange={(e) => setChallengeText(e.target.value)}
            placeholder="e.g. This assumption ignores the cost of tooling changes…"
            className="w-full rounded-lg px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: "60px" }}
          />
          <button
            onClick={handleSubmitChallenge}
            disabled={!challengeText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: challengeText.trim() ? "hsl(var(--primary))" : "hsl(var(--muted))",
              color: challengeText.trim() ? "white" : "hsl(var(--muted-foreground))",
            }}
          >
            <Send size={10} /> Submit Challenge
          </button>
        </div>
      )}
    </div>
  );
};
