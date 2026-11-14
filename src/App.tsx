import { useEffect, useState } from "react";
import LoginView from "./views/LoginView";
import { NotificationsPanel, ToastProvider, useToast, type Notif } from "./components/feedback";
import { Badge, Card, PageHeader } from "./components/ui";
import DashboardView from "./views/DashboardView";
import RolesView from "./views/RolesView";
import UsersView from "./views/UsersView";
import ServicesView from "./views/ServicesView";
import AgendaView from "./views/AgendaView";
import AppointmentsView from "./views/AppointmentsView";
import ClientsView from "./views/ClientsView";
import SalesView from "./views/SalesView";
import { readUserDirectory, type UserAccount } from "./data/userDirectory";

// ─── Nav Structure ───────────────────────────────────────────────────────────

type NavKey =
  | "dashboard"
  | "config-roles"
  | "users-gestion"
  | "users-acceso"
  | "services-catalogo"
  | "services-agenda"
  | "services-horarios"
  | "services-citas"
  | "ventas-clientes"
  | "ventas-ventas";

const NAV = [
  {
    key: "dashboard", label: "Dashboard", icon: IcoBarChart, children: [],
  },
  {
    key: "config", label: "Configuración", icon: IcoSettings,
    children: [{ key: "config-roles", label: "Roles y Permisos", icon: IcoShield }],
  },
  {
    key: "users", label: "Usuarios", icon: IcoUsers,
    children: [
      { key: "users-gestion", label: "Gestión de Usuarios", icon: IcoUser },
      { key: "users-acceso", label: "Gestión de Acceso", icon: IcoLock },
    ],
  },
  {
    key: "services", label: "Servicios", icon: IcoScissors,
    children: [
      { key: "services-catalogo", label: "Catálogo de Servicios", icon: IcoLayers },
      { key: "services-agenda", label: "Agenda / Horarios", icon: IcoCalendar },
      { key: "services-citas", label: "Gestión de Citas", icon: IcoCalendar },
    ],
  },
  {
    key: "ventas", label: "Ventas", icon: IcoDollar,
    children: [
      { key: "ventas-clientes", label: "Clientes", icon: IcoUsers },
      { key: "ventas-ventas", label: "Registro de Ventas", icon: IcoDollar },
    ],
  },
];

// ─── View Router ──────────────────────────────────────────────────────────────

function ViewRouter({ active }: { active: NavKey }) {
  switch (active) {
    case "dashboard": return <DashboardView />;
    case "config-roles": return <RolesView />;
    case "users-gestion": return <UsersView />;
    case "users-acceso": return <AccessView />;
    case "services-catalogo": return <ServicesView />;
    case "services-agenda": return <AgendaView />;
    case "services-citas": return <AppointmentsView />;
    case "ventas-clientes": return <ClientsView />;
    case "ventas-ventas": return <SalesView />;
    default: return <DashboardView />;
  }
}

type AccessSession = { id: string; user: string; email: string; device: string; location: string; lastActive: string; current: boolean };
type AccessLog = { id: string; user: string; email: string; event: string; device: string; location: string; time: string; status: "Exitoso" | "Fallido" };
type AccessPolicies = { twoFactor: boolean; concurrentSessions: boolean; passwordExpiry: number; failedAttempts: number; sessionDuration: number };

const INITIAL_SESSIONS: AccessSession[] = [
  { id: "S-1042", user: "Ana Sofía García", email: "asofia@ekoplus.co", device: "Chrome · Windows", location: "Bogotá, Colombia", lastActive: "Ahora", current: true },
  { id: "S-1041", user: "Andrea López", email: "andrea@ekoplus.co", device: "Safari · iPhone", location: "Bogotá, Colombia", lastActive: "Hace 12 min", current: false },
  { id: "S-1038", user: "Camila Reyes", email: "camila@ekoplus.co", device: "Chrome · Android", location: "Medellín, Colombia", lastActive: "Hace 1 h", current: false },
];

