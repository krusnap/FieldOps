import { NavLink } from "react-router-dom";
import { AppRole } from "../../types/domain";

interface SidebarProps {
  role: AppRole;
  mobileOpen: boolean;
  onClose: () => void;
}

const navByRole: Record<AppRole, Array<{ label: string; to: string }>> = {
  manager: [
    { label: "Overview", to: "/manager/dashboard" },
    { label: "Employees", to: "/manager/employees" },
    { label: "Claims", to: "/manager/claims" },
    { label: "Reports", to: "/manager/reports" },
  ],
  admin: [
    { label: "Overview", to: "/admin/dashboard" },
    { label: "User Management", to: "/admin/users" },
    { label: "Manager Control", to: "/admin/manager-control" },
    { label: "Permissions", to: "/admin/permissions" },
    { label: "Analytics", to: "/admin/analytics" },
    { label: "System Monitoring", to: "/admin/system" },
    { label: "Data Viewer", to: "/admin/data-viewer" },
  ],
  accountant: [
    { label: "Overview", to: "/accountant/dashboard" },
    { label: "Claims", to: "/accountant/claims" },
  ],
};

export default function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">F</div>
        <div>
          <h1>FieldOps</h1>
          <p>Travel Intelligence</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navByRole[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footnote">
        <span className="dot" />
        {role[0].toUpperCase() + role.slice(1)} Workspace
      </div>
    </aside>
  );
}
