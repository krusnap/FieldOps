import { useNavigate } from "react-router-dom";
import { AppRole } from "../../types/domain";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { useTheme } from "../../hooks/useTheme";

interface TopNavbarProps {
  pageTitle: string;
  role: AppRole;
  onOpenSidebar: () => void;
}

export default function TopNavbar({ pageTitle, role, onOpenSidebar }: TopNavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useRoleAccess();
  const { toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <button type="button" className="icon-button mobile-only" onClick={onOpenSidebar}>
        Menu
      </button>
      <div>
        <h2>{pageTitle}</h2>
        <p>Monitor trips, claims, analytics, and reimbursements</p>
      </div>
      <div className="topbar-user">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark and light mode"
          title="Toggle theme"
        >
          <span className="theme-dot sun-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M6.34 17.66l-1.41 1.41" />
              <path d="M19.07 4.93l-1.41 1.41" />
            </svg>
          </span>
          <span className="theme-dot moon-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0-1 6 4 10s9.79-.21 9.79-.21z" />
            </svg>
          </span>
        </button>
        <div>
          <strong>{user?.name ?? "FieldOps User"}</strong>
          <p>{role.toUpperCase()}</p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
