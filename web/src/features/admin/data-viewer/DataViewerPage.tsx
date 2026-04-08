import { useState } from "react";
import Card from "../../../components/ui/Card";
import Tabs from "../../../components/ui/Tabs";
import { claims, employees, users } from "../../../mocks/data";

export default function DataViewerPage() {
  const [tab, setTab] = useState("users");

  return (
    <Card title="Data Viewer" subtitle="Read-only view for users, trips, and claims">
      <Tabs
        items={[
          { label: "Users", value: "users" },
          { label: "Employees", value: "employees" },
          { label: "Claims", value: "claims" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="top-space">
        {tab === "users" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "employees" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.status}</td>
                  <td>{employee.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "claims" && (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td>{claim.employeeName}</td>
                  <td>{claim.date}</td>
                  <td>${claim.amount.toFixed(2)}</td>
                  <td>{claim.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
