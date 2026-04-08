import { PropsWithChildren } from "react";

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            X
          </button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
