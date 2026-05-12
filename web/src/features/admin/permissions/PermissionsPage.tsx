import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import apiClient from "../../../lib/apiClient";

interface HealthData {
  status: string;
  timestamp: string;
}

const RBAC_MATRIX = [
  { permission: "View own dashboard",           employee: true,  manager: true,  accountant: false, admin: true  },
  { permission: "Start / end trips",            employee: true,  manager: false, accountant: false, admin: false },
  { permission: "Submit claim bundles",         employee: true,  manager: false, accountant: false, admin: false },
  { permission: "View assigned employees",      employee: false, manager: true,  accountant: false, admin: true  },
  { permission: "Approve / reject bundles",     employee: false, manager: true,  accountant: false, admin: false },
  { permission: "Override claim amounts",       employee: false, manager: true,  accountant: false, admin: true  },
  { permission: "Create claims for employees",  employee: false, manager: true,  accountant: false, admin: true  },
  { permission: "View financial reports",       employee: false, manager: false, accountant: true,  admin: true  },
  { permission: "Export payroll data",          employee: false, manager: false, accountant: true,  admin: true  },
  { permission: "Create / deactivate users",    employee: false, manager: false, accountant: false, admin: true  },
  { permission: "Assign employees to managers", employee: false, manager: false, accountant: false, admin: true  },
  { permission: "View admin analytics",         employee: false, manager: false, accountant: false, admin: true  },
];

function Check({ ok }: { ok: boolean }) {
  return (
    <span style={{ color: ok ? "var(--success)" : "var(--text-muted)", fontSize: "1.1rem" }}>
      {ok ? "✓" : "–"}
    </span>
  );
}

export default function PermissionsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    apiClient
      .getHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="stack-24">
      {/* System status bar */}
      <Card title="System Status" subtitle={health ? `Last checked: ${new Date(health.timestamp).toLocaleTimeString("en-IN")}` : "Checking…"}>
        <div className="metrics-grid">
          <p>
            API Status{" "}
            <strong style={{ color: health?.status === "ok" ? "var(--success)" : "var(--warning)" }}>
              {health ? (health.status === "ok" ? "Online" : health.status.toUpperCase()) : "…"}
            </strong>
          </p>
          <p>
            Server Time{" "}
            <strong>
              {health ? new Date(health.timestamp).toLocaleString("en-IN") : "—"}
            </strong>
          </p>
          <p>
            API URL{" "}
            <strong style={{ fontSize: "0.8rem" }}>
              {(import.meta as any).env?.VITE_API_URL ?? "http://localhost:4000"}
            </strong>
          </p>
        </div>
      </Card>

      {/* RBAC reference table */}
      <Card
        title="Role Permissions Reference"
        subtitle="Read-only — enforced server-side via requireRole middleware. Changes require a backend deployment."
      >
        <table className="table">
          <thead>
            <tr>
              <th>Permission</th>
              <th style={{ textAlign: "center" }}>Employee</th>
              <th style={{ textAlign: "center" }}>Manager</th>
              <th style={{ textAlign: "center" }}>Accountant</th>
              <th style={{ textAlign: "center" }}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {RBAC_MATRIX.map((row) => (
              <tr key={row.permission}>
                <td>{row.permission}</td>
                <td style={{ textAlign: "center" }}><Check ok={row.employee} /></td>
                <td style={{ textAlign: "center" }}><Check ok={row.manager} /></td>
                <td style={{ textAlign: "center" }}><Check ok={row.accountant} /></td>
                <td style={{ textAlign: "center" }}><Check ok={row.admin} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
