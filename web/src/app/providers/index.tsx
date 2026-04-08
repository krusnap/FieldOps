import { PropsWithChildren } from "react";
import { ToastProvider } from "../../hooks/useToast";
import { RoleAccessProvider } from "../../hooks/useRoleAccess";
import { ThemeProvider } from "../../hooks/useTheme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <RoleAccessProvider>
        <ToastProvider>{children}</ToastProvider>
      </RoleAccessProvider>
    </ThemeProvider>
  );
}
