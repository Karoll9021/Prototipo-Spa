import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Textarea, ModalActions, DetailRow, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoToggle, IcoTrash } from "../components/ui";
import { useToast } from "../components/feedback";
import { nextPrefixedId, readTable, splitFullName, toDatabaseDateTime, usePersistentState, writeTable, type CitaRow, type ClienteRow } from "../data/prototypeDatabase";

type Client = { id: string; name: string; doc: string; phone: string; email: string; notes: string; visits: number; lastVisit: string; active: boolean; createdAt: string };

const INITIAL: Client[] = [
  { id: "CL-001", name: "Valentina Torres", doc: "1.001.234.567", phone: "300 123 4567", email: "val.torres@gmail.com", notes: "Prefiere esmaltes nude y rosados", visits: 12, lastVisit: "14 Sep 2026", active: true, createdAt: "10 Ene 2026" },
  { id: "CL-002", name: "Isabella Ramírez", doc: "1.002.345.678", phone: "301 987 6543", email: "isa.ram@gmail.com", notes: "", visits: 8, lastVisit: "12 Sep 2026", active: true, createdAt: "15 Feb 2026" },
  { id: "CL-003", name: "Sofía Mendoza", doc: "1.003.456.789", phone: "310 456 7890", email: "sofi.mz@gmail.com", notes: "Alérgica a ciertos esmaltes, usar línea orgánica", visits: 5, lastVisit: "10 Sep 2026", active: true, createdAt: "03 Mar 2026" },
  { id: "CL-004", name: "Mariana Castillo", doc: "1.004.567.890", phone: "315 234 5678", email: "mari.cas@gmail.com", notes: "", visits: 20, lastVisit: "14 Sep 2026", active: true, createdAt: "20 Ene 2026" },
  { id: "CL-005", name: "Gabriela Vargas", doc: "1.005.678.901", phone: "312 876 5432", email: "gabi.v@gmail.com", notes: "", visits: 3, lastVisit: "05 Sep 2026", active: false, createdAt: "01 Jul 2026" },
  { id: "CL-006", name: "Paula Jiménez", doc: "1.006.789.012", phone: "318 345 6789", email: "pau.jim@gmail.com", notes: "Citas cada 3 semanas", visits: 15, lastVisit: "10 Sep 2026", active: true, createdAt: "12 Feb 2026" },
  { id: "CL-007", name: "Natalia Ospina", doc: "1.007.890.123", phone: "320 654 3210", email: "nati.os@gmail.com", notes: "", visits: 4, lastVisit: "02 Sep 2026", active: true, createdAt: "15 Jun 2026" },
];

const EMPTY = { name: "", doc: "", phone: "", email: "", notes: "" };
type ModalMode = "create" | "edit" | "detail" | "delete" | null;

