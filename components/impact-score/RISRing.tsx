// SVG ring showing the composite RIS score (0-100).
// Pure SVG, no chart library — keeps the bundle tiny.

export default function RISRing({
  score,
  size = 200,
  stroke = 14,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;

  // Color tier based on score
  const color = clamped >= 80 ? '#1D9E75' : clamped >= 60 ? '#EF9F27' : '#E24B4A';
  const tier = clamped >= 80 ? 'Strong' : clamped >= 60 ? 'Building' : 'At risk';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#F7F6F2"
          fontSize={size * 0.25}
          fontFamily="DM Serif Display, Georgia, serif"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {clamped}
        </text>
      </svg>
      <div className="mt-3 text-center">
        <div className="text-xs uppercase tracking-wider text-midgray">Real Impact Score</div>
        <div className="text-sm" style={{ color }}>
          {tier}
        </div>
      </div>
    </div>
  );
}
