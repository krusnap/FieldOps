import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import apiClient from "../../../lib/apiClient";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNTANT";
  rate_per_km: number;
  is_active: boolean;
  created_at: string;
}

type RoleFilter = "ALL" | "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNTANT";

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Employees", value: "EMPLOYEE" },
  { label: "Managers", value: "MANAGER" },
  { label: "Accountants", value: "ACCOUNTANT" },
  { label: "Admins", value: "ADMIN" },
];

const ROLE_BADGE: Record<string, string> = {
  EMPLOYEE: "badge-approved",
  MANAGER: "badge-pending",
  ADMIN: "badge-rejected",
  ACCOUNTANT: "badge-offline",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as UserRow["role"],
    rate_per_km: "10",
    is_active: true,
  });

  const load = () => {
    setLoading(true);
    apiClient.getAllUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = roleFilter === "ALL" ? users : users.filter(u => u.role === roleFilter);

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: "", email: "", password: "", role: "EMPLOYEE", rate_per_km: "10", is_active: true });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      rate_per_km: String(user.rate_per_km ?? 10),
      is_active: user.is_active,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await apiClient.updateUser(editing.id, {
          full_name: form.full_name,
          role: form.role,
          rate_per_km: Number(form.rate_per_km),
          is_active: form.is_active,
        });
      } else {
        await apiClient.createUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          rate_per_km: Number(form.rate_per_km),
        });
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user: UserRow) => {
    if (!confirm(`Deactivate ${user.full_name}? They will lose access to the app.`)) return;
    try {
      await apiClient.deactivateUser(user.id);
      load();
    } catch { alert("Failed to deactivate user."); }
  };

  const handleReactivate = async (user: UserRow) => {
    try {
      await apiClient.updateUser(user.id, { is_active: true });
      load();
    } catch { alert("Failed to reactivate user."); }
  };

  return (
    <div className="stack-24">
      <Card
        title="User Management"
        subtitle="Create, edit and manage all FieldOps users"
        action={<Button variant="primary" onClick={openCreate}>+ Add User</Button>}
      >
        {/* Role Filter Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {ROLE_TABS.map(t => (
            <button
              key={t.value}
              className={`tab${roleFilter === t.value ? " active" : ""}`}
              onClick={() => setRoleFilter(t.value)}
            >
              {t.label}
              <span style={{ marginLeft: 6, opacity: 0.7, fontSize: "0.8rem" }}>
                ({t.value === "ALL" ? users.length : users.filter(u => u.role === t.value).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? <p>Loading users...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Rate/km</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center" }}>No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{user.email}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[user.role] ?? ""}`}>
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td>₹{Number(user.rate_per_km).toFixed(2)}/km</td>
                  <td>
                    <span className={`badge ${user.is_active ? "badge-approved" : "badge-offline"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row gap-12">
                      <Button variant="ghost" onClick={() => openEdit(user)}>Edit</Button>
                      {user.is_active
                        ? <Button variant="danger" onClick={() => handleDeactivate(user)}>Deactivate</Button>
                        : <Button variant="ghost" onClick={() => handleReactivate(user)}>Reactivate</Button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit User" : "Add New User"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              {!editing && (
                <>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="rahul@company.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Temporary Password *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRow["role"] }))}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Rate per km (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={form.rate_per_km}
                    onChange={e => setForm(f => ({ ...f, rate_per_km: e.target.value }))}
                  />
                </div>
              </div>

              {editing && (
                <div className="form-group">
                  <label>Account Status</label>
                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === "active" }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}

              <div className="row-center gap-12">
                <Button variant="primary" type="submit">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
