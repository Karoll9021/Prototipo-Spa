import { ReactNode, useEffect } from "react";

// ─── Shared UI Primitives ────────────────────────────────────────────────────

export type AppointmentStatus = "Programada" | "Confirmada" | "Atendida" | "Cancelada" | "No asistió";

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Programada: { bg: "#E0F2FE", text: "#0369A1" },
  Confirmada: { bg: "#FEF3C7", text: "#B45309" },
  Atendida: { bg: "#DCFCE7", text: "#15803D" },
  Cancelada: { bg: "#FEE2E2", text: "#B91C1C" },
  "No asistió": { bg: "#FEE2E2", text: "#B91C1C" },
  Activo: { bg: "#DCFCE7", text: "#15803D" },
  Inactivo: { bg: "#F4F4F5", text: "#71717A" },
  Activa: { bg: "#DCFCE7", text: "#15803D" },
  Inactiva: { bg: "#F4F4F5", text: "#71717A" },
  Anulada: { bg: "#FEE2E2", text: "#B91C1C" },
  Pagada: { bg: "#DCFCE7", text: "#15803D" },
  Pendiente: { bg: "#FEF3C7", text: "#B45309" },
};

export function Badge({ label }: { label: string }) {
  const s = STATUS_STYLES[label] ?? { bg: "#F4F4F5", text: "#71717A" };
  return (
    <span style={{ backgroundColor: s.bg, color: s.text, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export function PrimaryBtn({ children, onClick, small }: { children: ReactNode; onClick?: () => void; small?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "6px", background: "#B8405E", color: "#FFFFFF", border: "none", borderRadius: small ? "8px" : "10px", padding: small ? "7px 14px" : "10px 18px", fontSize: small ? "12px" : "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0px 4px 12px rgba(232,128,153,0.25)", transition: "background 0.15s", whiteSpace: "nowrap" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#A33652")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#B8405E")}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, danger }: { children: ReactNode; onClick?: () => void; danger?: boolean }) {
  const color = danger ? "#B91C1C" : "#71717A";
  const bg = danger ? "#FEE2E2" : "#F9F9FB";
  const border = danger ? "#FEE2E2" : "#E4E4E7";
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "6px", background: bg, color, border: `1px solid ${border}`, borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

export function IconBtn({ icon, onClick, variant = "ghost", title }: { icon: ReactNode; onClick?: () => void; variant?: "ghost" | "primary" | "danger"; title?: string }) {
  const styles = {
    ghost: { bg: "#F9F9FB", border: "#E4E4E7", color: "#71717A" },
    primary: { bg: "#FCE8EE", border: "#FCE8EE", color: "#B8405E" },
    danger: { bg: "#FEE2E2", border: "#FEE2E2", color: "#B91C1C" },
  }[variant];
  return (
    <button onClick={onClick} title={title}
      style={{ width: "28px", height: "28px", borderRadius: "8px", background: styles.bg, border: `1px solid ${styles.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: styles.color, flexShrink: 0, transition: "opacity 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
      {icon}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "360px" }}>
      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#71717A" }}>
        <IcoSearch />
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Buscar..."}
        style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #8A8A93", borderRadius: "10px", fontSize: "13px", color: "#221F20", outline: "none", background: "#FFFFFF", transition: "border-color 0.15s" }}
        onFocus={(e) => (e.target.style.borderColor = "#B8405E")}
        onBlur={(e) => (e.target.style.borderColor = "#8A8A93")} />
    </div>
  );
}

export function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 500, border: active ? "1.5px solid #E88099" : "1px solid #E4E4E7", background: active ? "#FCE8EE" : "#FFFFFF", color: active ? "#B8405E" : "#71717A", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ padding: "18px 24px", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "15px", fontWeight: 600, color: "#221F20" }}>{title}</h2>
      {children}
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th style={{ padding: "11px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, background: "#F9F9FB" }}>{children}</th>;
}

export function Td({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "13px 20px", fontSize: "13px", color: "#71717A", borderTop: "1px solid #E4E4E7", ...style }}>{children}</td>;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #E88099, #FCE8EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#B8405E", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function PageHeader({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "22px", fontWeight: 700, color: "#221F20", marginBottom: "4px" }}>{title}</h1>
        <p style={{ fontSize: "13px", color: "#71717A" }}>{desc}</p>
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>{children}</div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="bn-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(34,31,32,0.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bn-modal" role="dialog" aria-modal="true" aria-label={title} style={{ background: "#FFFFFF", borderRadius: "16px", boxShadow: "0px 20px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: wide ? "720px" : "480px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "16px", fontWeight: 700, color: "#221F20" }}>{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #E4E4E7", background: "#F9F9FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717A", fontSize: "16px" }}>×</button>
        </div>
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function FormRow({ label, children, required, error }: { label: string; children: ReactNode; required?: boolean; error?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#221F20" }}>{label}{required && <span style={{ color: "#B8405E" }}> *</span>}</label>
      {children}
      {error && <span role="alert" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#B91C1C", fontSize: "12px", fontWeight: 500 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l10 18H2zM12 10v4M12 17.5v.01" /></svg>{error}</span>}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = "text", disabled, invalid }: { value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; invalid?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} type={type} disabled={disabled}
      aria-invalid={invalid || undefined} style={{ padding: "9px 12px", border: invalid ? "1.5px solid #B91C1C" : "1px solid #8A8A93", borderRadius: "8px", fontSize: "13px", color: "#221F20", outline: "none", background: disabled ? "#F9F9FB" : "#FFFFFF", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" }}
      onFocus={(e) => !disabled && (e.target.style.borderColor = "#B8405E")}
      onBlur={(e) => (e.target.style.borderColor = invalid ? "#B91C1C" : "#8A8A93")} />
  );
}

export function Select({ value, onChange, options, disabled }: { value: string; onChange?: (v: string) => void; options: { label: string; value: string }[]; disabled?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled}
      style={{ padding: "9px 12px", border: "1px solid #8A8A93", borderRadius: "8px", fontSize: "13px", color: "#221F20", outline: "none", background: disabled ? "#F9F9FB" : "#FFFFFF", width: "100%", cursor: disabled ? "default" : "pointer", transition: "border-color 0.15s", appearance: "auto" }}
      onFocus={(e) => !disabled && (e.target.style.borderColor = "#B8405E")}
      onBlur={(e) => (e.target.style.borderColor = "#8A8A93")}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange?: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ padding: "9px 12px", border: "1px solid #8A8A93", borderRadius: "8px", fontSize: "13px", color: "#221F20", outline: "none", background: "#FFFFFF", width: "100%", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", transition: "border-color 0.15s" }}
      onFocus={(e) => (e.target.style.borderColor = "#B8405E")}
      onBlur={(e) => (e.target.style.borderColor = "#8A8A93")} />
  );
}

export function ModalActions({ onClose, onConfirm, confirmLabel = "Guardar", danger }: { onClose: () => void; onConfirm: () => void; confirmLabel?: string; danger?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #E4E4E7" }}>
      <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
      {danger
        ? <GhostBtn onClick={onConfirm} danger>{confirmLabel}</GhostBtn>
        : <PrimaryBtn onClick={onConfirm}>{confirmLabel}</PrimaryBtn>}
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #E4E4E7" }}>
      <span style={{ fontSize: "12px", color: "#71717A", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#221F20", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
      <div onClick={() => onChange(!checked)}
        style={{ width: "36px", height: "20px", borderRadius: "999px", background: checked ? "#E88099" : "#E4E4E7", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "2px", left: checked ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      {label && <span style={{ fontSize: "12px", color: "#221F20" }}>{label}</span>}
    </label>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

export const IcoPlus = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
export const IcoEdit = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
export const IcoEye = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
export const IcoTrash = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
export const IcoSearch = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
export const IcoToggle = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></svg>;
export const IcoDownload = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
export const IcoCalendar = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
export const IcoCheck = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
export const IcoShield = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
export const IcoUser = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
export const IcoClock = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
export const IcoX = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
