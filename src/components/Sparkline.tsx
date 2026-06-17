interface Props {
  points: number[];
  up: boolean;
  width?: number;
  height?: number;
}

/** A lightweight inline SVG line+area chart of a price series. */
export function Sparkline({ points, up, width = 280, height = 64 }: Props) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  const pad = 3; // keep the stroke off the top/bottom edges

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = pad + (height - 2 * pad) * (1 - (p - min) / span);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const color = up ? "var(--green)" : "var(--red)";
  const gid = `spark-${up ? "up" : "down"}`;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
