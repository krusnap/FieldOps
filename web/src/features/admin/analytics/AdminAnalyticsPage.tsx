import Card from "../../../components/ui/Card";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import BarDistanceChart from "../../../components/charts/BarDistanceChart";
import { claims, travelTrend } from "../../../mocks/data";

export default function AdminAnalyticsPage() {
  const approved = claims.filter((item) => item.status === "approved").length;
  const rejected = claims.filter((item) => item.status === "rejected").length;
  const pending = claims.filter((item) => item.status === "pending").length;

  const distance = [
    { label: "North", value: 420 },
    { label: "South", value: 296 },
    { label: "West", value: 332 },
    { label: "East", value: 288 },
  ];

  return (
    <div className="reports-grid">
      <Card title="Trips Over Time" subtitle="Aggregate travel by day">
        <LineTrendChart data={travelTrend} />
      </Card>
      <Card title="Approval vs Rejection" subtitle="Claims decision rate">
        <DonutStatusChart approved={approved} rejected={rejected} pending={pending} />
      </Card>
      <Card title="Distance Analytics" subtitle="Distance coverage by region">
        <BarDistanceChart data={distance} />
      </Card>
    </div>
  );
}
