import { useEffect, useState } from "react";
import { ConfirmDialog, useToast } from "../components/feedback";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, ModalActions, DetailRow, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoTrash, IcoShield } from "../components/ui";
import { readUserDirectory, saveUserDirectory, type UserAccount } from "../data/userDirectory";
import { nextPrefixedId, readTable, type CitaServicioRow, type HorarioEmpleadoRow, type RolRow } from "../data/prototypeDatabase";

type User = UserAccount;

const ROLES_OPTIONS = [
  { label: "Administrador", value: "Administrador" },
  { label: "Empleada", value: "Empleada" },
  { label: "Recepcionista", value: "Recepcionista" },
  { label: "Soporte", value: "Soporte" },
];

const EMPTY = { name: "", doc: "", email: "", phone: "", roles: ["Empleada"], password: "" };
type ModalMode = "create" | "edit" | "detail" | "role" | "delete" | null;

export default function UsersView() {
  const [users, setUsers] = useState<User[]>(readUserDirectory);
  const [roleOptions] = useState(() => {
    const storedRoles = readTable<RolRow>("rol", []);
    const source = storedRoles.length ? storedRoles.map(role => role.nombre) : ROLES_OPTIONS.map(role => role.value);
    const names = new Map<string, string>();
    for (const roleName of source) {
      const name = roleName.trim();
      const key = name.toLocaleLowerCase("es");
      if (name) names.set(key, names.get(key) ?? name);
    }
    return [...names.values()].map(name => ({ label: name, value: name }));
  });
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [newRoles, setNewRoles] = useState<string[]>(["Empleada"]);
  const toast = useToast();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [confirmOff, setConfirmOff] = useState<User | null>(null);

  useEffect(() => saveUserDirectory(users), [users]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.doc.includes(search);
    const matchRole = filterRole === "Todos" || u.roles.includes(filterRole);
    const matchStatus = filterStatus === "Todos" || (filterStatus === "Activo" ? u.active : !u.active);
    return matchSearch && matchRole && matchStatus;
  });

  const open = (mode: ModalMode, u?: User) => {
    setSelected(u ?? null);
    setErrs({});
    if (mode === "create") setForm({ ...EMPTY });
    if (mode === "edit" && u) setForm({ name: u.name, doc: u.doc, email: u.email, phone: u.phone, roles: [...u.roles], password: "" });
    if (mode === "role" && u) setNewRoles([...u.roles]);
    setModal(mode);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Ingresa el nombre completo";
    if (!form.doc.trim()) e.doc = "Ingresa el documento";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Ingresa un correo válido";
    if (form.roles.length === 0) e.roles = "Asigna al menos un rol";
    if (modal === "create" && form.password.length < 6) e.password = "Usa al menos 6 caracteres";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) { toast.show("error", "Revisa los campos marcados"); return; }
    if (modal === "create") {
      const nu: User = { id: nextPrefixedId("U-", users.map(user => user.id)), ...form, active: true, lastLogin: "—", createdAt: new Date().toLocaleDateString("es-CO") };
      setUsers(p => [...p, nu]);
      toast.show("success", "Usuario creado");
    } else if (modal === "edit" && selected) {
      setUsers(p => p.map(u => u.id === selected.id ? { ...u, name: form.name, doc: form.doc, email: form.email, phone: form.phone, roles: [...form.roles] } : u));
      toast.show("success", "Cambios guardados");
    }
    setModal(null);
  };

  const saveRole = () => {
    const roles = [...new Map(newRoles.map(role => [role.trim().toLocaleLowerCase("es"), role.trim()])).values()];
    if (selected) setUsers(p => p.map(u => u.id === selected.id ? { ...u, roles } : u));
    toast.show("success", "Rol asignado");
    setModal(null);
  };

  const toggleStatus = (u: User) => {
    if (u.active) { setConfirmOff(u); return; }
    setUsers(p => p.map(x => x.id === u.id ? { ...x, active: true } : x));
    toast.show("success", "Usuario activado");
  };
  const confirmInactivate = () => {
    if (confirmOff) setUsers(p => p.map(x => x.id === confirmOff.id ? { ...x, active: false } : x));
    setConfirmOff(null);
    toast.show("warning", "Usuario inactivado");
  };
  const deleteUser = () => {
    if (!selected) return;
    const hasSchedule = readTable<HorarioEmpleadoRow>("horario_empleado", []).some(schedule => schedule.empleadoId === selected.id);
    const hasAppointments = readTable<CitaServicioRow>("cita_servicio", []).some(service => service.empleadoId === selected.id);
    if (hasSchedule || hasAppointments) {
      setUsers(current => current.map(user => user.id === selected.id ? { ...user, active: false } : user));
      toast.show("warning", "La cuenta tiene horarios o citas asociadas; se inactivó para conservar el historial");
    } else {
      setUsers(current => current.filter(user => user.id !== selected.id));
      toast.show("success", "Usuario eliminado");
    }
    setModal(null);
  };

  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleRole = (role: string, selectedRoles: string[], update: (roles: string[]) => void) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) update(selectedRoles.filter(item => item !== role));
      return;
    }
    update([...selectedRoles, role]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Gestión de Usuarios" desc="Administra los usuarios, credenciales y roles del sistema">
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nuevo Usuario</PrimaryBtn>
      </PageHeader>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email o documento..." />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["Todos", "Activo", "Inactivo"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
          <div style={{ width: "1px", background: "#E4E4E7", margin: "0 4px" }} />
          {["Todos", "Administrador", "Empleada", "Recepcionista"].map(r => <FilterPill key={r} label={r} active={filterRole === r} onClick={() => setFilterRole(r)} />)}
        </div>
      </div>

      <div className="bn-desktop-only"><Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Usuario</Th><Th>Documento</Th><Th>Teléfono</Th><Th>Rol</Th><Th>Último acceso</Th><Th>Estado</Th><Th>Acciones</Th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td style={{ color: "#221F20" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", u)} title="Ver detalle" />
                      <Avatar name={u.name} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{u.name}</div>
                        <div style={{ fontSize: "11px", color: "#71717A" }}>{u.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{u.doc}</Td>
                  <Td>{u.phone}</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {u.roles.map(role => <span key={role} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: role === "Administrador" ? "#FCE8EE" : "#F4F4F5", color: role === "Administrador" ? "#B8405E" : "#52525B" }}>{role}</span>)}
                      <IconBtn icon={<IcoShield />} onClick={() => open("role", u)} variant="ghost" title="Asignar rol" />
                    </div>
                  </Td>
                  <Td>{u.lastLogin}</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button type="button" role="switch" aria-checked={u.active} aria-label={u.active ? "Inactivar usuario" : "Activar usuario"} onClick={() => toggleStatus(u)} style={{ width: "38px", height: "22px", border: "none", borderRadius: "999px", background: u.active ? "#16A765" : "#D4D4D8", padding: "3px", cursor: "pointer", flexShrink: 0 }}>
                        <span style={{ display: "block", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transform: u.active ? "translateX(16px)" : "translateX(0)", transition: "transform 0.18s" }} />
                      </button>
                      <Badge label={u.active ? "Activo" : "Inactivo"} />
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <IconBtn icon={<IcoEdit />} onClick={() => open("edit", u)} variant="primary" title="Editar" />
                      <IconBtn icon={<IcoTrash />} onClick={() => open("delete", u)} variant="danger" title="Eliminar" />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card></div>

      <div className="bn-mobile-only" style={{ flexDirection: "column", gap: "12px" }}>
        {filtered.map(u => (
          <Card key={u.id} style={{ padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <Avatar name={u.name} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#221F20" }}>{u.name}</div>
                  <div style={{ fontSize: "12px", color: "#52525B", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                </div>
              </div>
              <Badge label={u.active ? "Activo" : "Inactivo"} />
            </div>
            <div style={{ fontSize: "12px", color: "#52525B", margin: "10px 0" }}>{u.roles.join(", ")} · {u.phone}</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <GhostBtn onClick={() => open("edit", u)}>Editar</GhostBtn>
              <GhostBtn onClick={() => open("role", u)}>Rol</GhostBtn>
              <GhostBtn onClick={() => toggleStatus(u)}>{u.active ? "Inactivar" : "Activar"}</GhostBtn>
            </div>
          </Card>
        ))}
      </div>

      {confirmOff && <ConfirmDialog title="¿Inactivar usuario?" message={<>{confirmOff.name} no podrá iniciar sesión. Puedes reactivarla cuando quieras.</>} confirmLabel="Inactivar" onCancel={() => setConfirmOff(null)} onConfirm={confirmInactivate} />}

      {/* Create / Edit */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nuevo Usuario" : "Editar Usuario"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormRow label="Nombre completo" required error={errs.name}><Input invalid={!!errs.name} value={form.name} onChange={f("name")} placeholder="Ej. María Fernanda Ruiz" /></FormRow>
            <FormRow label="Documento de identidad" required error={errs.doc}><Input invalid={!!errs.doc} value={form.doc} onChange={f("doc")} placeholder="1.234.567.890" /></FormRow>
            <FormRow label="Correo electrónico" required error={errs.email}><Input invalid={!!errs.email} value={form.email} onChange={f("email")} placeholder="correo@ekoplus.co" type="email" /></FormRow>
            <FormRow label="Teléfono"><Input value={form.phone} onChange={f("phone")} placeholder="300 000 0000" /></FormRow>
            <FormRow label="Roles" required error={errs.roles}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {roleOptions.map(role => (
                  <label key={role.value} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 10px", border: "1px solid #E4E4E7", borderRadius: "8px", fontSize: "12px", color: "#221F20", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.roles.includes(role.value)} onChange={() => toggleRole(role.value, form.roles, roles => setForm(current => ({ ...current, roles })))} />
                    {role.label}
                  </label>
                ))}
              </div>
            </FormRow>
            {modal === "create" && <FormRow label="Contraseña temporal" required error={errs.password}><Input invalid={!!errs.password} value={form.password} onChange={f("password")} placeholder="••••••••" type="password" /></FormRow>}
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Crear Usuario" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle del Usuario" onClose={() => setModal(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0 20px", borderBottom: "1px solid #E4E4E7", marginBottom: "12px" }}>
            <Avatar name={selected.name} size={48} />
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{selected.name}</p>
              <p style={{ fontSize: "12px", color: "#71717A" }}>{selected.email}</p>
            </div>
          </div>
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Documento" value={selected.doc} />
          <DetailRow label="Teléfono" value={selected.phone} />
          <DetailRow label="Roles" value={<div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "6px" }}>{selected.roles.map(role => <span key={role} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: "#FCE8EE", color: "#B8405E" }}>{role}</span>)}</div>} />
          <DetailRow label="Estado" value={<Badge label={selected.active ? "Activo" : "Inactivo"} />} />
          <DetailRow label="Último acceso" value={selected.lastLogin} />
          <DetailRow label="Fecha de creación" value={selected.createdAt} />
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

      {/* Assign Role */}
      {modal === "role" && selected && (
        <Modal title="Asignar Rol" onClose={() => setModal(null)}>
          <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "16px" }}>Selecciona el rol que deseas asignar a <strong style={{ color: "#221F20" }}>{selected.name}</strong>.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {roleOptions.map(r => (
              <label key={r.value} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: `1.5px solid ${newRoles.includes(r.value) ? "#E88099" : "#E4E4E7"}`, borderRadius: "10px", cursor: "pointer", background: newRoles.includes(r.value) ? "#FCE8EE" : "#FAFAFA", transition: "all 0.15s" }}>
                <input type="checkbox" checked={newRoles.includes(r.value)} onChange={() => toggleRole(r.value, newRoles, setNewRoles)} />
                <span style={{ fontSize: "13px", fontWeight: newRoles.includes(r.value) ? 600 : 400, color: newRoles.includes(r.value) ? "#B8405E" : "#221F20" }}>{r.label}</span>
              </label>
            ))}
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={saveRole} confirmLabel="Asignar Rol" />
        </Modal>
      )}

      {/* Delete */}
      {modal === "delete" && selected && (
        <Modal title="Eliminar Usuario" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#B91C1C" }}><IcoTrash /></div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#221F20", marginBottom: "8px" }}>¿Eliminar a "{selected.name}"?</p>
            <p style={{ fontSize: "13px", color: "#71717A" }}>Esta acción no se puede deshacer y se perderá el acceso del usuario al sistema.</p>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={deleteUser} confirmLabel="Sí, eliminar" danger />
        </Modal>
      )}
    </div>
  );
}