const INITIAL_ACCESS_LOG: AccessLog[] = [
  { id: "L-1", user: "Ana Sofía García", email: "asofia@ekoplus.co", event: "Inicio de sesión", device: "Chrome · Windows", location: "Bogotá, Colombia", time: "Hoy, 08:30", status: "Exitoso" },
  { id: "L-2", user: "Camila Reyes", email: "camila@ekoplus.co", event: "Inicio de sesión", device: "Chrome · Android", location: "Medellín, Colombia", time: "Hoy, 08:15", status: "Exitoso" },
  { id: "L-3", user: "Paola Sierra", email: "paola@ekoplus.co", event: "Intento de inicio de sesión", device: "Firefox · Windows", location: "Cali, Colombia", time: "Hoy, 07:52", status: "Fallido" },
  { id: "L-4", user: "Andrea López", email: "andrea@ekoplus.co", event: "Inicio de sesión", device: "Safari · iPhone", location: "Bogotá, Colombia", time: "Ayer, 17:10", status: "Exitoso" },
];

const INITIAL_POLICIES: AccessPolicies = { twoFactor: false, concurrentSessions: true, passwordExpiry: 90, failedAttempts: 5, sessionDuration: 30 };

function readStored<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`No se pudo leer la configuración guardada (${key}).`, error);
    return fallback;
  }
}

