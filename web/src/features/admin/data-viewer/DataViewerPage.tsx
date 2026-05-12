import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Tabs from "../../../components/ui/Tabs";
import Badge from "../../../components/ui/Badge";
import apiClient from "../../../lib/apiClient";

interface UserRow {
  id: string;
  full_name?: string;
  name?: string;
  email: string;
  role: string;
  is_active?: boolean;
}

interface BundleRow {
  id: string;
  employeeName: string;
  date: string;
  amountInr: number;
  distanceKm: number;
  tripCount: number;
  status: string;
}

export default function DataViewerPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "users" || tab === "employees") {
          const data: UserRow[] = await apiClient.getAllUsers();
          setUsers(data);
        } else if (tab === "claims") {
          const dash = await apiClient.getAccountantDashboard();
          // accountant dashboard returns recentAll — bundle-level rows with employee name
          setBundles((dash as any)?.recentAll ?? []);
        }
      } catch {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [tab]);

  const displayName = (u: UserRow) => u.full_name ?? u.name ?? u.email.split("@")[0];

  const filteredUsers =
    tab === "employees"
      ? users.filter((u) => u.role === "EMPLOYEE" || u.role === "employee")
      : users;

  return (
    <Card title="Data Viewer" subtitle="Read-only view of live data from the database">
      <Tabs
        items={[
          { label: "All Users", value: "users" },
          { label: "Employees", value: "employees" },
          { label: "Claim Bundles", value: "claims" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="top-space">
        {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
        {error && <p style={{ color: "var(--error)" }}>{error}</p>}

        {/* Users / Employees table */}
        {!loading && !error && (tab === "users" || tab === "employees") && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                    No records found
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{displayName(u)}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <Badge status={u.role} />
                  </td>
                  <td>
                    <span
                      style={{
                        color: u.is_active === false ? "var(--error)" : "var(--success)",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      {u.is_active === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Claim bundles table */}
        {!loading && !error && tab === "claims" && (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Trips</th>
                <th>Distance (km)</th>
                <th>Amount (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bundles.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                    No bundles found
                  </td>
                </tr>
              )}
              {bundles.map((b) => (
                <tr key={b.id}>
                  <td>{b.employeeName}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {new Date(b.date).toLocaleDateString("en-IN")}
                  </td>
                  <td>{b.tripCount}</td>
                  <td>{Number(b.distanceKm).toFixed(2)}</td>
                  <td>₹{Number(b.amountInr).toFixed(2)}</td>
                  <td>
                    <Badge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
