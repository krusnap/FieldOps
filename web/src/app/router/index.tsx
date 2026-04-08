import { Navigate, createBrowserRouter } from "react-router-dom";
import AppShell from "../layout/AppShell";
import LoginPage from "../../features/auth/LoginPage";
import RoleGuard from "../../features/auth/RoleGuard";

import ManagerDashboardPage from "../../features/manager/dashboard/ManagerDashboardPage";
import EmployeesListPage from "../../features/manager/employees/EmployeesListPage";
import EmployeeDetailPage from "../../features/manager/employees/EmployeeDetailPage";
import ClaimsReviewPage from "../../features/manager/claims/ClaimsReviewPage";
import ClaimDetailPage from "../../features/manager/claims/ClaimDetailPage";
import ManagerReportsPage from "../../features/manager/reports/ManagerReportsPage";

import AdminDashboardPage from "../../features/admin/dashboard/AdminDashboardPage";
import UserManagementPage from "../../features/admin/users/UserManagementPage";
import ManagerControlPage from "../../features/admin/manager-control/ManagerControlPage";
import PermissionsPage from "../../features/admin/permissions/PermissionsPage";
import AdminAnalyticsPage from "../../features/admin/analytics/AdminAnalyticsPage";
import SystemMonitoringPage from "../../features/admin/system-monitoring/SystemMonitoringPage";
import DataViewerPage from "../../features/admin/data-viewer/DataViewerPage";

import AccountantDashboardPage from "../../features/accountant/dashboard/AccountantDashboardPage";
import AccountantClaimsPage from "../../features/accountant/claims/AccountantClaimsPage";
import AccountantClaimDetailPage from "../../features/accountant/claims/AccountantClaimDetailPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/manager",
    element: (
      <RoleGuard allowedRole="manager">
        <AppShell role="manager" />
      </RoleGuard>
    ),
    children: [
      { path: "dashboard", element: <ManagerDashboardPage /> },
      { path: "employees", element: <EmployeesListPage /> },
      { path: "employees/:employeeId", element: <EmployeeDetailPage /> },
      { path: "claims", element: <ClaimsReviewPage /> },
      { path: "claims/:claimId", element: <ClaimDetailPage /> },
      { path: "reports", element: <ManagerReportsPage /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RoleGuard allowedRole="admin">
        <AppShell role="admin" />
      </RoleGuard>
    ),
    children: [
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "users", element: <UserManagementPage /> },
      { path: "manager-control", element: <ManagerControlPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "analytics", element: <AdminAnalyticsPage /> },
      { path: "system", element: <SystemMonitoringPage /> },
      { path: "data-viewer", element: <DataViewerPage /> },
    ],
  },
  {
    path: "/accountant",
    element: (
      <RoleGuard allowedRole="accountant">
        <AppShell role="accountant" />
      </RoleGuard>
    ),
    children: [
      { path: "dashboard", element: <AccountantDashboardPage /> },
      { path: "claims", element: <AccountantClaimsPage /> },
      { path: "claims/:claimId", element: <AccountantClaimDetailPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
