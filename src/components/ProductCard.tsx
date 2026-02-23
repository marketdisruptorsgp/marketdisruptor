import { ExternalLink, TrendingUp, TrendingDown, Minus, ImageOff } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { RevivalScoreBadge } from "./RevivalScoreBadge";
import { DataLabel } from "./DataLabel";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp size={10} style={{ color: "hsl(var(--success))" }} />;
  if (trend === "down") return <TrendingDown size={10} style={{ color: "hsl(var(--destructive))" }} />;
  return <Minus size={10} style={{ color: "hsl(var(--warning))" }} />;
}

export const ProductCard = ({ product, isSelected, onClick }: ProductCardProps) => {
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

      {/* Image — only show if we have a real image */}
      {product.image && product.image !== "PLACEHOLDER_IMAGE" && product.image !== "" ? (
        <div className="relative overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-56 object-contain"
            loading="lazy"
            onError={(e) => {
              // Hide entire image container on error
              const container = (e.target as HTMLImageElement).closest('.relative.overflow-hidden');
              if (container) (container as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
          >
            {product.era}
          </span>
          {product.pricingIntel && (
            <span
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"
              style={{ background: "hsl(0 0% 0% / 0.7)", color: "hsl(0 0% 100% / 0.8)" }}
            >
              {product.pricingIntel.currentMarketPrice}
              <DataLabel label={(product.pricingIntel as unknown as Record<string, unknown>).currentMarketPriceDataLabel as string} />
            </span>
          )}
        </div>
      ) : (
        /* No image: just show era badge and pricing inline */
        <div className="px-4 pt-3 flex items-center justify-between">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            {product.era}
          </span>
          {product.pricingIntel && (
            <span className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
              {product.pricingIntel.currentMarketPrice}
              <DataLabel label={(product.pricingIntel as unknown as Record<string, unknown>).currentMarketPriceDataLabel as string} />
            </span>
          )}
        </div>
      )}

      <div className="p-4 space-y-2">
        <div>
          <p className="section-label text-[10px] mb-0.5">{product.category}</p>
          <h3 className="font-semibold text-sm leading-tight text-foreground">{product.name}</h3>
        </div>

        {product.keyInsight && (
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {product.keyInsight}
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

        {/* Social signals */}
        <div className="flex flex-wrap gap-1 pt-1">
          {product.socialSignals.slice(0, 2).map((sig) => (
            <span
              key={sig.platform}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <TrendIcon trend={sig.trend} />
              {sig.platform}: {sig.volume}
            </span>
          ))}
        </div>

        {product.marketSizeEstimate && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-t pt-2" style={{ borderColor: "hsl(var(--border))" }}>
            <span>{product.marketSizeEstimate}</span>
            <DataLabel label={(product as unknown as Record<string, unknown>).marketSizeEstimateDataLabel as string} />
          </div>
        )}
      </div>
    </div>
  );
};
