import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Modal, ModalActions } from "./ui";

export type Kind = "success" | "error" | "warning" | "info";

// Colores de estado (contraste AA validado): texto sobre fondo
export const KIND: Record<Kind, { bg: string; fg: string; border: string; icon: ReactNode }> = {
  success: { bg: "#DCFCE7", fg: "#15803D", border: "#86C99C", icon: <path d="M5 12l5 5L20 7" /> },
  error: { bg: "#FEE2E2", fg: "#B91C1C", border: "#E59A9A", icon: <path d="M6 6l12 12M18 6L6 18" /> },
  warning: { bg: "#FEF3C7", fg: "#B45309", border: "#E3B96B", icon: <path d="M12 3l10 18H2zM12 10v4M12 17.5v.01" /> },
  info: { bg: "#E0F2FE", fg: "#0369A1", border: "#86BEE0", icon: <path d="M12 3a9 9 0 100 18 9 9 0 000-18M12 11v5M12 8v.01" /> },
};

export function StateIcon({ kind, size = 18 }: { kind: Kind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {KIND[kind].icon}
    </svg>
  );
}

/** Mensaje en línea (banner). Siempre lleva ícono + texto, nunca solo color. */
export function Banner({ kind, children }: { kind: Kind; children: ReactNode }) {
  const k = KIND[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} style={{ display: "flex", alignItems: "center", gap: "10px", background: k.bg, color: k.fg, border: `1px solid ${k.border}`, borderRadius: "10px", padding: "11px 14px", fontSize: "13px", fontWeight: 500 }}>
      <StateIcon kind={kind} />
      <span>{children}</span>
    </div>
  );
}

// ─── Toasts ───────────────────────────────────────────────────────────────────
type Toast = { id: number; kind: Kind; msg: string };
const ToastCtx = createContext<{ show: (kind: Kind, msg: string) => void }>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = (id: number) => setItems(p => p.filter(t => t.id !== id));
  const show = useCallback((kind: Kind, msg: string) => {
    const id = Date.now() + Math.random();
    setItems(p => [...p, { id, kind, msg }]);
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="bn-toasts" aria-live="polite" style={{ position: "fixed", top: "16px", right: "16px", zIndex: 2000, display: "flex", flexDirection: "column", gap: "10px", width: "340px", maxWidth: "calc(100vw - 24px)" }}>
        {items.map(t => {
          const k = KIND[t.kind];
          return (
            <div key={t.id} role={t.kind === "error" ? "alert" : "status"} style={{ display: "flex", alignItems: "center", gap: "10px", background: k.bg, color: k.fg, border: `1px solid ${k.border}`, borderRadius: "12px", padding: "12px 14px", fontSize: "13px", fontWeight: 500, boxShadow: "0 8px 24px rgba(34,31,32,0.15)" }}>
              <StateIcon kind={t.kind} />
              <span style={{ flex: 1 }}>{t.msg}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" style={{ border: "none", background: "transparent", color: k.fg, cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "4px" }}>×</button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Confirmación (modal; en móvil se muestra como bottom sheet) ─────────────
export function ConfirmDialog({ title, message, confirmLabel, danger, onCancel, onConfirm }: { title: string; message: ReactNode; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ fontSize: "14px", lineHeight: 1.5, color: "#52525B" }}>{message}</p>
      <ModalActions onClose={onCancel} onConfirm={onConfirm} confirmLabel={confirmLabel} danger={danger} />
    </Modal>
  );
}

// ─── Notificaciones ───────────────────────────────────────────────────────────
export type Notif = { id: number; kind: Kind; title: string; text: string; unread: boolean };

export function NotificationsPanel({ items, onReadAll, onClose }: { items: Notif[]; onReadAll: () => void; onClose: () => void }) {
  return (
    <div role="dialog" aria-label="Notificaciones" style={{ position: "absolute", top: "42px", right: 0, width: "340px", maxWidth: "calc(100vw - 24px)", background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", boxShadow: "0 12px 32px rgba(34,31,32,0.16)", zIndex: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #E4E4E7" }}>
        <strong style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "14px" }}>Notificaciones</strong>
        <button onClick={onReadAll} style={{ border: "none", background: "transparent", color: "#B8405E", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Marcar como leídas</button>
      </div>
      {items.map(n => {
        const k = KIND[n.kind];
        return (
          <div key={n.id} style={{ display: "flex", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #F4F4F5", background: n.unread ? "#FCE8EE" : "#FFFFFF" }}>
            <span style={{ color: k.fg, marginTop: "1px" }}><StateIcon kind={n.kind} size={16} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#221F20" }}>{n.title}{n.unread && <span style={{ fontSize: "11px", fontWeight: 600, color: "#B8405E" }}> · Nueva</span>}</div>
              <div style={{ fontSize: "12px", color: "#52525B" }}>{n.text}</div>
            </div>
          </div>
        );
      })}
      <div style={{ padding: "10px 16px", textAlign: "right" }}>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#52525B", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Cerrar</button>
      </div>
    </div>
  );
}
