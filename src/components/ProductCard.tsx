import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { RevivalScoreBadge } from "./RevivalScoreBadge";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

const FALLBACK_IMAGES: Record<string, string> = {
  "Electronic Toys": "https://images.unsplash.com/photo-1566240258998-c85da43741f2?w=600&h=400&fit=crop",
  "Instant Photography": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop",
  "Photography": "https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=600&h=400&fit=crop",
  "Gaming Hardware": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
  "Construction Toys": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&h=400&fit=crop",
  "Fashion": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  "Kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
  "Music": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
};

function getFallback(category: string) {
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES["default"];
}

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp size={10} className="text-green-600" />;
  if (trend === "down") return <TrendingDown size={10} className="text-red-500" />;
  return <Minus size={10} className="text-yellow-500" />;
}

export const ProductCard = ({ product, isSelected, onClick }: ProductCardProps) => {
  return (
    <div
      onClick={onClick}
      className="card-intelligence cursor-pointer p-0 relative overflow-hidden group"
      style={{
        borderColor: isSelected ? "hsl(var(--primary))" : undefined,
        borderWidth: isSelected ? 2 : 1,
        boxShadow: isSelected ? "var(--shadow-card-hover)" : undefined,
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl z-10"
          style={{ background: "hsl(var(--primary))" }}
        />
      )}

      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getFallback(product.category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "hsl(var(--primary))", color: "white" }}
        >
          {product.era}
        </span>
        {/* Pricing badge on image */}
        {product.pricingIntel && (
          <span
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: "hsl(0 0% 5% / 0.8)", color: "hsl(var(--primary-light))" }}
          >
            {product.pricingIntel.currentMarketPrice}
          </span>
        )}
        {/* Price direction */}
        {product.pricingIntel && (
          <span
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: "hsl(0 0% 5% / 0.8)", color: product.pricingIntel.priceDirection === "rising" ? "#4ade80" : product.pricingIntel.priceDirection === "falling" ? "#f87171" : "#fbbf24" }}
          >
            {product.pricingIntel.priceDirection === "rising" ? <TrendingUp size={9} /> : product.pricingIntel.priceDirection === "falling" ? <TrendingDown size={9} /> : <Minus size={9} />}
            {product.pricingIntel.priceDirection}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div>
          <p className="section-label text-[10px] mb-0.5">{product.category}</p>
          <h3 className="font-bold text-base leading-tight text-foreground">{product.name}</h3>
        </div>

        {/* Key Insight */}
        {product.keyInsight && (
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 italic">
            "{product.keyInsight}"
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <RevivalScoreBadge score={product.revivalScore} size="sm" />
          <div className="flex gap-1 flex-wrap justify-end">
            {product.sources.slice(0, 2).map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="source-link"
              >
                <ExternalLink size={10} />
                {s.label.split(" ")[0]}
              </a>
            ))}
          </div>
        </div>

        {/* Social signals with trend */}
        <div className="flex flex-wrap gap-1 pt-1">
          {product.socialSignals.slice(0, 2).map((sig) => (
            <span
              key={sig.platform}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
              style={{
                background: "hsl(var(--secondary))",
                color: "hsl(var(--secondary-foreground))",
              }}
            >
              <TrendIcon trend={sig.trend} />
              {sig.platform}: {sig.volume}
            </span>
          ))}
        </div>

        {/* Market size */}
        {product.marketSizeEstimate && (
          <p className="text-[10px] text-muted-foreground border-t pt-2" style={{ borderColor: "hsl(var(--border))" }}>
            📊 {product.marketSizeEstimate}
          </p>
        )}
      </div>
    </div>
  );
};
