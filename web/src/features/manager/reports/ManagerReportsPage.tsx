import Card from "../../../components/ui/Card";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import BarDistanceChart from "../../../components/charts/BarDistanceChart";
import { activityMetrics, claims, travelTrend } from "../../../mocks/data";

export default function ManagerReportsPage() {
  const approved = claims.filter((item) => item.status === "approved").length;
  const rejected = claims.filter((item) => item.status === "rejected").length;
  const pending = claims.filter((item) => item.status === "pending").length;

  return (
    <div className="reports-grid">
      <Card title="Travel Trends" subtitle="Total km by day">
        <LineTrendChart data={travelTrend} />
      </Card>

      <Card title="Claims Distribution" subtitle="Approval outcome ratio">
        <DonutStatusChart approved={approved} rejected={rejected} pending={pending} />
      </Card>

      <Card title="Activity Metrics" subtitle="Operational activity snapshot">
        <BarDistanceChart data={activityMetrics} />
      </Card>
    </div>
  );
}
