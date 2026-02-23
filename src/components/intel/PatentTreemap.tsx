import { ResponsiveContainer, Treemap, Tooltip as RechartsTooltip } from "recharts";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
  "hsl(330 65% 55%)", "hsl(200 75% 50%)",
];

interface PatentCategoryStat {
  category: string;
  count: number;
  topAssignees: string[];
}

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, count } = props;
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={COLORS[index % COLORS.length]}
        fillOpacity={0.85}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="white"
            fontSize={width > 120 ? 12 : 10}
            fontWeight={700}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="white"
            fontSize={11}
            fontWeight={500}
            opacity={0.85}
          >
            {count} filings
          </text>
        </>
      )}
    </g>
  );
};

export const PatentTreemap = ({ stats, onCategoryClick }: { stats: PatentCategoryStat[]; onCategoryClick: (cat: string) => void }) => {
  const data = stats.map((s) => ({ name: s.category, size: s.count, count: s.count }));

  if (data.length === 0) return null;

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6">
      <p className="text-sm font-bold text-foreground mb-4">Patent Filing Volume by Category</p>
      <div className="h-[260px] cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            nameKey="name"
            content={<CustomTreemapContent />}
            onClick={(node: any) => {
              if (node?.name) onCategoryClick(node.name);
            }}
          >
            <RechartsTooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, _: string, entry: any) => [`${value} filings`, entry?.payload?.name || "Category"]}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Click a category to filter patents below</p>
    </div>
  );
};