function AccessView() {
  const toast = useToast();
  const [tab, setTab] = useState<"accounts" | "sessions" | "history" | "policies">("accounts");
  const [users] = useState<UserAccount[]>(readUserDirectory);
  const [sessions, setSessions] = useState<AccessSession[]>(() => readStored("eko-access-sessions", INITIAL_SESSIONS));
  const [logs, setLogs] = useState<AccessLog[]>(() => readStored("eko-access-log", INITIAL_ACCESS_LOG));
  const [policies, setPolicies] = useState<AccessPolicies>(() => readStored("eko-access-policies", INITIAL_POLICIES));
  const [savedPolicies, setSavedPolicies] = useState(() => localStorage.getItem("eko-access-policies") !== null);
  const activeSessions = sessions.length;

  const revokeSession = (session: AccessSession) => {
    const updatedSessions = sessions.filter(item => item.id !== session.id);
    setSessions(updatedSessions);
    localStorage.setItem("eko-access-sessions", JSON.stringify(updatedSessions));
    const log: AccessLog = { id: `L-${Date.now()}`, user: session.user, email: session.email, event: "Sesión cerrada por administrador", device: session.device, location: session.location, time: "Ahora", status: "Exitoso" };
    const updatedLogs = [log, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem("eko-access-log", JSON.stringify(updatedLogs));
    toast.show("success", `Sesión de ${session.user} cerrada`);
  };

  const setPolicy = <K extends keyof AccessPolicies>(key: K, value: AccessPolicies[K]) => {
    setPolicies(current => ({ ...current, [key]: value }));
    setSavedPolicies(false);
  };

  const savePolicies = () => {
    localStorage.setItem("eko-access-policies", JSON.stringify(policies));
    setSavedPolicies(true);
    toast.show("success", "Políticas de acceso guardadas");
  };

  const tabButton = (key: typeof tab, label: string) => (
    <button key={key} onClick={() => setTab(key)} style={{ border: "none", borderBottom: tab === key ? "2px solid #B8405E" : "2px solid transparent", background: "transparent", color: tab === key ? "#B8405E" : "#71717A", padding: "12px 4px", fontSize: "13px", fontWeight: tab === key ? 600 : 500, cursor: "pointer" }}>{label}</button>
  );
  const th = (label: string) => <th key={label} style={{ textAlign: "left", padding: "11px 16px", fontSize: "10px", color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, background: "#F9F9FB", whiteSpace: "nowrap" }}>{label}</th>;
  const td = (value: React.ReactNode, key: string) => <td key={key} style={{ padding: "13px 16px", fontSize: "12px", color: "#71717A", borderTop: "1px solid #E4E4E7" }}>{value}</td>;
  const toggleButton = (checked: boolean, onClick: () => void, label: string) => (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={onClick} style={{ width: "38px", height: "22px", border: "none", borderRadius: "999px", background: checked ? "#B8405E" : "#D4D4D8", padding: "3px", cursor: "pointer", flexShrink: 0 }}>
      <span style={{ display: "block", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transform: checked ? "translateX(16px)" : "translateX(0)", transition: "transform 0.18s" }} />
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Gestión de Acceso" desc="Consulta las mismas cuentas de Gestión de Usuarios y administra su acceso" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {[
          { title: "Sesiones activas", value: String(activeSessions), note: "En todos los dispositivos" },
          { title: "Accesos exitosos", value: String(logs.filter(log => log.status === "Exitoso").length), note: "En el historial reciente" },
          { title: "Intentos fallidos", value: String(logs.filter(log => log.status === "Fallido").length), note: "Revisa actividad inusual" },
        ].map(metric => (
          <Card key={metric.title} style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "8px" }}>{metric.title}</p>
            <div style={{ fontSize: "25px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{metric.value}</div>
            <p style={{ fontSize: "11px", color: "#71717A", marginTop: "4px" }}>{metric.note}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "22px", borderBottom: "1px solid #E4E4E7", padding: "0 20px", overflowX: "auto" }}>
          {tabButton("accounts", "Usuarios")}
          {tabButton("sessions", "Sesiones activas")}
          {tabButton("history", "Historial de accesos")}
          {tabButton("policies", "Políticas de seguridad")}
        </div>
        {tab === "accounts" && (
          <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}><h2 style={{ fontSize: "14px", fontWeight: 600, color: "#221F20" }}>Usuarios y empleadas</h2><p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>Este listado comparte las cuentas de Gestión de Usuarios. Este prototipo guarda cambios en el navegador.</p></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Usuario", "Documento", "Teléfono", "Rol", "Estado"].map(th)}</tr></thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      {td(<><div style={{ color: "#221F20", fontWeight: 600 }}>{user.name}</div><div style={{ fontSize: "11px", marginTop: "3px" }}>{user.email}</div></>, `${user.id}-user`)}
                      {td(user.doc, `${user.id}-doc`)}
                      {td(user.phone, `${user.id}-phone`)}
                      {td(user.roles.join(", "), `${user.id}-role`)}
                      {td(<span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: "999px", background: user.active ? "#DCFCE7" : "#F4F4F5", color: user.active ? "#15803D" : "#71717A", fontSize: "11px", fontWeight: 600 }}>{user.active ? "Activo" : "Inactivo"}</span>, `${user.id}-status`)}
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "#71717A", fontSize: "13px" }}>No hay usuarios registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "sessions" && (
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div><h2 style={{ fontSize: "14px", fontWeight: 600, color: "#221F20" }}>Dispositivos conectados</h2><p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>Cierra cualquier sesión que no reconozcas.</p></div>
              <Badge label={`${activeSessions} activas`} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Usuario", "Dispositivo", "Ubicación", "Última actividad", "Acción"].map(th)}</tr></thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.id}>
                      {td(<><div style={{ color: "#221F20", fontWeight: 600 }}>{session.user}{session.current && <span style={{ marginLeft: "7px", color: "#15803D", fontSize: "10px" }}>ESTE DISPOSITIVO</span>}</div><div style={{ fontSize: "11px", marginTop: "3px" }}>{session.email}</div></>, `${session.id}-user`)}
                      {td(session.device, `${session.id}-device`)}
                      {td(session.location, `${session.id}-location`)}
                      {td(session.lastActive, `${session.id}-time`)}
                      {td(<button onClick={() => revokeSession(session)} style={{ border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", borderRadius: "7px", padding: "6px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Cerrar sesión</button>, `${session.id}-action`)}
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "#71717A", fontSize: "13px" }}>No hay sesiones activas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "history" && (
          <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}><h2 style={{ fontSize: "14px", fontWeight: 600, color: "#221F20" }}>Actividad reciente</h2><p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>Registro de autenticación y cambios de sesión.</p></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Usuario", "Evento", "Dispositivo", "Ubicación", "Fecha", "Resultado"].map(th)}</tr></thead>
                <tbody>{logs.map(log => <tr key={log.id}>
                  {td(<><div style={{ color: "#221F20", fontWeight: 600 }}>{log.user}</div><div style={{ fontSize: "11px", marginTop: "3px" }}>{log.email}</div></>, `${log.id}-user`)}
                  {td(log.event, `${log.id}-event`)}{td(log.device, `${log.id}-device`)}{td(log.location, `${log.id}-location`)}{td(log.time, `${log.id}-time`)}
                  {td(<span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: "999px", background: log.status === "Exitoso" ? "#DCFCE7" : "#FEE2E2", color: log.status === "Exitoso" ? "#15803D" : "#B91C1C", fontSize: "11px", fontWeight: 600 }}>{log.status}</span>, `${log.id}-status`)}
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "policies" && (
          <div style={{ padding: "20px", maxWidth: "720px" }}>
            <div style={{ marginBottom: "18px" }}><h2 style={{ fontSize: "14px", fontWeight: 600, color: "#221F20" }}>Políticas de autenticación</h2><p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>Define cómo se protegen las cuentas de EKO+.</p></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { key: "twoFactor" as const, label: "Verificación en dos pasos", desc: "Solicitar un segundo factor al iniciar sesión." },
                { key: "concurrentSessions" as const, label: "Permitir varias sesiones", desc: "Deja que una cuenta se conecte desde más de un dispositivo." },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #E4E4E7" }}>
                  <div><div style={{ fontSize: "13px", fontWeight: 600, color: "#221F20" }}>{item.label}</div><div style={{ fontSize: "11px", color: "#71717A", marginTop: "4px" }}>{item.desc}</div></div>
                  {toggleButton(policies[item.key], () => setPolicy(item.key, !policies[item.key]), item.label)}
                </div>
              ))}
              {([
                { key: "passwordExpiry" as const, label: "Vigencia de contraseña", desc: "Días antes de solicitar una nueva contraseña.", suffix: "días", min: 0, max: 365 },
                { key: "failedAttempts" as const, label: "Intentos fallidos permitidos", desc: "Intentos antes de bloquear temporalmente el acceso.", suffix: "intentos", min: 3, max: 10 },
                { key: "sessionDuration" as const, label: "Duración de sesión", desc: "Minutos de inactividad antes de cerrar una sesión.", suffix: "minutos", min: 5, max: 240 },
              ]).map(item => (
                <label key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #E4E4E7" }}>
                  <span><span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#221F20" }}>{item.label}</span><span style={{ display: "block", fontSize: "11px", color: "#71717A", marginTop: "4px" }}>{item.desc}</span></span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#71717A", fontSize: "12px", whiteSpace: "nowrap" }}><input type="number" min={item.min} max={item.max} value={policies[item.key]} onChange={event => setPolicy(item.key, Math.min(item.max, Math.max(item.min, Number(event.target.value))))} style={{ width: "72px", padding: "8px", border: "1px solid #D4D4D8", borderRadius: "7px", background: "#FFFFFF", color: "#221F20" }} />{item.suffix}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "20px" }}>
              {savedPolicies && <span style={{ fontSize: "11px", color: "#15803D" }}>Cambios guardados</span>}
              <button onClick={savePolicies} style={{ border: "none", borderRadius: "8px", background: "#B8405E", color: "#FFFFFF", padding: "9px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Guardar políticas</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onNavigate, collapsed, onLogout }: { active: NavKey; onNavigate: (k: NavKey) => void; collapsed: boolean; onLogout: () => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    config: false, users: false, services: true, ventas: false,
  });

  const toggle = (key: string) => setOpenGroups(p => ({ ...p, [key]: !p[key] }));
  const childActive = (g: typeof NAV[0]) => g.children.some(c => c.key === active);

  return (
    <aside style={{ width: collapsed ? "60px" : "236px", minHeight: "100vh", background: "#F9F9FB", borderRight: "1px solid #E4E4E7", display: "flex", flexDirection: "column", transition: "width 0.22s ease", flexShrink: 0, overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "22px 0" : "22px 18px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #E4E4E7" }}>
        <img src="/eko-plus-logo.png" alt="EKO+" style={{ width: collapsed ? "40px" : "92px", height: collapsed ? "40px" : "90px", objectFit: "contain", background: "#FFFFFF", borderRadius: "8px", padding: "2px", flexShrink: 0, margin: collapsed ? "0 auto" : "0 auto" }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 6px", overflowY: "auto" }}>
        {NAV.map(item => {
          const isLeaf = item.children.length === 0;
          const isOpen = openGroups[item.key];
          const isChildOn = childActive(item);
          const isOn = active === item.key;
          const accentBg = (isOn || isChildOn) ? "#FCE8EE" : "transparent";
          const accentColor = (isOn || isChildOn) ? "#B8405E" : "#71717A";

          return (
            <div key={item.key}>
              <button
                onClick={() => isLeaf ? onNavigate(item.key as NavKey) : (!collapsed && toggle(item.key))}
                title={collapsed ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "9px", padding: collapsed ? "9px 0" : "9px 10px", borderRadius: "9px", border: "none", cursor: "pointer", background: accentBg, color: accentColor, fontSize: "13px", fontWeight: (isOn || isChildOn) ? 600 : 400, transition: "all 0.14s", justifyContent: collapsed ? "center" : "flex-start", marginBottom: "1px" }}
                onMouseEnter={e => { if (!isOn && !isChildOn) e.currentTarget.style.background = "#F2F2F4"; }}
                onMouseLeave={e => { if (!isOn && !isChildOn) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flexShrink: 0 }}><item.icon /></span>
                {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                {!collapsed && !isLeaf && <ChevronDown open={isOpen} />}
              </button>

              {!collapsed && isOpen && item.children.length > 0 && (
                <div style={{ marginLeft: "10px", paddingLeft: "12px", borderLeft: "1.5px solid #E4E4E7", marginBottom: "3px" }}>
                  {item.children.map(child => {
                    const cOn = active === child.key;
                    return (
                      <button key={child.key} onClick={() => onNavigate(child.key as NavKey)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "7px", padding: "7px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: cOn ? "#FCE8EE" : "transparent", color: cOn ? "#B8405E" : "#71717A", fontSize: "12.5px", fontWeight: cOn ? 600 : 400, transition: "all 0.14s", marginBottom: "1px", textAlign: "left" }}
                        onMouseEnter={e => { if (!cOn) e.currentTarget.style.background = "#F2F2F4"; }}
                        onMouseLeave={e => { if (!cOn) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ flexShrink: 0, color: cOn ? "#B8405E" : "#71717A" }}><child.icon /></span>
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: collapsed ? "14px 0" : "14px 10px", borderTop: "1px solid #E4E4E7", display: "flex", alignItems: "center", gap: "9px", justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #E88099, #FCE8EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#B8405E", flexShrink: 0 }}>AS</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#221F20", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ana Sofía</div>
            <div style={{ fontSize: "10px", color: "#71717A" }}>Administrador</div>
          </div>
        )}
        {!collapsed && <button onClick={onLogout} aria-label="Cerrar sesión" style={{ border: "1px solid #E4E4E7", background: "#FFFFFF", color: "#B8405E", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", minHeight: "32px" }}>Salir</button>}
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ active, onToggle, unread, onBell, panel, darkMode, onToggleTheme }: { active: NavKey; onToggle: () => void; unread: number; onBell: () => void; panel: React.ReactNode; darkMode: boolean; onToggleTheme: () => void }) {
  const label = NAV.flatMap(n => [{ key: n.key, label: n.label }, ...n.children]).find(n => n.key === active)?.label ?? "Dashboard";
  return (
    <div className="bn-topbar" style={{ height: "58px", background: "#FFFFFF", borderBottom: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", flexShrink: 0, gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onToggle} aria-label="Abrir o cerrar menú" style={{ width: "32px", height: "32px", borderRadius: "8px", background: "transparent", border: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717A" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FCE8EE"; e.currentTarget.style.color = "#B8405E"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#71717A"; }}>
          <IcoMenu />
        </button>
        <span style={{ fontSize: "14px", fontWeight: 500, color: "#71717A" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onToggleTheme} aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} title={darkMode ? "Modo claro" : "Modo oscuro"} style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#F9F9FB", border: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717A" }}>
          {darkMode ? <IcoSun /> : <IcoMoon />}
        </button>
        <div style={{ position: "relative" }}><button aria-label="Notificaciones" onClick={onBell} style={{ position: "relative", width: "34px", height: "34px", borderRadius: "9px", background: "#F9F9FB", border: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717A" }}>
          <IcoBell />
          {unread > 0 && (<span style={{ position: "absolute", top: "8px", right: "8px", width: "6px", height: "6px", borderRadius: "50%", background: "#B8405E", border: "2px solid #FFFFFF" }} />)}
        </button>
        {panel}
        </div>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #E88099, #FCE8EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#B8405E", cursor: "pointer" }}>AS</div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

const NOTIFS: Notif[] = [
  { id: 1, kind: "info", title: "Nueva cita", text: "Andrea López · hoy 3:00 p. m.", unread: true },
  { id: 2, kind: "warning", title: "Cita cancelada", text: "Camila Reyes · hoy 11:30 a. m.", unread: true },
  { id: 3, kind: "info", title: "Recordatorio", text: "Genera el reporte quincenal", unread: false },
];

function useIsMobile() {
  const q = "(max-width: 768px)";
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
}

function AppShell() {
  const toast = useToast();
  const mobile = useIsMobile();
  const [auth, setAuth] = useState(false);
  const [active, setActive] = useState<NavKey>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS);
  const [showNotifs, setShowNotifs] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("eko-theme") === "dark");
  const unread = notifs.filter(n => n.unread).length;

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("eko-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  if (!auth) return <LoginView onLogin={() => { setAuth(true); toast.show("success", "Sesión iniciada"); }} />;

  const logout = () => { setAuth(false); setDrawer(false); setShowNotifs(false); setActive("dashboard"); };
  const go = (k: NavKey) => { setActive(k); setDrawer(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FFFFFF" }}>
      {mobile ? (
        drawer && (
          <>
            <div className="bn-drawer-overlay" onClick={() => setDrawer(false)} />
            <div className="bn-drawer"><Sidebar active={active} onNavigate={go} collapsed={false} onLogout={logout} /></div>
          </>
        )
      ) : (
        <Sidebar active={active} onNavigate={setActive} collapsed={collapsed} onLogout={logout} />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          active={active}
          onToggle={() => (mobile ? setDrawer(true) : setCollapsed(v => !v))}
          unread={unread}
          onBell={() => setShowNotifs(v => !v)}
          panel={showNotifs && <NotificationsPanel items={notifs} onReadAll={() => setNotifs(p => p.map(n => ({ ...n, unread: false })))} onClose={() => setShowNotifs(false)} />}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(value => !value)}
        />
        <main className="bn-main" style={{ flex: 1, padding: "26px 28px", background: "#F9F9FB", overflowY: "auto" }}>
          <ViewRouter active={active} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
  return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>;
}
function IcoBarChart() { return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function IcoSettings() { return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IcoUsers() { return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IcoScissors() { return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>; }
function IcoDollar() { return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function IcoShield() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcoUser() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IcoLock() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IcoLayers() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>; }
function IcoCalendar() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcoMenu() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IcoBell() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IcoMoon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5z"/></svg>; }
function IcoSun() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>; }
