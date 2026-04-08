import { useState } from "react";
import Card from "../../../components/ui/Card";
import { permissionMatrix } from "../../../mocks/data";

export default function PermissionsPage() {
  const [rows, setRows] = useState(permissionMatrix);

  const toggle = (index: number, role: "manager" | "admin" | "accountant") => {
    setRows((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [role]: !item[role] } : item))
    );
  };

  return (
    <Card title="Permissions System" subtitle="Toggle role-based access levels">
      <table className="table">
        <thead>
          <tr>
            <th>Permission</th>
            <th>Manager</th>
            <th>Admin</th>
            <th>Accountant</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={row.manager}
                    onChange={() => toggle(index, "manager")}
                  />
                  <span />
                </label>
              </td>
              <td>
                <label className="toggle">
                  <input type="checkbox" checked={row.admin} onChange={() => toggle(index, "admin")} />
                  <span />
                </label>
              </td>
              <td>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={row.accountant}
                    onChange={() => toggle(index, "accountant")}
                  />
                  <span />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
