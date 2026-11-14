import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Textarea, ModalActions, DetailRow, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoTrash, IcoClock } from "../components/ui";
import { removeEmployeeAccount, syncEmployeeAccount } from "../data/userDirectory";

type Employee = { id: string; name: string; doc: string; phone: string; email: string; role: string; specialties: string[]; active: boolean; hiredAt: string; notes: string };
type EmployeeForm = Omit<Employee, "id" | "active" | "hiredAt">;

const SPECIALTY_OPTIONS = [
  { label: "Manicure", value: "Manicure" },
  { label: "Pedicure", value: "Pedicure" },
  { label: "Nail Art", value: "Nail Art" },
  { label: "Extensión Acrílica", value: "Extensión" },
  { label: "Gel Semipermanente", value: "Gel" },
];

const INITIAL: Employee[] = [
  { id: "E-001", name: "Andrea López", doc: "1.023.456.789", phone: "300 111 2222", email: "andrea@ekoplus.co", role: "Nail Artist Senior", specialties: ["Nail Art"], active: true, hiredAt: "15 Mar 2024", notes: "" },
  { id: "E-002", name: "Camila Reyes", doc: "1.024.567.890", phone: "301 333 4444", email: "camila@ekoplus.co", role: "Manicurista", specialties: ["Manicure"], active: true, hiredAt: "20 Abr 2024", notes: "Especialista en diseños minimalistas" },
  { id: "E-003", name: "Juliana Mora", doc: "1.025.678.901", phone: "310 555 6666", email: "juliana@ekoplus.co", role: "Especialista Gel", specialties: ["Gel"], active: true, hiredAt: "05 May 2024", notes: "" },
  { id: "E-004", name: "Paola Sierra", doc: "1.026.789.012", phone: "312 777 8888", email: "paola@ekoplus.co", role: "Pedicurista", specialties: ["Pedicure"], active: false, hiredAt: "10 Jun 2024", notes: "Incapacidad médica" },
];

const EMPTY: EmployeeForm = { name: "", doc: "", phone: "", email: "", role: "", specialties: ["Manicure"], notes: "" };
type ModalMode = "create" | "edit" | "detail" | "availability" | "delete" | null;

