import { useState } from "react";
import { Newspaper, ExternalLink, Calendar, ArrowUpRight, TrendingUp } from "lucide-react";

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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Startups & Funding": { bg: "bg-primary/8", text: "text-primary", border: "border-primary/20" },
  "Product Innovation": { bg: "bg-emerald-500/8", text: "text-emerald-600", border: "border-emerald-500/20" },
  "Regulatory & M&A": { bg: "bg-destructive/8", text: "text-destructive", border: "border-destructive/20" },
  "E-Commerce": { bg: "bg-amber-500/8", text: "text-amber-600", border: "border-amber-500/20" },
  "AI & Technology": { bg: "bg-violet-500/8", text: "text-violet-600", border: "border-violet-500/20" },
  "Sustainability": { bg: "bg-teal-500/8", text: "text-teal-600", border: "border-teal-500/20" },
};

const DEFAULT_STYLE = { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };

export const MarketNewsSection = ({ news }: { news: NewsItem[] }) => {
  const [filter, setFilter] = useState("all");
  const categories = [...new Set(news.map((n) => n.category))];
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  if (news.length === 0) return null;

  // Featured article = first item
  const featured = filtered[0];
  const rest = filtered.slice(1, 13);

  const getStyle = (cat: string) => CATEGORY_STYLES[cat] || DEFAULT_STYLE;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Newspaper size={14} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Market News & Signals</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
        Industry news from verified web sources — startup funding, product launches, regulatory filings, and technology trends.
      </p>
      <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
        <TrendingUp size={10} /> {news.length} articles · Refreshed daily from public sources
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          }`}
        >
          All ({news.length})
        </button>
        {categories.map((cat) => {
          const style = getStyle(cat);
          const count = news.filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? "all" : cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : `${style.border} ${style.bg} ${style.text} hover:opacity-80`
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Featured article */}
      {featured && (
        <a
          href={featured.source_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 rounded-xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStyle(featured.category).bg} ${getStyle(featured.category).text}`}>
              {featured.category}
            </span>
            {featured.published_at && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar size={9} />
                {new Date(featured.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
            {featured.title}
          </h3>
          {featured.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{featured.summary}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{featured.source_name}</span>
            <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline">
              Read <ArrowUpRight size={12} />
            </span>
          </div>
        </a>
      )}

      {/* Rest of articles */}
      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item) => {
            const style = getStyle(item.category);
            return (
              <a
                key={item.id}
                href={item.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {item.title}
                </p>
                {item.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-medium">{item.source_name}</span>
                    {item.published_at && (
                      <span className="flex items-center gap-0.5">
                        <Calendar size={8} />
                        {new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <ExternalLink size={11} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {filtered.length > 13 && (
        <p className="text-xs text-muted-foreground text-center mt-4">Showing 13 of {filtered.length} articles</p>
      )}
    </section>
  );
};
