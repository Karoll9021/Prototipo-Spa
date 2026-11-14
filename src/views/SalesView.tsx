import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Select, ModalActions, DetailRow, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoDownload, IcoX } from "../components/ui";
import { useToast } from "../components/feedback";
import { downloadCsv, nextPrefixedId, readTable, usePersistentState, writeTable, type DevolucionRow, type DetallePagoRow, type MetodoPagoRow, type PagoRow } from "../data/prototypeDatabase";

type SaleStatus = "Pagada" | "Pendiente" | "Anulada";

type Sale = {
  id: string; client: string; appointmentId: string; service: string; employee: string;
  date: string; time: string; price: number; discount: number; payMethod: string;
  status: SaleStatus; notes: string;
};

const SERVICES = ["Manicure Clásico", "Manicure Spa", "Nail Art Gel", "Pedicure Clásico", "Uñas Acrílicas", "Gel Semipermanente", "Pedicure Spa", "Nail Art Premium"];
const EMPLOYEES = ["Andrea López", "Camila Reyes", "Juliana Mora"];
const PAY_METHODS = ["Efectivo", "Tarjeta débito", "Tarjeta crédito", "Transferencia", "Nequi", "Daviplata"];
const CLIENTS = ["Valentina Torres", "Isabella Ramírez", "Sofía Mendoza", "Mariana Castillo", "Paula Jiménez", "Natalia Ospina", "Daniela Gutiérrez"];

const INITIAL: Sale[] = [
  { id: "V-001", client: "Valentina Torres", appointmentId: "C-001", service: "Manicure Spa", employee: "Andrea López", date: "2026-09-14", time: "10:15", price: 35000, discount: 0, payMethod: "Nequi", status: "Pagada", notes: "" },
  { id: "V-002", client: "Mariana Castillo", appointmentId: "C-004", service: "Uñas Acrílicas", employee: "Andrea López", date: "2026-09-14", time: "13:30", price: 80000, discount: 5000, payMethod: "Efectivo", status: "Pagada", notes: "Descuento cliente frecuente" },
  { id: "V-003", client: "Isabella Ramírez", appointmentId: "C-002", service: "Nail Art Gel", employee: "Camila Reyes", date: "2026-09-14", time: "12:00", price: 55000, discount: 0, payMethod: "Tarjeta débito", status: "Pendiente", notes: "" },
  { id: "V-004", client: "Paula Jiménez", appointmentId: "C-006", service: "Gel Semipermanente", employee: "Juliana Mora", date: "2026-09-13", time: "16:45", price: 45000, discount: 0, payMethod: "Transferencia", status: "Pagada", notes: "" },
  { id: "V-005", client: "Sofía Mendoza", appointmentId: "C-003", service: "Pedicure Clásico", employee: "Juliana Mora", date: "2026-09-12", time: "11:50", price: 28000, discount: 0, payMethod: "Efectivo", status: "Anulada", notes: "Cliente canceló el pago" },
  { id: "V-006", client: "Natalia Ospina", appointmentId: "C-007", service: "Manicure Spa", employee: "Andrea López", date: "2026-09-11", time: "10:00", price: 35000, discount: 0, payMethod: "Daviplata", status: "Pagada", notes: "" },
];

type AppointmentOption = { id: string; client: string; service: string[]; employee: string; date: string; time: string; status: string };
const APPOINTMENTS_FALLBACK: AppointmentOption[] = [...new Map(INITIAL.map(sale => [sale.appointmentId, {
  id: sale.appointmentId,
  client: sale.client,
  service: [sale.service],
  employee: sale.employee,
  date: sale.date,
  time: sale.time,
  status: sale.status === "Anulada" ? "Atendida" : sale.status === "Pendiente" ? "Confirmada" : "Atendida",
}])).values()];
const EMPTY = { client: "", appointmentId: APPOINTMENTS_FALLBACK[0]?.id ?? "", service: "", employee: "", date: "", time: "", price: "", discount: "0", payMethod: "Efectivo", notes: "" };
type ModalMode = "create" | "edit" | "detail" | "void" | null;