const SCHED: Record<string, { avail: boolean; note: string }[]> = {
  "E-001": [true, true, true, true, true, false, false].map((a, i) => ({ avail: a, note: a ? "08:00–17:00" : "No disponible" })),
  "E-002": [true, false, true, false, true, true, false].map((a, i) => ({ avail: a, note: a ? "09:00–18:00" : "No disponible" })),
  "E-003": [false, true, false, true, false, true, false].map((a, i) => ({ avail: a, note: a ? "10:00–19:00" : "No disponible" })),
  "E-004": [false, false, false, false, false, false, false].map(_ => ({ avail: false, note: "Incapacidad" })),
};
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = localStorage.getItem("eko-employees");
    if (!stored) return INITIAL;
    try {
      return JSON.parse(stored) as Employee[];
    } catch (error) {
      console.error("No se pudo leer el listado de empleadas guardado.", error);
      return INITIAL;
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterSpecialty, setFilterSpecialty] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>({ ...EMPTY });

  useEffect(() => localStorage.setItem("eko-employees", JSON.stringify(employees)), [employees]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.doc.includes(search) || e.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || (filterStatus === "Activo" ? e.active : !e.active);
    const matchSpec = filterSpecialty === "Todos" || e.specialties.includes(filterSpecialty);
    return matchSearch && matchStatus && matchSpec;
  });

  const open = (mode: ModalMode, emp?: Employee) => {
    setSelected(emp ?? null);
    if (mode === "create") setForm({ ...EMPTY });
    if (mode === "edit" && emp) setForm({ name: emp.name, doc: emp.doc, phone: emp.phone, email: emp.email, role: emp.role, specialties: [...emp.specialties], notes: emp.notes });
    setModal(mode);
  };

  const save = () => {
    if (modal === "create") {
      const ne: Employee = { id: `E-00${employees.length + 1}`, ...form, active: true, hiredAt: "14 Sep 2026" };
      setEmployees(p => [...p, ne]);
      syncEmployeeAccount(ne);
    } else if (modal === "edit" && selected) {
      const updatedEmployee = { ...selected, ...form };
      setEmployees(p => p.map(e => e.id === selected.id ? updatedEmployee : e));
      syncEmployeeAccount(updatedEmployee);
    }
    setModal(null);
  };

  const toggleStatus = (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;
    const updatedEmployee = { ...employee, active: !employee.active };
    setEmployees(p => p.map(e => e.id === id ? updatedEmployee : e));
    syncEmployeeAccount(updatedEmployee);
  };
  const deleteEmp = () => {
    if (selected) {
      setEmployees(p => p.filter(e => e.id !== selected.id));
      removeEmployeeAccount(selected);
    }
    setModal(null);
  };
  const f = (k: Exclude<keyof EmployeeForm, "specialties">) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleSpecialty = (specialty: string) => setForm(p => ({
    ...p,
    specialties: p.specialties.includes(specialty)
      ? p.specialties.length > 1 ? p.specialties.filter(s => s !== specialty) : p.specialties
      : [...p.specialties, specialty],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Empleadas" desc="Gestiona el equipo de trabajo del spa de uñas">
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nueva Empleada</PrimaryBtn>
      </PageHeader>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, documento o email..." />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["Todos", "Activo", "Inactivo"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
          <div style={{ width: "1px", background: "#E4E4E7", margin: "0 4px" }} />
          {["Todos", "Manicure", "Pedicure", "Nail Art", "Gel"].map(s => <FilterPill key={s} label={s} active={filterSpecialty === s} onClick={() => setFilterSpecialty(s)} />)}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {filtered.map(emp => (
          <div key={emp.id} style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", padding: "22px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0px 8px 24px rgba(0,0,0,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.05)")}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <Avatar name={emp.name} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{emp.name}</div>
                <div style={{ fontSize: "12px", color: "#71717A" }}>{emp.role}</div>
              </div>
              <Badge label={emp.active ? "Activa" : "Inactiva"} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", borderTop: "1px solid #E4E4E7", paddingTop: "12px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: "#71717A" }}>Servicios</span><span style={{ fontSize: "12px", fontWeight: 500, color: "#221F20", textAlign: "right" }}>{emp.specialties.join(", ")}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: "#71717A" }}>Teléfono</span><span style={{ fontSize: "12px", fontWeight: 500, color: "#221F20" }}>{emp.phone}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: "#71717A" }}>Email</span><span style={{ fontSize: "12px", color: "#B8405E" }}>{emp.email}</span></div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <IconBtn icon={<IcoEye />} onClick={() => open("detail", emp)} title="Ver detalle" />
              <IconBtn icon={<IcoEdit />} onClick={() => open("edit", emp)} variant="primary" title="Editar" />
              <button onClick={() => open("availability", emp)}
                style={{ flex: 1, padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, border: "1px solid #E4E4E7", background: "#F9F9FB", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <IcoClock /> Disponibilidad
              </button>
              <button type="button" role="switch" aria-checked={emp.active} aria-label="Cambiar estado" title="Cambiar estado" onClick={() => toggleStatus(emp.id)}
                style={{ width: "38px", height: "22px", border: "none", borderRadius: "999px", background: emp.active ? "#16A765" : "#D4D4D8", padding: "3px", cursor: "pointer", flexShrink: 0 }}>
                <span style={{ display: "block", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transform: emp.active ? "translateX(16px)" : "translateX(0)", transition: "transform 0.18s" }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nueva Empleada" : "Editar Empleada"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormRow label="Nombre completo" required><Input value={form.name} onChange={f("name")} placeholder="Ej. Laura Martínez" /></FormRow>
            <FormRow label="Documento de identidad" required><Input value={form.doc} onChange={f("doc")} placeholder="1.234.567.890" /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Teléfono"><Input value={form.phone} onChange={f("phone")} placeholder="300 000 0000" /></FormRow>
              <FormRow label="Email"><Input value={form.email} onChange={f("email")} placeholder="correo@ekoplus.co" type="email" /></FormRow>
            </div>
            <FormRow label="Cargo"><Input value={form.role} onChange={f("role")} placeholder="Ej. Nail Artist" /></FormRow>
            <FormRow label="Servicios que realiza" required>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {SPECIALTY_OPTIONS.map(option => (
                  <label key={option.value} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 10px", border: "1px solid #E4E4E7", borderRadius: "8px", fontSize: "12px", color: "#221F20", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.specialties.includes(option.value)} onChange={() => toggleSpecialty(option.value)} />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormRow>
            <FormRow label="Observaciones"><Textarea value={form.notes} onChange={f("notes")} placeholder="Notas relevantes sobre la empleada..." /></FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Registrar Empleada" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle de Empleada" onClose={() => setModal(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 0 20px", borderBottom: "1px solid #E4E4E7", marginBottom: "12px" }}>
            <Avatar name={selected.name} size={52} />
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{selected.name}</p>
              <p style={{ fontSize: "12px", color: "#71717A" }}>{selected.role} · {selected.specialties.join(", ")}</p>
            </div>
          </div>
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Documento" value={selected.doc} />
          <DetailRow label="Teléfono" value={selected.phone} />
          <DetailRow label="Email" value={selected.email} />
          <DetailRow label="Estado" value={<Badge label={selected.active ? "Activa" : "Inactiva"} />} />
          <DetailRow label="Fecha de ingreso" value={selected.hiredAt} />
          {selected.notes && <DetailRow label="Notas" value={selected.notes} />}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

      {/* Availability */}
      {modal === "availability" && selected && (
        <Modal title={`Disponibilidad — ${selected.name}`} onClose={() => setModal(null)}>
          <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "16px" }}>Disponibilidad semanal actual según horario asignado.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {DAYS.map((d, i) => {
              const slot = SCHED[selected.id]?.[i] ?? { avail: false, note: "—" };
              return (
                <div key={d} style={{ borderRadius: "10px", padding: "10px 6px", background: slot.avail ? "#FCE8EE" : "#F9F9FB", border: `1px solid ${slot.avail ? "#F0C4D0" : "#E4E4E7"}`, textAlign: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: slot.avail ? "#B8405E" : "#71717A", marginBottom: "6px" }}>{d}</div>
                  <div style={{ fontSize: "9px", color: slot.avail ? "#B8405E" : "#71717A", lineHeight: 1.4 }}>{slot.note}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}
    </div>
  );
}