export default function ClientsView() {
  const [clients, setClients] = usePersistentState<Client[]>("eko-clients", INITIAL);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const toast = useToast();

  useEffect(() => {
    const rows: ClienteRow[] = clients.map(client => ({
      id: client.id,
      ...splitFullName(client.name),
      telefono: client.phone,
      email: client.email,
      activo: client.active,
      fechaRegistro: toDatabaseDateTime(client.createdAt),
    }));
    writeTable("cliente", rows);
  }, [clients]);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.doc.includes(search) || c.phone.includes(search) || c.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || (filterStatus === "Activo" ? c.active : !c.active);
    return matchSearch && matchStatus;
  });

  const open = (mode: ModalMode, cl?: Client) => {
    setSelected(cl ?? null);
    if (mode === "create") setForm({ ...EMPTY });
    if (mode === "edit" && cl) setForm({ name: cl.name, doc: cl.doc, phone: cl.phone, email: cl.email, notes: cl.notes });
    setModal(mode);
  };

  const save = () => {
    if (!form.name.trim() || (form.email && !/\S+@\S+\.\S+/.test(form.email))) {
      toast.show("error", "Ingresa el nombre y un correo válido");
      return;
    }
    if (modal === "create") {
      const nc: Client = { id: nextPrefixedId("CL-", clients.map(client => client.id)), ...form, visits: 0, lastVisit: "—", active: true, createdAt: new Date().toLocaleDateString("es-CO") };
      setClients(p => [...p, nc]);
    } else if (modal === "edit" && selected) {
      setClients(p => p.map(c => c.id === selected.id ? { ...c, ...form } : c));
    }
    setModal(null);
  };

  const toggleStatus = (id: string) => setClients(p => p.map(c => c.id === id ? { ...c, active: !c.active } : c));
  const deleteClient = () => {
    if (!selected) return;
    const hasAppointments = readTable<CitaRow>("cita", []).some(appointment => appointment.clienteId === selected.id);
    if (hasAppointments) {
      setClients(current => current.map(client => client.id === selected.id ? { ...client, active: false } : client));
      toast.show("warning", "La clienta tiene citas asociadas; se inactivó para conservar el historial");
    } else {
      setClients(current => current.filter(client => client.id !== selected.id));
      toast.show("success", "Clienta eliminada");
    }
    setModal(null);
  };
  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Clientes" desc="Directorio de clientas y su historial en el spa">
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nueva Clienta</PrimaryBtn>
      </PageHeader>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {[
          { label: "Total Clientas", val: clients.length, color: "#FCE8EE" },
          { label: "Clientas Activas", val: clients.filter(c => c.active).length, color: "#DCFCE7" },
          { label: "Visitas Totales", val: clients.reduce((a, c) => a + c.visits, 0), color: "#E0F2FE" },
          { label: "Clientas VIP (10+)", val: clients.filter(c => c.visits >= 10).length, color: "#FEF3C7" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", padding: "16px 18px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: s.color, marginBottom: "10px" }} />
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: "11px", color: "#71717A", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, documento, teléfono o email..." />
        <div style={{ display: "flex", gap: "6px" }}>
          {["Todos", "Activo", "Inactivo"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
        </div>
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Cliente</Th><Th>Documento</Th><Th>Teléfono</Th><Th>Visitas</Th><Th>Última visita</Th><Th>Estado</Th><Th>Acciones</Th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", c)} title="Ver detalle" />
                      <Avatar name={c.name} size={34} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "#71717A" }}>{c.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{c.doc}</Td>
                  <Td>{c.phone}</Td>
                  <Td>
                    <span style={{ fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{c.visits}</span>
                    {c.visits >= 10 && <span style={{ marginLeft: "6px", fontSize: "10px", background: "#FEF3C7", color: "#B45309", padding: "2px 6px", borderRadius: "999px", fontWeight: 600 }}>VIP</span>}
                  </Td>
                  <Td>{c.lastVisit}</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button type="button" role="switch" aria-checked={c.active} aria-label="Cambiar estado" title="Cambiar estado" onClick={() => toggleStatus(c.id)}
                        style={{ width: "38px", height: "22px", border: "none", borderRadius: "999px", background: c.active ? "#16A765" : "#D4D4D8", padding: "3px", cursor: "pointer", flexShrink: 0 }}>
                        <span style={{ display: "block", width: "16px", height: "16px", borderRadius: "50%", background: "#FFFFFF", transform: c.active ? "translateX(16px)" : "translateX(0)", transition: "transform 0.18s" }} />
                      </button>
                      <Badge label={c.active ? "Activa" : "Inactiva"} />
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <IconBtn icon={<IcoEdit />} onClick={() => open("edit", c)} variant="primary" title="Editar" />
                      <IconBtn icon={<IcoTrash />} onClick={() => open("delete", c)} variant="danger" title="Eliminar" />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nueva Clienta" : "Editar Clienta"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormRow label="Nombre completo" required><Input value={form.name} onChange={f("name")} placeholder="Ej. María Alejandra López" /></FormRow>
            <FormRow label="Documento de identidad"><Input value={form.doc} onChange={f("doc")} placeholder="1.234.567.890" /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Teléfono" required><Input value={form.phone} onChange={f("phone")} placeholder="300 000 0000" /></FormRow>
              <FormRow label="Correo electrónico"><Input value={form.email} onChange={f("email")} placeholder="correo@gmail.com" type="email" /></FormRow>
            </div>
            <FormRow label="Observaciones"><Textarea value={form.notes} onChange={f("notes")} placeholder="Alergias, preferencias, notas importantes..." /></FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Registrar Clienta" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle de Clienta" onClose={() => setModal(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 0 20px", borderBottom: "1px solid #E4E4E7", marginBottom: "12px" }}>
            <Avatar name={selected.name} size={52} />
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{selected.name}</p>
              <p style={{ fontSize: "12px", color: "#71717A" }}>{selected.visits} visitas · Cliente desde {selected.createdAt}</p>
            </div>
          </div>
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Documento" value={selected.doc} />
          <DetailRow label="Teléfono" value={selected.phone} />
          <DetailRow label="Email" value={selected.email} />
          <DetailRow label="Última visita" value={selected.lastVisit} />
          <DetailRow label="Estado" value={<Badge label={selected.active ? "Activa" : "Inactiva"} />} />
          {selected.notes && (
            <div style={{ marginTop: "14px", padding: "12px", background: "#FCE8EE", borderRadius: "8px" }}>
              <p style={{ fontSize: "11px", color: "#B8405E", fontWeight: 700, marginBottom: "4px" }}>OBSERVACIONES</p>
              <p style={{ fontSize: "13px", color: "#221F20", lineHeight: 1.6 }}>{selected.notes}</p>
            </div>
          )}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

      {/* Delete */}
      {modal === "delete" && selected && (
        <Modal title="Eliminar Clienta" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#B91C1C" }}><IcoTrash /></div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#221F20", marginBottom: "8px" }}>¿Eliminar a "{selected.name}"?</p>
            <p style={{ fontSize: "13px", color: "#71717A" }}>Solo se podrá eliminar si no tiene citas, pagos o servicios asociados.</p>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={deleteClient} confirmLabel="Sí, eliminar" danger />
        </Modal>
      )}
    </div>
  );
}
