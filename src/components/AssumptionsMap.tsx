import type { Product } from "@/data/mockProducts";
import { ArrowRight } from "lucide-react";

interface AssumptionsMapProps {
  product: Product;
}

export const AssumptionsMap = ({ product }: AssumptionsMapProps) => {
  return (
    <div className="space-y-3">
      {product.assumptionsMap.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 items-stretch"
        >
          {/* Assumption */}
          <div
            className="flex-1 p-3 rounded-lg text-sm"
            style={{
              background: "hsl(var(--muted))",
              borderLeft: "3px solid hsl(var(--muted-foreground) / 0.4)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Assumption
            </p>
            <p className="text-foreground/80 text-xs leading-relaxed">{item.assumption}</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Challenge */}
          <div
            className="flex-1 p-3 rounded-lg text-sm"
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>
              Challenge
            </p>
            <p className="text-xs leading-relaxed text-foreground/80">
              {item.challenge}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
