import { useEffect, useState } from "react";
import { Badge, Card, CardHeader, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Textarea, ModalActions, DetailRow, Toggle, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoTrash, IcoShield } from "../components/ui";
import { useToast } from "../components/feedback";
import { nextPrefixedId, readTable, usePersistentState, writeTable, type PermisoRow, type RolPermisoRow, type RolRow } from "../data/prototypeDatabase";
import { readUserDirectory } from "../data/userDirectory";

const ALL_PERMS = [
  { group: "Configuración", items: ["Ver roles", "Crear roles", "Editar roles", "Eliminar roles", "Cambiar estado rol", "Asignar permisos"] },
  { group: "Usuarios", items: ["Ver usuarios", "Crear usuarios", "Editar usuarios", "Eliminar usuarios", "Cambiar estado usuario", "Asignar rol"] },
  { group: "Servicios", items: ["Ver servicios", "Crear servicios", "Editar servicios", "Cambiar estado servicio"] },
  { group: "Empleados", items: ["Ver empleados", "Crear empleados", "Editar empleados", "Cambiar estado empleado", "Ver disponibilidad"] },
  { group: "Citas", items: ["Ver citas", "Crear citas", "Editar citas", "Cambiar estado cita"] },
  { group: "Clientes", items: ["Ver clientes", "Crear clientes", "Editar clientes", "Cambiar estado cliente"] },
  { group: "Ventas", items: ["Ver ventas", "Crear ventas", "Editar ventas", "Anular ventas"] },
  { group: "Dashboard", items: ["Ver dashboard", "Generar reportes"] },
];

type Role = { id: string; name: string; desc: string; users: number; active: boolean; perms: string[] };

const INITIAL_ROLES: Role[] = [
  { id: "R-001", name: "Administrador", desc: "Acceso total al sistema", users: 1, active: true, perms: ALL_PERMS.flatMap(g => g.items) },
  { id: "R-002", name: "Empleada", desc: "Acceso a agenda, citas y servicios propios", users: 3, active: true, perms: ["Ver citas", "Crear citas", "Editar citas", "Ver servicios", "Ver clientes"] },
  { id: "R-003", name: "Recepcionista", desc: "Gestión de clientes, citas y ventas", users: 0, active: true, perms: ["Ver citas", "Crear citas", "Editar citas", "Cambiar estado cita", "Ver clientes", "Crear clientes", "Editar clientes", "Ver ventas", "Crear ventas"] },
  { id: "R-004", name: "Soporte", desc: "Solo consulta de reportes y métricas", users: 0, active: false, perms: ["Ver dashboard", "Generar reportes"] },
];

type ModalMode = "create" | "edit" | "detail" | "perms" | "delete" | null;

