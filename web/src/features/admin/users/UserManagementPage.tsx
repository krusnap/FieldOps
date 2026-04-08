import { useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { users as seedUsers } from "../../../mocks/data";

interface UserRow {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>(seedUsers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [status, setStatus] = useState("Active");

  const canSubmit = useMemo(() => name.trim().length > 1, [name]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setRole("Employee");
    setStatus("Active");
    setOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setName(user.name);
    setRole(user.role);
    setStatus(user.status);
    setOpen(true);
  };

  const save = () => {
    if (!canSubmit) return;
    if (editing) {
      setUsers((prev) =>
        prev.map((item) => (item.id === editing.id ? { ...item, name: name.trim(), role, status } : item))
      );
    } else {
      setUsers((prev) => [
        ...prev,
        { id: `usr-${Date.now()}`, name: name.trim(), role, status },
      ]);
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setUsers((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Card
      title="User Management"
      subtitle="Add, edit, and delete users by role"
      action={<Button onClick={openCreate}>Add User</Button>}
    >
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>
                <div className="row gap-12">
                  <Button variant="ghost" onClick={() => openEdit(user)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => remove(user.id)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit User" : "Add User"}>
        <div className="form-grid top-space">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option>Manager</option>
              <option>Employee</option>
              <option>Admin</option>
              <option>Accountant</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <div className="row-end gap-12">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSubmit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
