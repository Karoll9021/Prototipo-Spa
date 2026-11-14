import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Select, Textarea, ModalActions, DetailRow, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoToggle } from "../components/ui";
import { useToast } from "../components/feedback";
import { nextPrefixedId, readTable, toDatabaseDateTime, usePersistentState, writeTable, type ServicioRow } from "../data/prototypeDatabase";

type Service = { id: string; name: string; desc: string; duration: string; price: string; specialty: string; active: boolean };

const SERVICE_IMAGES: Record<string, string> = {
  "Manicure Clásico": "/services/manicure-clasico.png",
  "Manicure Spa": "/services/manicure-spa.jpg",
  "Nail Art Gel": "/services/nail-art-gel.webp",
  "Pedicure Clásico": "/services/pedicure-clasico.webp",
  "Uñas Acrílicas": "/services/unas-acrilicas.jpg",
  "Gel Semipermanente": "/services/gel-semipermanente.jpg",
  "Pedicure Spa": "/services/pedicure-spa.webp",
  "Nail Art Premium": "/services/nail-art-premium.jpg",
};

const SPECIALTY_OPTIONS = [
  { label: "Manicure", value: "Manicure" },
  { label: "Pedicure", value: "Pedicure" },
  { label: "Nail Art", value: "Nail Art" },
  { label: "Extensión", value: "Extensión" },
  { label: "Gel", value: "Gel" },
  { label: "Otro", value: "Otro" },
];

const INITIAL: Service[] = [
  { id: "S-001", name: "Manicure Clásico", desc: "Limpieza, forma y esmalte tradicional", duration: "45", price: "25000", specialty: "Manicure", active: true },
  { id: "S-002", name: "Manicure Spa", desc: "Exfoliación, masaje e hidratación profunda", duration: "60", price: "35000", specialty: "Manicure", active: true },
  { id: "S-003", name: "Nail Art Gel", desc: "Diseños personalizados en gel semipermanente", duration: "75", price: "55000", specialty: "Nail Art", active: true },
  { id: "S-004", name: "Pedicure Clásico", desc: "Limpieza, forma y esmalte en pies", duration: "50", price: "28000", specialty: "Pedicure", active: true },
  { id: "S-005", name: "Uñas Acrílicas", desc: "Extensión de uñas con polvo acrílico", duration: "90", price: "80000", specialty: "Extensión", active: true },
  { id: "S-006", name: "Gel Semipermanente", desc: "Esmalte en gel de larga duración", duration: "60", price: "45000", specialty: "Gel", active: false },
  { id: "S-007", name: "Pedicure Spa", desc: "Exfoliación, masaje de pies e hidratación", duration: "70", price: "42000", specialty: "Pedicure", active: true },
  { id: "S-008", name: "Nail Art Premium", desc: "Diseños complejos con piedras y decoraciones", duration: "120", price: "95000", specialty: "Nail Art", active: true },
];

const EMPTY = { name: "", desc: "", duration: "", price: "", specialty: "Manicure" };
type ModalMode = "create" | "edit" | "detail" | null;

const fmt = (price: string) => `$${parseInt(price).toLocaleString("es-CO")}`;