export default function RolesView() {
  const [roles, setRoles] = usePersistentState<Role[]>("eko-roles", INITIAL_ROLES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", desc: "" });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const toast = useToast();

  useEffect(() => {
    const storedRoles = readTable<RolRow>("rol", []);
    let nextRoleId = storedRoles.reduce((highest, role) => Math.max(highest, role.id), 0) + 1;
    const roleIds = new Map(storedRoles.map(role => [role.nombre, role.id]));
    const rows = [...storedRoles];
    roles.forEach(role => {
      if (!roleIds.has(role.name)) {
        roleIds.set(role.name, nextRoleId);
        rows.push({ id: nextRoleId, nombre: role.name });
        nextRoleId++;
      }
    });

    const existingPermissions = readTable<PermisoRow>("permiso", []);
    const permissionIds = new Map(existingPermissions.map(permission => [`${permission.modulo}:${permission.nombre}`, permission.id]));
    let nextPermissionId = existingPermissions.reduce((highest, permission) => Math.max(highest, permission.id), 0) + 1;
    const permissionRows = [...existingPermissions];
    const permissionId = (name: string) => {
      const group = ALL_PERMS.find(item => item.items.includes(name));
      const key = `${group?.group ?? "General"}:${name}`;
      const existingId = permissionIds.get(key);
      if (existingId !== undefined) return existingId;
      const id = nextPermissionId++;
      permissionIds.set(key, id);
      permissionRows.push({ id, modulo: group?.group ?? "General", accion: name.split(" ")[0] ?? "", nombre: name });
      return id;
    };
    const activeRoleIds = new Set(roles.map(role => roleIds.get(role.name)).filter((id): id is number => id !== undefined));
    const rolePermissionRows = readTable<RolPermisoRow>("rol_permiso", []).filter(link => !activeRoleIds.has(link.rolId));
    roles.forEach(role => role.perms.forEach(name => rolePermissionRows.push({ rolId: roleIds.get(role.name)!, permisoId: permissionId(name) })));

    writeTable("rol", rows);
    writeTable("permiso", permissionRows);
    writeTable("rol_permiso", rolePermissionRows);
  }, [roles]);

  const filtered = roles.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || (filterStatus === "Activo" ? r.active : !r.active);
    return matchSearch && matchStatus;
  });
  const userCounts = readUserDirectory().reduce((counts, user) => {
    user.roles.forEach(roleName => counts.set(roleName, (counts.get(roleName) ?? 0) + 1));
    return counts;
  }, new Map<string, number>());

  const open = (mode: ModalMode, role?: Role) => {
    setSelected(role ?? null);
    if (mode === "create") setForm({ name: "", desc: "" });
    if (mode === "edit" && role) setForm({ name: role.name, desc: role.desc });
    if (mode === "perms" && role) setSelectedPerms([...role.perms]);
    setModal(mode);
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      toast.show("error", "Ingresa el nombre del rol");
      return;
    }
    const duplicate = roles.some(role =>
      role.id !== selected?.id && role.name.trim().toLocaleLowerCase("es") === name.toLocaleLowerCase("es")
    );
    if (duplicate) {
      toast.show("error", "Ya existe un rol con ese nombre");
      return;
    }
    if (modal === "create") {
      const newRole: Role = { id: nextPrefixedId("R-", roles.map(role => role.id)), name, desc: form.desc, users: 0, active: true, perms: [] };
      setRoles(prev => [...prev, newRole]);
    } else if (modal === "edit" && selected) {
      setRoles(prev => prev.map(r => r.id === selected.id ? { ...r, name, desc: form.desc } : r));
    }
    setModal(null);
  };

  const savePerms = () => {
    if (selected) setRoles(prev => prev.map(r => r.id === selected.id ? { ...r, perms: selectedPerms } : r));
    setModal(null);
  };

  const toggleStatus = (id: string) => setRoles(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const deleteRole = () => {
    if (!selected) return;
    if (userCounts.get(selected.name)) {
      toast.show("error", "No se puede eliminar un rol asignado a usuarios");
      setModal(null);
      return;
    }
    const roleRow = readTable<RolRow>("rol", []).find(role => role.nombre === selected.name);
    if (roleRow) {
      writeTable("rol", readTable<RolRow>("rol", []).filter(role => role.id !== roleRow.id));
      writeTable("rol_permiso", readTable<RolPermisoRow>("rol_permiso", []).filter(link => link.rolId !== roleRow.id));
    }
    setRoles(prev => prev.filter(r => r.id !== selected.id));
    setModal(null);
    toast.show("success", "Rol eliminado");
  };

  const togglePerm = (p: string) => setSelectedPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleGroup = (items: string[]) => {
    const allOn = items.every(p => selectedPerms.includes(p));
    setSelectedPerms(prev => allOn ? prev.filter(p => !items.includes(p)) : [...new Set([...prev, ...items])]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Roles y Permisos" desc="Administra los roles del sistema y sus permisos de acceso">
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nuevo Rol</PrimaryBtn>
      </PageHeader>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o ID..." />
        <div style={{ display: "flex", gap: "6px" }}>
          {["Todos", "Activo", "Inactivo"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>Rol</Th><Th>Descripción</Th><Th>Usuarios</Th><Th>Permisos</Th><Th>Estado</Th><Th>Acciones</Th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td style={{ color: "#221F20", fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", r)} title="Ver detalle" />
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#FCE8EE", display: "flex", alignItems: "center", justifyContent: "center", color: "#B8405E" }}><IcoShield /></div>
                      {r.name}
                    </div>
                  </Td>
                  <Td>{r.desc}</Td>
                  <Td><span style={{ fontWeight: 600, color: "#B8405E" }}>{userCounts.get(r.name) ?? 0}</span> usuarios</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span><span style={{ fontWeight: 600, color: "#221F20" }}>{r.perms.length}</span> permisos</span>
                      <IconBtn icon={<IcoShield />} onClick={() => open("perms", r)} variant="primary" title="Gestionar permisos" />
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button type="button" role="switch" aria-checked={r.active} aria-label={r.active ? "Inactivar rol" : "Activar rol"} onClick={() => toggleStatus(r.id)} style={{ width: "38px", height: "22px", border: "none", borderRadius: "999px", background: r.active ? "#16A765" : "#D4D4D8", padding: "3px", cursor: "pointer", flexShrink: 0 }}>
                        <span style={{ display: "block", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transform: r.active ? "translateX(16px)" : "translateX(0)", transition: "transform 0.18s" }} />
                      </button>
                      <Badge label={r.active ? "Activo" : "Inactivo"} />
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <IconBtn icon={<IcoEdit />} onClick={() => open("edit", r)} variant="primary" title="Editar" />
                      <IconBtn icon={<IcoTrash />} onClick={() => open("delete", r)} variant="danger" title="Eliminar" />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nuevo Rol" : "Editar Rol"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <FormRow label="Nombre del rol" required>
              <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej. Recepcionista" />
            </FormRow>
            <FormRow label="Descripción">
              <Textarea value={form.desc} onChange={v => setForm(f => ({ ...f, desc: v }))} placeholder="Describe las responsabilidades de este rol..." />
            </FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Crear Rol" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail Modal */}
      {modal === "detail" && selected && (
        <Modal title="Detalle del Rol" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
            <DetailRow label="ID" value={selected.id} />
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Descripción" value={selected.desc} />
            <DetailRow label="Usuarios asignados" value={`${userCounts.get(selected.name) ?? 0} usuarios`} />
            <DetailRow label="Estado" value={<Badge label={selected.active ? "Activo" : "Inactivo"} />} />
          </div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#221F20", marginBottom: "10px" }}>Permisos asignados ({selected.perms.length})</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selected.perms.map(p => (
              <span key={p} style={{ fontSize: "11px", background: "#FCE8EE", color: "#B8405E", padding: "3px 10px", borderRadius: "999px", fontWeight: 500 }}>{p}</span>
            ))}
          </div>
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #E4E4E7", display: "flex", justifyContent: "flex-end" }}>
            <GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn>
          </div>
        </Modal>
      )}

      {/* Permissions Modal */}
      {modal === "perms" && selected && (
        <Modal title={`Permisos — ${selected.name}`} onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {ALL_PERMS.map(group => {
              const allOn = group.items.every(p => selectedPerms.includes(p));
              const someOn = group.items.some(p => selectedPerms.includes(p));
              return (
                <div key={group.group}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#221F20", textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.group}</span>
                    <button onClick={() => toggleGroup(group.items)}
                      style={{ fontSize: "11px", color: "#B8405E", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      {allOn ? "Quitar todos" : "Seleccionar todos"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                    {group.items.map(p => {
                      const on = selectedPerms.includes(p);
                      return (
                        <label key={p} onClick={() => togglePerm(p)}
                          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", border: `1.5px solid ${on ? "#E88099" : "#E4E4E7"}`, borderRadius: "8px", cursor: "pointer", background: on ? "#FCE8EE" : "#FAFAFA", transition: "all 0.15s" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: on ? "#E88099" : "#FFFFFF", border: `1.5px solid ${on ? "#E88099" : "#E4E4E7"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", flexShrink: 0, transition: "all 0.15s" }}>
                            {on && <IcoCheck />}
                          </div>
                          <span style={{ fontSize: "12px", color: on ? "#B8405E" : "#71717A", fontWeight: on ? 600 : 400 }}>{p}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={savePerms} confirmLabel={`Guardar permisos (${selectedPerms.length})`} />
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === "delete" && selected && (
        <Modal title="Eliminar Rol" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#B91C1C" }}><IcoTrash /></div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#221F20", marginBottom: "8px" }}>¿Eliminar el rol "{selected.name}"?</p>
            <p style={{ fontSize: "13px", color: "#71717A" }}>Esta acción no se puede deshacer. Asegúrate de que no haya usuarios activos con este rol.</p>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={deleteRole} confirmLabel="Sí, eliminar" danger />
        </Modal>
      )}
    </div>
  );
}

function IcoCheck() {
  return <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
}
