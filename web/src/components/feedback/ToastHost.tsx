import { useToast } from "../../hooks/useToast";

export default function ToastHost() {
  const { toasts, removeToast } = useToast();

  return (
    <aside className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => removeToast(toast.id)}>
            X
          </button>
        </div>
      ))}
    </aside>
  );
}
