import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { AppRole } from "../../types/domain";
import { useRoleAccess } from "../../hooks/useRoleAccess";

interface RoleGuardProps extends PropsWithChildren {
  allowedRole: AppRole;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { isAuthenticated, user } = useRoleAccess();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}
