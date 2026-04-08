import Card from "../../../components/ui/Card";
import { systemMetrics } from "../../../mocks/data";

export default function SystemMonitoringPage() {
  return (
    <Card title="System Monitoring" subtitle="Live application activity and performance stats">
      <div className="metrics-grid">
        {systemMetrics.map((metric) => (
          <p key={metric.label}>
            {metric.label}
            <strong>{metric.value}</strong>
          </p>
        ))}
      </div>
    </Card>
  );
}
