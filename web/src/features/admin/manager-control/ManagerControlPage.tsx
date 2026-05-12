import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import apiClient from "../../../lib/apiClient";

interface UserBasic {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  employee: UserBasic;
  manager: UserBasic;
}

export default function ManagerControlPage() {
  const [managers, setManagers] = useState<UserBasic[]>([]);
  const [employees, setEmployees] = useState<UserBasic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allUsers, allAssignments] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getAssignments(),
      ]);
      setManagers(allUsers.filter((u: UserBasic) => u.role === "MANAGER" || u.role === "ADMIN"));
      setEmployees(allUsers.filter((u: UserBasic) => u.role === "EMPLOYEE"));
      setAssignments(allAssignments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const assignedEmployeeIds = new Set(assignments.map(a => a.employee?.id));
  const assignedToManager = (managerId: string) =>
    assignments.filter(a => a.manager?.id === managerId);
  const unassigned = employees.filter(e => !assignedEmployeeIds.has(e.id));

  const handleAssign = async (employeeId: string, managerId: string) => {
    setSaving(employeeId);
    try {
      await apiClient.createAssignment(employeeId, managerId);
      await load();
    } catch { alert("Failed to assign employee."); }
    finally { setSaving(null); }
  };

  const handleUnassign = async (assignmentId: string) => {
    setSaving(assignmentId);
    try {
      await apiClient.removeAssignment(assignmentId);
      await load();
    } catch { alert("Failed to unassign employee."); }
    finally { setSaving(null); }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading assignments...</p>;

  const mgr = selectedManager ? managers.find(m => m.id === selectedManager) : null;

  return (
    <div className="stack-24">
      <Card
        title="Reporting Hierarchy"
        subtitle="Assign employees to managers. Each employee can have one active manager."
      >
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, marginTop: 12 }}>
          {/* Manager list (left panel) */}
          <div className="stack-12">
            <p style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              Managers
            </p>
            {managers.map(m => {
              const count = assignedToManager(m.id).length;
              const isSelected = selectedManager === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedManager(isSelected ? null : m.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    border: `1px solid ${isSelected ? "var(--color-primary-600)" : "var(--border-soft)"}`,
                    borderRadius: 12,
                    background: isSelected ? "color-mix(in srgb, var(--color-primary-600) 10%, var(--bg-card))" : "var(--bg-card)",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ display: "block" }}>{m.full_name}</strong>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {m.role.charAt(0) + m.role.slice(1).toLowerCase()} · {count} employee{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right panel */}
          <div className="stack-16">
            {!mgr ? (
              <div className="empty-state">
                <h4>Select a manager</h4>
                <p>Click a manager on the left to view and edit their assigned employees.</p>
              </div>
            ) : (
              <>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "1rem" }}>
                    {mgr.full_name}
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.88rem", marginLeft: 8 }}>{mgr.email}</span>
                  </p>
                </div>

                {/* Currently assigned */}
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Assigned Employees ({assignedToManager(mgr.id).length})
                  </p>
                  <div className="stack-12">
                    {assignedToManager(mgr.id).length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No employees assigned yet.</p>
                    ) : assignedToManager(mgr.id).map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-subtle)", borderRadius: 10 }}>
                        <div>
                          <strong style={{ fontSize: "0.92rem" }}>{a.employee?.full_name}</strong>
                          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{a.employee?.email}</p>
                        </div>
                        <Button
                          variant="danger"
                          onClick={() => handleUnassign(a.id)}
                        >
                          {saving === a.id ? "..." : "Unassign"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unassigned employees */}
                {unassigned.length > 0 && (
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 10 }}>
                      Unassigned Employees ({unassigned.length})
                    </p>
                    <div className="stack-12">
                      {unassigned.map(emp => (
                        <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-subtle)", borderRadius: 10, opacity: 0.85 }}>
                          <div>
                            <strong style={{ fontSize: "0.92rem" }}>{emp.full_name}</strong>
                            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{emp.email}</p>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => handleAssign(emp.id, mgr.id)}
                          >
                            {saving === emp.id ? "..." : "Assign"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
