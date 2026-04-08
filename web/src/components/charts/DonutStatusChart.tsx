interface DonutStatusChartProps {
  approved: number;
  rejected: number;
  pending: number;
}

export default function DonutStatusChart({ approved, rejected, pending }: DonutStatusChartProps) {
  const total = approved + rejected + pending || 1;
  const approvedPct = Math.round((approved / total) * 100);
  const rejectedPct = Math.round((rejected / total) * 100);

  const style = {
    background: `conic-gradient(var(--color-success-500) 0 ${approvedPct}%, var(--color-danger-500) ${approvedPct}% ${approvedPct + rejectedPct}%, var(--color-warning-500) ${approvedPct + rejectedPct}% 100%)`,
  };

  return (
    <div className="donut-wrapper">
      <div className="donut" style={style} />
      <div className="legend-list">
        <p>
          <span className="legend swatch-success" /> Approved: {approved}
        </p>
        <p>
          <span className="legend swatch-danger" /> Rejected: {rejected}
        </p>
        <p>
          <span className="legend swatch-warning" /> Pending: {pending}
        </p>
      </div>
    </div>
  );
}
