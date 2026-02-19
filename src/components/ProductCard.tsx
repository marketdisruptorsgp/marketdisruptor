import { ExternalLink } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { RevivalScoreBadge } from "./RevivalScoreBadge";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

export const ProductCard = ({ product, isSelected, onClick }: ProductCardProps) => {
  return (
    <div
      onClick={onClick}
      className="card-intelligence cursor-pointer p-4 relative overflow-hidden group"
      style={{
        borderColor: isSelected ? "hsl(var(--primary))" : undefined,
        borderWidth: isSelected ? 2 : 1,
        boxShadow: isSelected ? "var(--shadow-card-hover)" : undefined,
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ background: "hsl(var(--primary))" }}
        />
      )}

      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
          loading="lazy"
        />
        <span className="absolute top-2 right-2 tag-pill">{product.era}</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="section-label text-[10px] mb-0.5">{product.category}</p>
          <h3 className="font-bold text-base leading-tight text-foreground">{product.name}</h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {product.description}
        </p>

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
          {product.socialSignals.map((sig) => (
            <span
              key={sig.platform}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
              style={{
                background: "hsl(var(--secondary))",
                color: "hsl(var(--secondary-foreground))",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
              {sig.platform}: {sig.volume}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
