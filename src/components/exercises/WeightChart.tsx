interface ChartPoint {
  date: string;
  value: number;
}

interface WeightChartProps {
  data: ChartPoint[];
}

const WeightChart = ({ data }: WeightChartProps) => {
  if (data.length < 2) return null;

  const W = 380;
  const H = 110;
  const pad = 22;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const values = data.map((d) => d.value);
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const range = maxV - minV || 1;

  const pts = data.map((d, i) => {
    const px = pad + (i / (data.length - 1)) * innerW;
    const py = pad + innerH - ((d.value - minV) / range) * innerH;
    return [px, py] as [number, number];
  });

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const areaPath =
    linePath +
    ` L${pts[pts.length - 1][0].toFixed(1)},${pad + innerH} L${pts[0][0].toFixed(1)},${pad + innerH} Z`;

  return (
    <div className="px-4 pb-2">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">Top set weight (kg)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        <line
          x1={0}
          y1={pad}
          x2={W}
          y2={pad}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
        <line
          x1={0}
          y1={pad + innerH}
          x2={W}
          y2={pad + innerH}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
        <text x={6} y={pad + 4} fontSize={9} fill="#9ca3af">
          {maxV}
        </text>
        <text x={6} y={pad + innerH + 4} fontSize={9} fill="#9ca3af">
          {minV}
        </text>
        <path d={areaPath} fill="#dbeafe" opacity={0.6} />
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0].toFixed(1)}
            cy={p[1].toFixed(1)}
            r={i === pts.length - 1 ? 4 : 3}
            fill="#3b82f6"
          />
        ))}
      </svg>
    </div>
  );
};

export default WeightChart;