const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

export default function SalesView() {
  const [sales, setSales] = usePersistentState<Sale[]>("eko-sales", INITIAL);
  const [appointmentOptions] = useState<AppointmentOption[]>(() => {
    const stored = localStorage.getItem("eko-appointments");
    if (!stored) return APPOINTMENTS_FALLBACK;
    try {
      return JSON.parse(stored) as AppointmentOption[];
    } catch (error) {
      console.error("No se pudieron leer las citas para registrar pagos.", error);
      return APPOINTMENTS_FALLBACK;
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const toast = useToast();

  const formFromAppointment = (appointmentId: string, discount = "0", payMethod = "Efectivo") => {
    const appointment = appointmentOptions.find(item => item.id === appointmentId);
    if (!appointment) return { ...EMPTY, appointmentId, discount, payMethod };
    const catalog = (() => {
      const stored = localStorage.getItem("eko-services");
      if (!stored) return [];
      try {
        return JSON.parse(stored) as { name: string; price: string }[];
      } catch (error) {
        console.error("No se pudo leer el catálogo para calcular el pago.", error);
        return [];
      }
    })();
    const fallbackPrices: Record<string, number> = {
      "Manicure Clásico": 25000, "Manicure Spa": 35000, "Nail Art Gel": 55000,
      "Pedicure Clásico": 28000, "Uñas Acrílicas": 80000, "Gel Semipermanente": 45000,
      "Pedicure Spa": 42000, "Nail Art Premium": 95000,
    };
    const price = appointment.service.reduce((total, serviceName) => {
      const catalogPrice = Number(catalog.find(service => service.name === serviceName)?.price);
      return total + (catalogPrice || fallbackPrices[serviceName] || 0);
    }, 0);
    return {
      ...EMPTY,
      client: appointment.client,
      appointmentId: appointment.id,
      service: appointment.service.join(", "),
      employee: appointment.employee,
      date: appointment.date,
      time: appointment.time,
      price: String(price),
      discount,
      payMethod,
    };
  };

  useEffect(() => {
    const methods = readTable<MetodoPagoRow>("metodo_pago", []);
    let nextMethodId = methods.reduce((highest, method) => Math.max(highest, method.id), 0) + 1;
    const methodIds = new Map(methods.map(method => [method.nombre, method.id]));
    for (const methodName of PAY_METHODS) {
      if (!methodIds.has(methodName)) {
        methodIds.set(methodName, nextMethodId);
        methods.push({ id: nextMethodId, nombre: methodName });
        nextMethodId++;
      }
    }

    const payments: PagoRow[] = sales.map(sale => ({
      id: Number(sale.id.replace(/\D/g, "")),
      citaId: Number(sale.appointmentId.replace(/\D/g, "")) || 0,
      fecha: `${sale.date}T${sale.time}:00`,
      montoTotal: Math.max(0, sale.price - sale.discount),
    }));
    const paymentDetails: DetallePagoRow[] = sales.map(sale => ({
      id: Number(sale.id.replace(/\D/g, "")),
      pagoId: Number(sale.id.replace(/\D/g, "")),
      metodoPagoId: methodIds.get(sale.payMethod) ?? 0,
      monto: Math.max(0, sale.price - sale.discount),
    }));
    const refunds: DevolucionRow[] = sales.filter(sale => sale.status === "Anulada").map(sale => ({
      id: Number(sale.id.replace(/\D/g, "")),
      pagoId: Number(sale.id.replace(/\D/g, "")),
      fecha: `${sale.date}T${sale.time}:00`,
      monto: Math.max(0, sale.price - sale.discount),
      motivo: sale.notes || "Venta anulada",
    }));
    writeTable("metodo_pago", methods);
    writeTable("pago", payments);
    writeTable("detalle_pago", paymentDetails);
    writeTable("devolucion", refunds);
  }, [sales]);

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.client.toLowerCase().includes(q) || s.service.toLowerCase().includes(q) || s.employee.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = filtered.filter(s => s.status === "Pagada").reduce((acc, s) => acc + s.price - s.discount, 0);

  const open = (mode: ModalMode, sale?: Sale) => {
    setSelected(sale ?? null);
    if (mode === "create") setForm(formFromAppointment(appointmentOptions[0]?.id ?? ""));
    if (mode === "edit" && sale) setForm({ client: sale.client, appointmentId: sale.appointmentId, service: sale.service, employee: sale.employee, date: sale.date, time: sale.time, price: String(sale.price), discount: String(sale.discount), payMethod: sale.payMethod, notes: sale.notes });
    setModal(mode);
  };

  const save = () => {
    const price = Number(form.price);
    const discount = Number(form.discount);
    if (!form.appointmentId || !Number.isFinite(price) || price <= 0 || !Number.isFinite(discount) || discount < 0 || discount > price || !form.payMethod) {
      toast.show("error", "Selecciona una cita y verifica el precio y el descuento");
      return;
    }
    if (modal === "create") {
      const ns: Sale = { id: nextPrefixedId("V-", sales.map(sale => sale.id)), ...form, price: Number(form.price), discount: Number(form.discount), status: "Pagada" };
      setSales(p => [...p, ns]);
    } else if (modal === "edit" && selected) {
      setSales(p => p.map(s => s.id === selected.id ? { ...s, ...form, price: Number(form.price), discount: Number(form.discount) } : s));
    }
    setModal(null);
  };

  const voidSale = () => {
    if (selected) setSales(p => p.map(s => s.id === selected.id ? { ...s, status: "Anulada" } : s));
    setModal(null);
  };

  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Registro de Ventas" desc="Gestiona las ventas y cobros de los servicios prestados">
        <GhostBtn onClick={() => downloadCsv("eko-pagos", filtered.map(sale => ({
          ID: sale.id, Cliente: sale.client, Cita: sale.appointmentId, Servicio: sale.service,
          Empleada: sale.employee, Fecha: sale.date, Hora: sale.time, Precio: sale.price,
          Descuento: sale.discount, Total: sale.price - sale.discount, Metodo: sale.payMethod,
          Estado: sale.status,
        })))}><IcoDownload /> Exportar CSV</GhostBtn>
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nueva Venta</PrimaryBtn>
      </PageHeader>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {[
          { label: "Ventas Pagadas", val: fmt(sales.filter(s => s.status === "Pagada").reduce((a, s) => a + s.price - s.discount, 0)), sub: `${sales.filter(s => s.status === "Pagada").length} transacciones`, color: "#DCFCE7" },
          { label: "Ventas Pendientes", val: fmt(sales.filter(s => s.status === "Pendiente").reduce((a, s) => a + s.price, 0)), sub: `${sales.filter(s => s.status === "Pendiente").length} pendientes`, color: "#FEF3C7" },
          { label: "Total Ventas", val: String(sales.filter(s => s.status !== "Anulada").length), sub: "ventas activas", color: "#FCE8EE" },
          { label: "Anuladas", val: String(sales.filter(s => s.status === "Anulada").length), sub: "ventas anuladas", color: "#FEE2E2" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", padding: "16px 20px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: s.color, marginBottom: "8px" }} />
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: "11px", color: "#71717A", marginTop: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "10px", color: "#71717A", marginTop: "2px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente, servicio, empleada o ID..." />
        <div style={{ display: "flex", gap: "6px" }}>
          {["Todos", "Pagada", "Pendiente", "Anulada"].map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
        </div>
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Cliente</Th><Th>Servicio</Th><Th>Empleada</Th><Th>Fecha</Th><Th>Precio</Th><Th>Descuento</Th><Th>Total</Th><Th>Método</Th><Th>Estado</Th><Th>Acciones</Th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", s)} title="Ver detalle" />
                      <Avatar name={s.client} size={28} />
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{s.client}</span>
                    </div>
                  </Td>
                  <Td>{s.service}</Td>
                  <Td>{s.employee}</Td>
                  <Td>{s.date}</Td>
                  <Td>{fmt(s.price)}</Td>
                  <Td style={{ color: s.discount > 0 ? "#B91C1C" : "#71717A" }}>{s.discount > 0 ? `-${fmt(s.discount)}` : "—"}</Td>
                  <Td style={{ fontWeight: 700, color: "#221F20", fontFamily: "'Montserrat', sans-serif" }}>{fmt(s.price - s.discount)}</Td>
                  <Td>
                    <span style={{ fontSize: "11px", background: "#F4F4F5", color: "#52525B", padding: "2px 8px", borderRadius: "999px", fontWeight: 500 }}>{s.payMethod}</span>
                  </Td>
                  <Td><Badge label={s.status} /></Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {s.status !== "Anulada" && <IconBtn icon={<IcoEdit />} onClick={() => open("edit", s)} variant="primary" title="Editar" />}
                      {s.status !== "Anulada" && <IconBtn icon={<IcoX />} onClick={() => open("void", s)} variant="danger" title="Anular" />}
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
        <Modal title={modal === "create" ? "Registrar Venta" : "Editar Venta"} onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormRow label="Cita asociada" required>
              <Select value={form.appointmentId} onChange={id => setForm(current => ({ ...formFromAppointment(id, current.discount, current.payMethod), notes: current.notes }))} options={appointmentOptions.filter(appointment => appointment.status !== "Cancelada" && appointment.status !== "No asistió").map(appointment => ({
                label: `${appointment.id} · ${appointment.client} · ${appointment.date} ${appointment.time}`,
                value: appointment.id,
              }))} />
            </FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Cliente"><Input value={form.client} disabled /></FormRow>
              <FormRow label="Empleada"><Input value={form.employee} disabled /></FormRow>
              <FormRow label="Servicio"><Input value={form.service} disabled /></FormRow>
              <FormRow label="Fecha"><Input value={form.date} disabled /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Precio (COP)" required><Input value={form.price} disabled /></FormRow>
              <FormRow label="Descuento (COP)"><Input value={form.discount} onChange={f("discount")} placeholder="0" /></FormRow>
            </div>
            <FormRow label="Método de pago" required><Select value={form.payMethod} onChange={f("payMethod")} options={PAY_METHODS.map(p => ({ label: p, value: p }))} /></FormRow>
            {form.price && (
              <div style={{ background: "#FCE8EE", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#B8405E" }}>Total a cobrar</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{fmt((Number(form.price) || 0) - (Number(form.discount) || 0))}</span>
              </div>
            )}
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Registrar Venta" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle de Venta" onClose={() => setModal(null)}>
          <DetailRow label="ID Venta" value={selected.id} />
          <DetailRow label="Cita asociada" value={selected.appointmentId || "—"} />
          <DetailRow label="Cliente" value={selected.client} />
          <DetailRow label="Servicio" value={selected.service} />
          <DetailRow label="Empleada" value={selected.employee} />
          <DetailRow label="Fecha" value={`${selected.date} ${selected.time}`} />
          <DetailRow label="Precio base" value={fmt(selected.price)} />
          <DetailRow label="Descuento" value={selected.discount > 0 ? `-${fmt(selected.discount)}` : "—"} />
          <DetailRow label="Total cobrado" value={<span style={{ fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{fmt(selected.price - selected.discount)}</span>} />
          <DetailRow label="Método de pago" value={selected.payMethod} />
          <DetailRow label="Estado" value={<Badge label={selected.status} />} />
          {selected.notes && <DetailRow label="Notas" value={selected.notes} />}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

      {/* Void */}
      {modal === "void" && selected && (
        <Modal title="Anular Venta" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#B91C1C" }}><IcoX /></div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#221F20", marginBottom: "8px" }}>¿Anular la venta {selected.id}?</p>
            <p style={{ fontSize: "13px", color: "#71717A" }}>
              Venta de <strong>{selected.client}</strong> por <strong>{fmt(selected.price - selected.discount)}</strong>.<br />
              Esta acción cambiará el estado a Anulada y no afecta el historial.
            </p>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={voidSale} confirmLabel="Sí, anular venta" danger />
        </Modal>
      )}
    </div>
  );
}
