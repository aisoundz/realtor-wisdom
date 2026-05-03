type Dimension = { key: string; label: string; value: number; description: string };

export default function DimensionBars({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <div className="space-y-4">
      {dimensions.map((d) => {
        const pct = Math.max(0, Math.min(100, d.value));
        const color = pct >= 80 ? 'bg-teal' : pct >= 60 ? 'bg-amber' : 'bg-red';
        return (
          <div key={d.key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div>
                <div className="text-sm font-medium">{d.label}</div>
                <div className="text-xs text-midgray">{d.description}</div>
              </div>
              <div className="font-serif text-lg">{pct}</div>
            </div>
            <div className="h-2 rounded-full bg-charcoal/60 overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
