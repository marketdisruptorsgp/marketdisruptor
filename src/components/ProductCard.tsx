import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { DataLabel } from "./DataLabel";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

export const ProductCard = ({ product, isSelected, onClick }: ProductCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const showImage = product.image && product.image !== "PLACEHOLDER_IMAGE" && product.image !== "" && (product as unknown as { imageSource?: string }).imageSource === "user";

  return (
    <div
      onClick={onClick}
      className="card-intelligence cursor-pointer p-0 relative overflow-hidden"
      style={{
        borderColor: isSelected ? "hsl(var(--primary))" : undefined,
        borderWidth: isSelected ? 2 : 1,
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 z-10"
          style={{ background: "hsl(var(--primary))" }}
        />
      )}

      {showImage ? (
        <div className="relative overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-56 object-contain"
            loading="lazy"
            onError={(e) => {
              const container = (e.target as HTMLImageElement).closest('.relative.overflow-hidden');
              if (container) (container as HTMLElement).style.display = 'none';
            }}
          />
          {product.pricingIntel && (
            <span
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded typo-card-meta flex items-center gap-1"
              style={{ background: "hsl(0 0% 0% / 0.7)", color: "hsl(0 0% 100% / 0.8)" }}
            >
              {product.pricingIntel.currentMarketPrice}
              <DataLabel label={(product.pricingIntel as unknown as Record<string, unknown>).currentMarketPriceDataLabel as string} />
            </span>
          )}
        </div>
      ) : (
        product.pricingIntel && (
          <div className="px-4 pt-3 flex items-center justify-end">
            <span className="typo-card-meta flex items-center gap-1">
              {product.pricingIntel.currentMarketPrice}
              <DataLabel label={(product.pricingIntel as unknown as Record<string, unknown>).currentMarketPriceDataLabel as string} />
            </span>
          </div>
        )
      )}

      <div className="p-3 sm:p-4 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="typo-card-eyebrow mb-0.5">{product.category}</p>
            <h3 className="typo-card-title leading-tight">{product.name}</h3>
          </div>
          <div className="flex gap-1 flex-wrap justify-end flex-shrink-0">
            {(product.sources || []).slice(0, 2).map((s) => (
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

        {/* Expandable detail */}
        {(product.keyInsight || product.marketSizeEstimate) && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1 typo-card-meta font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Less" : "More details"}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                {product.keyInsight && (
                  <p className="typo-card-body leading-relaxed text-foreground">{product.keyInsight}</p>
                )}
                {product.marketSizeEstimate && (
                  <p className="typo-card-body font-semibold" style={{ color: "hsl(var(--score-high))" }}>TAM: {product.marketSizeEstimate}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
