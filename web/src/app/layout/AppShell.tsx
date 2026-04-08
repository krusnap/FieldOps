import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { AppRole } from "../../types/domain";

interface AppShellProps {
  role: AppRole;
}

const titleMap: Array<{ key: string; title: string }> = [
  { key: "dashboard", title: "Dashboard" },
  { key: "employees", title: "Employee Monitoring" },
  { key: "claims", title: "Claims" },
  { key: "reports", title: "Reports" },
  { key: "users", title: "User Management" },
  { key: "manager-control", title: "Manager Control" },
  { key: "permissions", title: "Permissions" },
  { key: "analytics", title: "Analytics" },
  { key: "system", title: "System Monitoring" },
  { key: "data-viewer", title: "Data Viewer" },
];

export default function AppShell({ role }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    for (const item of titleMap) {
      if (location.pathname.includes(item.key)) {
        return item.title;
      }
    }
    return "FieldOps";
  }, [location.pathname]);

  return (
    <div className="shell">
      <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="shell-main">
        <TopNavbar
          pageTitle={pageTitle}
          role={role}
          onOpenSidebar={() => setMobileOpen((prev) => !prev)}
        />
        <main className="content-area" onClick={() => mobileOpen && setMobileOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
