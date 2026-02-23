import { useState } from "react";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string | null;
  category: string;
  published_at: string | null;
  scraped_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Startups & Funding": "hsl(var(--primary))",
  "Product Innovation": "hsl(142 76% 36%)",
  "Regulatory & M&A": "hsl(var(--destructive))",
  "E-Commerce": "hsl(38 92% 50%)",
  "AI & Technology": "hsl(280 65% 60%)",
  "Sustainability": "hsl(190 80% 42%)",
};

export const MarketNewsSection = ({ news }: { news: NewsItem[] }) => {
  const [filter, setFilter] = useState("all");
  const categories = [...new Set(news.map((n) => n.category))];
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  if (news.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Newspaper size={16} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Market News & Signals</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
        Industry news from verified web sources — startup funding, product launches, regulatory filings, and technology trends.
      </p>
      <p className="text-[10px] text-muted-foreground mb-6">
        {news.length} articles · Refreshed daily from public sources
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? "all" : cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 12).map((item) => {
          const color = SOURCE_COLORS[item.category] || "hsl(var(--muted-foreground))";
          return (
            <div
              key={item.id}
              className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.category}</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </p>
              {item.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium">{item.source_name}</span>
                  {item.published_at && (
                    <span className="flex items-center gap-0.5">
                      <Calendar size={8} />
                      {new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length > 12 && (
        <p className="text-xs text-muted-foreground text-center mt-3">Showing 12 of {filtered.length} articles</p>
      )}
    </section>
  );
};
