interface Point {
  label: string;
  value: number;
}

interface LineTrendChartProps {
  data: Point[];
}

export default function LineTrendChart({ data }: LineTrendChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const width = 480;
  const height = 180;

  const points = data
    .map((item, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * width;
      const y = height - (item.value / max) * (height - 20);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" role="img" aria-label="Travel trend line chart">
        <polyline fill="none" stroke="var(--color-primary-600)" strokeWidth="3" points={points} />
      </svg>
      <div className="chart-label-row">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
