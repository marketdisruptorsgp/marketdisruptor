import { ExternalLink, TrendingUp, TrendingDown, Minus, ImageOff } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { DataLabel } from "./DataLabel";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

export const ProductCard = ({ product, isSelected, onClick }: ProductCardProps) => {
  // Only show image if user-uploaded (imageSource === "user")
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

      {/* Image — only show if user-uploaded */}
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
        /* No image: just show pricing inline */
        product.pricingIntel && (
          <div className="px-4 pt-3 flex items-center justify-end">
            <span className="typo-card-meta flex items-center gap-1">
              {product.pricingIntel.currentMarketPrice}
              <DataLabel label={(product.pricingIntel as unknown as Record<string, unknown>).currentMarketPriceDataLabel as string} />
            </span>
          </div>
        )
      )}

      <div className="p-3 sm:p-4 space-y-2">
        <div>
          <p className="typo-card-eyebrow mb-0.5">{product.category}</p>
          <h3 className="typo-card-title leading-tight">{product.name}</h3>
        </div>

        {product.keyInsight && (
          <p className="typo-card-body leading-relaxed text-muted-foreground line-clamp-2">
            {product.keyInsight}
          </p>
        )}

        <div className="flex items-center justify-end pt-1">
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

        {product.marketSizeEstimate && (
          <div className="flex items-center gap-1.5 typo-card-meta border-t pt-2" style={{ borderColor: "hsl(var(--border))" }}>
            <span>{product.marketSizeEstimate}</span>
          </div>
        )}
      </div>
    </div>
  );
};
