import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

export interface ToastItem {
  id: number;
  title: string;
  message: string;
  tone: "success" | "danger" | "warning";
}

interface ToastContextValue {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo<ToastContextValue>(() => {
    return {
      toasts,
      pushToast: (toast) => {
        const id = Date.now() + Math.floor(Math.random() * 100);
        setToasts((prev) => [...prev, { ...toast, id }]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 3200);
      },
      removeToast: (id) => setToasts((prev) => prev.filter((item) => item.id !== id)),
    };
  }, [toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