export default function ServicesView() {
  const [services, setServices] = usePersistentState<Service[]>("eko-services", INITIAL);
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const toast = useToast();

  useEffect(() => {
    const now = toDatabaseDateTime();
    const existing = new Map(readTable<ServicioRow>("servicio", []).map(service => [service.id, service]));
    const rows: ServicioRow[] = services.map(service => ({
      id: Number(service.id.replace(/\D/g, "")),
      nombre: service.name,
      precio: Number(service.price),
      duracionEstimada: Number(service.duration),
      activo: service.active,
      fechaCreacion: existing.get(Number(service.id.replace(/\D/g, "")))?.fechaCreacion ?? now,
      fechaActualizacion: now,
    }));
    writeTable("servicio", rows);
  }, [services]);

  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q);
    const matchSpec = filterSpecialty === "Todos" || s.specialty === filterSpecialty;
    const matchStatus = filterStatus === "Todos" || (filterStatus === "Activo" ? s.active : !s.active);
    return matchSearch && matchSpec && matchStatus;
  });

  const open = (mode: ModalMode, svc?: Service) => {
    setSelected(svc ?? null);
    if (mode === "create") setForm({ ...EMPTY });
    if (mode === "edit" && svc) setForm({ name: svc.name, desc: svc.desc, duration: svc.duration, price: svc.price, specialty: svc.specialty });
    setModal(mode);
  };

  const save = () => {
    const price = Number(form.price);
    const duration = Number(form.duration);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(duration) || duration <= 0) {
      toast.show("error", "Ingresa nombre, precio mayor a cero y duración en minutos");
      return;
    }
    if (modal === "create") {
      const ns: Service = { id: nextPrefixedId("S-", services.map(service => service.id)), ...form, active: true };
      setServices(p => [...p, ns]);
    } else if (modal === "edit" && selected) {
      setServices(p => p.map(s => s.id === selected.id ? { ...s, ...form } : s));
    }
    setModal(null);
  };

  const toggleStatus = (id: string) => setServices(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const IcoGrid = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  const IcoList = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
  const IcoScissors = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Catálogo de Servicios" desc="Gestiona los servicios disponibles en el establecimiento">
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setViewMode("grid")} style={{ width: "34px", height: "34px", borderRadius: "8px", border: viewMode === "grid" ? "1.5px solid #E88099" : "1px solid #E4E4E7", background: viewMode === "grid" ? "#FCE8EE" : "#FFFFFF", color: viewMode === "grid" ? "#B8405E" : "#71717A", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><IcoGrid /></button>
          <button onClick={() => setViewMode("table")} style={{ width: "34px", height: "34px", borderRadius: "8px", border: viewMode === "table" ? "1.5px solid #E88099" : "1px solid #E4E4E7", background: viewMode === "table" ? "#FCE8EE" : "#FFFFFF", color: viewMode === "table" ? "#B8405E" : "#71717A", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><IcoList /></button>
          <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nuevo Servicio</PrimaryBtn>
        </div>
      </PageHeader>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar servicio o especialidad..." />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["Todos", "Activo", "Inactivo"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
          <div style={{ width: "1px", background: "#E4E4E7", margin: "0 4px" }} />
          {["Todos", "Manicure", "Pedicure", "Nail Art", "Extensión", "Gel"].map(s => <FilterPill key={s} label={s} active={filterSpecialty === s} onClick={() => setFilterSpecialty(s)} />)}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "16px" }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", padding: "20px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0px 8px 24px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.05)")}>
              <div style={{ position: "relative", margin: "-20px -20px 14px", height: "150px", overflow: "hidden", borderRadius: "12px 12px 0 0", background: "#FCE8EE" }}>
                {SERVICE_IMAGES[s.name]
                  ? <img src={SERVICE_IMAGES[s.name]} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#B8405E" }}><IcoScissors /></div>}
                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                  <Badge label={s.active ? "Activo" : "Inactivo"} />
                </div>
              </div>
              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "14px", fontWeight: 600, color: "#221F20", marginBottom: "4px" }}>{s.name}</h3>
              <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "12px", lineHeight: 1.5 }}>{s.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E4E4E7", paddingTop: "12px", marginBottom: "14px" }}>
                <div><span style={{ fontSize: "10px", color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Duración</span><div style={{ fontSize: "13px", fontWeight: 600, color: "#221F20" }}>{s.duration} min</div></div>
                <div style={{ textAlign: "right" }}><span style={{ fontSize: "10px", color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precio</span><div style={{ fontSize: "15px", fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{fmt(s.price)}</div></div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <IconBtn icon={<IcoEye />} onClick={() => open("detail", s)} title="Ver detalle" />
                <IconBtn icon={<IcoEdit />} onClick={() => open("edit", s)} variant="primary" title="Editar" />
                <button onClick={() => toggleStatus(s.id)}
                  style={{ flex: 1, padding: "6px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, border: "1px solid #E4E4E7", background: s.active ? "#F9F9FB" : "#FCE8EE", color: s.active ? "#71717A" : "#B8405E", cursor: "pointer" }}>
                  {s.active ? "Inactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>ID</Th><Th>Servicio</Th><Th>Especialidad</Th><Th>Duración</Th><Th>Precio</Th><Th>Estado</Th><Th>Acciones</Th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Td><span style={{ fontSize: "11px", fontWeight: 600, color: "#71717A" }}>{s.id}</span></Td>
                    <Td style={{ color: "#221F20", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {SERVICE_IMAGES[s.name] && <img src={SERVICE_IMAGES[s.name]} alt="" style={{ width: "48px", height: "42px", objectFit: "cover", borderRadius: "7px", flexShrink: 0 }} />}
                        <div><div style={{ fontWeight: 500, color: "#221F20" }}>{s.name}</div><div style={{ fontSize: "11px", color: "#71717A" }}>{s.desc}</div></div>
                      </div>
                    </Td>
                    <Td><span style={{ fontSize: "11px", background: "#F4F4F5", padding: "3px 10px", borderRadius: "999px", fontWeight: 500, color: "#52525B" }}>{s.specialty}</span></Td>
                    <Td>{s.duration} min</Td>
                    <Td style={{ fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{fmt(s.price)}</Td>
                    <Td><Badge label={s.active ? "Activo" : "Inactivo"} /></Td>
                    <Td>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <IconBtn icon={<IcoEye />} onClick={() => open("detail", s)} title="Ver detalle" />
                        <IconBtn icon={<IcoEdit />} onClick={() => open("edit", s)} variant="primary" title="Editar" />
                        <IconBtn icon={<IcoToggle />} onClick={() => toggleStatus(s.id)} title="Cambiar estado" />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Nuevo Servicio" : "Editar Servicio"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormRow label="Nombre del servicio" required><Input value={form.name} onChange={f("name")} placeholder="Ej. Manicure Express" /></FormRow>
            <FormRow label="Descripción"><Textarea value={form.desc} onChange={f("desc")} placeholder="Describe el servicio..." /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Duración estimada (min)" required><Input value={form.duration} onChange={f("duration")} placeholder="60" /></FormRow>
              <FormRow label="Precio (COP)" required><Input value={form.price} onChange={f("price")} placeholder="35000" /></FormRow>
            </div>
            <FormRow label="Especialidad requerida" required><Select value={form.specialty} onChange={f("specialty")} options={SPECIALTY_OPTIONS} /></FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Crear Servicio" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle del Servicio" onClose={() => setModal(null)}>
          {SERVICE_IMAGES[selected.name] && <img src={SERVICE_IMAGES[selected.name]} alt={selected.name} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }} />}
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Nombre" value={selected.name} />
          <DetailRow label="Especialidad" value={selected.specialty} />
          <DetailRow label="Duración" value={`${selected.duration} minutos`} />
          <DetailRow label="Precio" value={<span style={{ fontWeight: 700, color: "#B8405E" }}>{fmt(selected.price)}</span>} />
          <DetailRow label="Estado" value={<Badge label={selected.active ? "Activo" : "Inactivo"} />} />
          <div style={{ marginTop: "14px", padding: "12px", background: "#F9F9FB", borderRadius: "8px" }}>
            <p style={{ fontSize: "11px", color: "#71717A", fontWeight: 600, marginBottom: "4px" }}>DESCRIPCIÓN</p>
            <p style={{ fontSize: "13px", color: "#221F20", lineHeight: 1.6 }}>{selected.desc}</p>
          </div>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}
    </div>
  );
}
