import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import LineTrendChart from "../../../components/charts/LineTrendChart";
import DonutStatusChart from "../../../components/charts/DonutStatusChart";
import BarDistanceChart from "../../../components/charts/BarDistanceChart";
import apiClient from "../../../lib/apiClient";

export default function AdminAnalyticsPage() {
  const [adminData, setAdminData] = useState<any>(null);
  const [accountantData, setAccountantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.getAdminDashboard().catch(() => null),
      apiClient.getAccountantDashboard().catch(() => null),
    ]).then(([admin, accountant]) => {
      setAdminData(admin);
      setAccountantData(accountant);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading analytics...</p>;

  const approved  = accountantData?.approvedCount  ?? 0;
  const rejected  = accountantData?.rejectedCount  ?? 0;
  const pending   = accountantData?.pendingCount   ?? 0;

  const travelTrend = adminData?.travelTrendWeek ?? [];

  const distanceData = [
    { label: "Approved KM",  value: accountantData?.approvedDistanceKm  ?? 0 },
    { label: "Pending KM",   value: accountantData?.pendingDistanceKm   ?? 0 },
    { label: "Rejected KM",  value: accountantData?.rejectedDistanceKm  ?? 0 },
  ];

  return (
    <div className="stack-24">
      {/* Summary KPIs */}
      <section className="stats-grid">
        <Card title="Total Trips (All Time)">
          <p className="kpi">{adminData?.totalTrips ?? 0}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            {adminData?.todayTrips ?? 0} trips today
          </p>
        </Card>
        <Card title="Approved Bundles">
          <p className="kpi success">{approved}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            ₹{(accountantData?.totalApprovedAmountInr ?? 0).toFixed(2)} total
          </p>
        </Card>
        <Card title="Pending Bundles">
          <p className="kpi warning">{pending}</p>
        </Card>
        <Card title="Rejected Bundles">
          <p className="kpi">{rejected}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            ₹{(accountantData?.totalRejectedAmountInr ?? 0).toFixed(2)} excluded
          </p>
        </Card>
      </section>

      <div className="reports-grid">
        <Card title="Trips Over Time" subtitle="Daily km covered — last 7 days">
          {travelTrend.length === 0
            ? <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>No trip data for this week yet.</p>
            : <LineTrendChart data={travelTrend} />
          }
        </Card>

        <Card title="Bundle Approval Mix" subtitle="Approved vs rejected vs pending">
          <DonutStatusChart approved={approved} rejected={rejected} pending={pending} />
        </Card>

        <Card title="Distance by Outcome" subtitle="Total km covered per approval status">
          <BarDistanceChart data={distanceData} />
        </Card>
      </div>
    </div>
  );
}
