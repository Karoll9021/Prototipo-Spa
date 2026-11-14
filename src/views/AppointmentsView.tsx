import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, FilterPill, Modal, FormRow, Input, Select, Textarea, ModalActions, DetailRow, Avatar, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoDownload } from "../components/ui";
import { useToast } from "../components/feedback";
import { downloadCsv, nextPrefixedId, readTable, splitFullName, usePersistentState, writeTable, type CitaRow, type CitaServicioRow, type ClienteRow, type ServicioRow } from "../data/prototypeDatabase";
import { DEFAULT_BUSINESS_HOURS, DEFAULT_EMPLOYEE_SCHEDULES, WEEKDAYS, type EmployeeSchedule } from "../data/scheduling";
import { readUserDirectory } from "../data/userDirectory";

type AppStatus = "Programada" | "Confirmada" | "Atendida" | "Cancelada" | "No asistió";

type Appointment = {
  id: string; client: string; phone: string; service: string[]; employee: string;
  date: string; time: string; status: AppStatus; notes: string; obs: string;
};

const STATUSES: AppStatus[] = ["Programada", "Confirmada", "Atendida", "Cancelada", "No asistió"];
const STATUS_COLORS: Record<AppStatus, { background: string; border: string; text: string; dot: string }> = {
  Programada: { background: "#E0F2FE", border: "#BAE6FD", text: "#0369A1", dot: "#0284C7" },
  Confirmada: { background: "#FEF3C7", border: "#FDE68A", text: "#B45309", dot: "#D97706" },
  Atendida: { background: "#DCFCE7", border: "#BBF7D0", text: "#15803D", dot: "#16A34A" },
  Cancelada: { background: "#FEE2E2", border: "#FECACA", text: "#B91C1C", dot: "#DC2626" },
  "No asistió": { background: "#FEE2E2", border: "#FECACA", text: "#B91C1C", dot: "#DC2626" },
};
const SERVICES = ["Manicure Clásico", "Manicure Spa", "Nail Art Gel", "Pedicure Clásico", "Uñas Acrílicas", "Gel Semipermanente", "Pedicure Spa", "Nail Art Premium"];
const EMPLOYEES = ["Andrea López", "Camila Reyes", "Juliana Mora"];
type ClientOption = { name: string; phone: string };
const DAYS = WEEKDAYS;
const DEFAULT_DURATIONS: Record<string, number> = {
  "Manicure Clásico": 45, "Manicure Spa": 60, "Nail Art Gel": 75, "Pedicure Clásico": 50,
  "Uñas Acrílicas": 90, "Gel Semipermanente": 60, "Pedicure Spa": 70, "Nail Art Premium": 120,
};

function readBookingConfig<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`No se pudo leer la configuración de agenda (${key}).`, error);
    return fallback;
  }
}

function minutesOfDay(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function durationOf(services: string[]) {
  const catalog = readBookingConfig<{ name: string; duration: string }[]>("eko-services", []);
  return services.reduce((total, name) => {
    const catalogDuration = Number(catalog.find(service => service.name === name)?.duration);
    return total + (catalogDuration > 0 ? catalogDuration : DEFAULT_DURATIONS[name] ?? 0);
  }, 0);
}

const INITIAL: Appointment[] = [
  { id: "C-001", client: "Valentina Torres", phone: "300 123 4567", service: ["Manicure Spa"], employee: "Andrea López", date: "2026-09-14", time: "09:00", status: "Atendida", notes: "", obs: "Cliente satisfecha con resultado" },
  { id: "C-002", client: "Isabella Ramírez", phone: "301 987 6543", service: ["Nail Art Gel"], employee: "Camila Reyes", date: "2026-09-14", time: "10:30", status: "Confirmada", notes: "Diseño floral", obs: "" },
  { id: "C-003", client: "Sofía Mendoza", phone: "310 456 7890", service: ["Pedicure Clásico"], employee: "Juliana Mora", date: "2026-09-14", time: "11:00", status: "Programada", notes: "", obs: "" },
  { id: "C-004", client: "Mariana Castillo", phone: "315 234 5678", service: ["Uñas Acrílicas"], employee: "Andrea López", date: "2026-09-14", time: "12:00", status: "Atendida", notes: "", obs: "Muy bien, volverá la próxima semana" },
  { id: "C-005", client: "Gabriela Vargas", phone: "312 876 5432", service: ["Manicure Clásico"], employee: "Camila Reyes", date: "2026-09-14", time: "14:00", status: "Cancelada", notes: "Canceló por trabajo", obs: "" },
  { id: "C-006", client: "Paula Jiménez", phone: "318 345 6789", service: ["Gel Semipermanente"], employee: "Juliana Mora", date: "2026-09-14", time: "15:30", status: "Confirmada", notes: "", obs: "" },
  { id: "C-007", client: "Natalia Ospina", phone: "320 654 3210", service: ["Manicure Spa"], employee: "Andrea López", date: "2026-09-15", time: "09:30", status: "Programada", notes: "", obs: "" },
  { id: "C-008", client: "Daniela Gutiérrez", phone: "316 789 0123", service: ["Nail Art Premium"], employee: "Camila Reyes", date: "2026-09-15", time: "11:00", status: "Programada", notes: "Primera visita", obs: "" },
];

const EMPTY = { client: "", phone: "", service: [SERVICES[0]], employee: EMPLOYEES[0], date: "", time: "", notes: "" };
type ModalMode = "create" | "edit" | "detail" | "status" | null;

export default function AppointmentsView() {
  const [appointments, setAppointments] = usePersistentState<Appointment[]>("eko-appointments", INITIAL);
  const [serviceOptions] = useState<string[]>(() => {
    const stored = localStorage.getItem("eko-services");
    if (!stored) return SERVICES;
    try {
      const catalog = JSON.parse(stored) as { name: string; active: boolean }[];
      const active = catalog.filter(service => service.active).map(service => service.name);
      return active.length ? active : SERVICES;
    } catch (error) {
      console.error("No se pudo leer el catálogo para las citas.", error);
      return SERVICES;
    }
  });
  const [employeeOptions] = useState<string[]>(() => {
    const activeEmployees = readUserDirectory().filter(user => user.active && user.roles.includes("Empleada")).map(user => user.name);
    return activeEmployees.length ? activeEmployees : EMPLOYEES;
  });
  const [clientOptions] = useState<ClientOption[]>(() => {
    const stored = localStorage.getItem("eko-clients");
    if (!stored) return [...new Map(INITIAL.map(appointment => [appointment.client, { name: appointment.client, phone: appointment.phone }])).values()];
    try {
      const clients = JSON.parse(stored) as { name: string; phone: string; active: boolean }[];
      const active = clients.filter(client => client.active).map(client => ({ name: client.name, phone: client.phone }));
      return active.length ? active : [...new Map(INITIAL.map(appointment => [appointment.client, { name: appointment.client, phone: appointment.phone }])).values()];
    } catch (error) {
      console.error("No se pudo leer el directorio de clientes para las citas.", error);
      return [...new Map(INITIAL.map(appointment => [appointment.client, { name: appointment.client, phone: appointment.phone }])).values()];
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterEmployee, setFilterEmployee] = useState("Todos");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ ...EMPTY, client: clientOptions[0]?.name ?? "", phone: clientOptions[0]?.phone ?? "", service: [serviceOptions[0] ?? ""], employee: employeeOptions[0] ?? "" });
  const [newStatus, setNewStatus] = useState<AppStatus>("Programada");
  const [newObs, setNewObs] = useState("");
  const toast = useToast();

  useEffect(() => {
    const now = new Date().toISOString();
    const clientRows = readTable<ClienteRow>("cliente", []);
    const clientIds = new Map(clientRows.map(client => [client.id, [client.primerNombre, client.segundoNombre, client.primerApellido, client.segundoApellido].filter(Boolean).join(" ")]));
    const clientIdByName = new Map([...clientIds].map(([id, name]) => [name, id]));
    let nextClientId = clientRows.length + 1;
    for (const appointment of appointments) {
      if (clientIdByName.has(appointment.client)) continue;
      const id = `CL-${String(nextClientId++).padStart(3, "0")}`;
      const name = splitFullName(appointment.client);
      clientRows.push({ id, ...name, telefono: appointment.phone, email: "", activo: true, fechaRegistro: now });
      clientIdByName.set(appointment.client, id);
    }

    let serviceRows = readTable<ServicioRow>("servicio", []);
    if (serviceRows.length === 0) {
      const prices: Record<string, [number, number]> = {
        "Manicure Clásico": [25000, 45], "Manicure Spa": [35000, 60], "Nail Art Gel": [55000, 75],
        "Pedicure Clásico": [28000, 50], "Uñas Acrílicas": [80000, 90], "Gel Semipermanente": [45000, 60],
        "Pedicure Spa": [42000, 70], "Nail Art Premium": [95000, 120],
      };
      serviceRows = SERVICES.map((name, index) => {
        const [precio, duracionEstimada] = prices[name] ?? [0, 0];
        return { id: index + 1, nombre: name, precio, duracionEstimada, activo: true, fechaCreacion: now, fechaActualizacion: now };
      });
    }
    const serviceIdByName = new Map(serviceRows.map(service => [service.nombre, service]));
    const employeeIdByName = new Map(readUserDirectory().map(user => [user.name, user.id]));
    const existingAppointments = readTable<CitaRow>("cita", []);
    const creationDates = new Map(existingAppointments.map(appointment => [appointment.id, appointment.fechaCreacion]));
    const appointmentRows: CitaRow[] = appointments.map(appointment => ({
      id: Number(appointment.id.replace(/\D/g, "")),
      clienteId: clientIdByName.get(appointment.client) ?? "",
      fechaCreacion: creationDates.get(Number(appointment.id.replace(/\D/g, ""))) ?? now,
      fechaHoraInicio: `${appointment.date} ${appointment.time}:00`,
      estado: appointment.status,
      observaciones: [appointment.notes, appointment.obs].filter(Boolean).join(" · ").slice(0, 1000),
    }));
    const serviceAppointmentRows: CitaServicioRow[] = appointments.flatMap(appointment => {
      const citaId = Number(appointment.id.replace(/\D/g, ""));
      const employeeId = employeeIdByName.get(appointment.employee);
      if (!employeeId) return [];
      let offsetMinutes = 0;
      return appointment.service.flatMap((name, index) => {
        const service = serviceIdByName.get(name);
        if (!service) return [];
        const duration = Math.max(0, service.duracionEstimada);
        const start = localDateTime(appointment.date, appointment.time, offsetMinutes);
        const end = localDateTime(appointment.date, appointment.time, offsetMinutes + duration);
        offsetMinutes += duration;
        return [{
          id: citaId * 100 + index + 1,
          citaId,
          servicioId: service.id,
          empleadoId: employeeId,
          inicioPlanificado: start,
          finPlanificado: end,
          duracionAplicada: duration,
          precioAplicado: service.precio,
        }];
      });
    });

    writeTable("cliente", clientRows);
    if (readTable<ServicioRow>("servicio", []).length === 0) writeTable("servicio", serviceRows);
    writeTable("cita", appointmentRows);
    writeTable("cita_servicio", serviceAppointmentRows);
  }, [appointments]);

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.client.toLowerCase().includes(q) || a.service.join(", ").toLowerCase().includes(q) || a.employee.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || a.status === filterStatus;
    const matchEmp = filterEmployee === "Todos" || a.employee === filterEmployee;
    return matchSearch && matchStatus && matchEmp;
  });

  const open = (mode: ModalMode, ap?: Appointment) => {
    setSelected(ap ?? null);
    if (mode === "create") setForm({ ...EMPTY, client: clientOptions[0]?.name ?? "", phone: clientOptions[0]?.phone ?? "", service: [serviceOptions[0] ?? ""], employee: employeeOptions[0] ?? "" });
    if (mode === "edit" && ap) setForm({ client: ap.client, phone: ap.phone, service: [...ap.service], employee: ap.employee, date: ap.date, time: ap.time, notes: ap.notes });
    if (mode === "status" && ap) { setNewStatus(ap.status); setNewObs(ap.obs); }
    setModal(mode);
  };

  const save = () => {
    if (!form.client || !form.service.length || !form.employee || !form.date || !form.time) {
      toast.show("error", "Completa cliente, servicio, empleada, fecha y hora");
      return;
    }
    const bookingChanged = modal === "create" || !selected
      || selected.employee !== form.employee
      || selected.date !== form.date
      || selected.time !== form.time
      || selected.service.length !== form.service.length
      || selected.service.some((service, index) => service !== form.service[index]);

    if (bookingChanged) {
      const date = new Date(`${form.date}T12:00:00`);
      if (Number.isNaN(date.getTime()) || !/^\d{2}:\d{2}$/.test(form.time)) {
        toast.show("error", "Ingresa una fecha y hora válidas");
        return;
      }

      const day = DAYS[(date.getDay() + 6) % 7];
      const businessHours = readBookingConfig<typeof DEFAULT_BUSINESS_HOURS>("eko-business-hours", DEFAULT_BUSINESS_HOURS);
      if (!businessHours.days.includes(day)) {
        toast.show("error", `El establecimiento no atiende los ${day.toLowerCase()}`);
        return;
      }

      const schedules = readBookingConfig<EmployeeSchedule[]>("eko-schedules", DEFAULT_EMPLOYEE_SCHEDULES);
      const schedule = schedules.find(item => item.employee === form.employee && item.days.includes(day));
      if (!schedule) {
        toast.show("error", `${form.employee} no tiene horario asignado para el ${day.toLowerCase()}`);
        return;
      }

      const duration = durationOf(form.service);
      if (duration <= 0) {
        toast.show("error", "No se pudo determinar la duración de los servicios seleccionados");
        return;
      }
      const start = minutesOfDay(form.time);
      const end = start + duration;
      if (start < minutesOfDay(businessHours.open) || end > minutesOfDay(businessHours.close)) {
        toast.show("error", "La cita debe estar dentro del horario de atención del establecimiento");
        return;
      }
      if (start < minutesOfDay(schedule.startTime) || end > minutesOfDay(schedule.endTime)) {
        toast.show("error", `La cita debe estar dentro del turno de ${form.employee}`);
        return;
      }
      if (schedule.breakStart && schedule.breakEnd && start < minutesOfDay(schedule.breakEnd) && end > minutesOfDay(schedule.breakStart)) {
        toast.show("error", `El horario seleccionado coincide con el descanso de ${form.employee}`);
        return;
      }

      const overlaps = appointments.some(appointment => {
        if (appointment.id === selected?.id
          || appointment.employee !== form.employee
          || appointment.date !== form.date
          || appointment.status === "Cancelada"
          || appointment.status === "No asistió") return false;
        const otherStart = minutesOfDay(appointment.time);
        const otherEnd = otherStart + durationOf(appointment.service);
        return start < otherEnd && otherStart < end;
      });
      if (overlaps) {
        toast.show("error", "La empleada ya tiene una cita que se cruza con ese horario");
        return;
      }
    }

    if (modal === "create") {
      const na: Appointment = { id: nextPrefixedId("C-", appointments.map(appointment => appointment.id)), ...form, status: "Programada", obs: "" };
      setAppointments(p => [...p, na]);
    } else if (modal === "edit" && selected) {
      setAppointments(p => p.map(a => a.id === selected.id ? { ...a, ...form } : a));
    }
    setModal(null);
  };

  const saveStatus = () => {
    if (selected) setAppointments(p => p.map(a => a.id === selected.id ? { ...a, status: newStatus, obs: newObs } : a));
    setModal(null);
  };

  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleService = (service: string) => setForm(current => ({
    ...current,
    service: current.service.includes(service)
      ? current.service.length > 1 ? current.service.filter(item => item !== service) : current.service
      : [...current.service, service],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Gestión de Citas" desc="Registra, consulta y gestiona todas las citas del establecimiento">
        <GhostBtn onClick={() => downloadCsv("eko-citas", filtered.map(appointment => ({
          ID: appointment.id, Cliente: appointment.client, Telefono: appointment.phone,
          Servicios: appointment.service.join(" / "), Empleada: appointment.employee,
          Fecha: appointment.date, Hora: appointment.time, Estado: appointment.status,
          Observaciones: [appointment.notes, appointment.obs].filter(Boolean).join(" · "),
        })))}><IcoDownload /> Exportar CSV</GhostBtn>
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Nueva Cita</PrimaryBtn>
      </PageHeader>

      {/* Status summary pills */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {([["Todas", appointments.length], ["Programada", appointments.filter(a => a.status === "Programada").length], ["Confirmada", appointments.filter(a => a.status === "Confirmada").length], ["Atendida", appointments.filter(a => a.status === "Atendida").length], ["Cancelada", appointments.filter(a => a.status === "Cancelada").length]] as [string, number][]).map(([s, count]) => (
          <button key={s} onClick={() => setFilterStatus(s === "Todas" ? "Todos" : s)}
            style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: (filterStatus === "Todos" && s === "Todas") || filterStatus === s ? "1.5px solid #E88099" : "1px solid #E4E4E7", background: (filterStatus === "Todos" && s === "Todas") || filterStatus === s ? "#FCE8EE" : "#FFFFFF", color: (filterStatus === "Todos" && s === "Todas") || filterStatus === s ? "#B8405E" : "#71717A", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
            {s} <span style={{ fontSize: "11px", fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente, servicio, empleada o ID..." />
        <div style={{ display: "flex", gap: "6px" }}>
          {["Todos", ...employeeOptions].map(e => <FilterPill key={e} label={e === "Todos" ? "Todas" : e.split(" ")[0]} active={filterEmployee === e} onClick={() => setFilterEmployee(e)} />)}
        </div>
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Cliente</Th><Th>Servicio</Th><Th>Empleada</Th><Th>Fecha</Th><Th>Hora</Th><Th>Estado</Th><Th>Acciones</Th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", a)} title="Ver detalle" />
                      <Avatar name={a.client} size={32} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{a.client}</div>
                        <div style={{ fontSize: "11px", color: "#71717A" }}>{a.phone}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{a.service.join(", ")}</Td>
                  <Td>{a.employee}</Td>
                  <Td>{a.date}</Td>
                  <Td style={{ fontWeight: 500, color: "#221F20" }}>{a.time}</Td>
                  <Td>
                    <button type="button" aria-label={`Cambiar estado de cita ${a.id}`} onClick={() => open("status", a)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 10px", border: `1px solid ${STATUS_COLORS[a.status].border}`, borderRadius: "999px", background: STATUS_COLORS[a.status].background, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", cursor: "pointer" }}>
                      <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", background: STATUS_COLORS[a.status].dot, boxShadow: `0 0 0 3px ${STATUS_COLORS[a.status].border}`, flexShrink: 0 }} />
                      <span style={{ color: STATUS_COLORS[a.status].text, fontSize: "11px", fontWeight: 700 }}>{a.status}</span>
                      <span aria-hidden="true" style={{ color: STATUS_COLORS[a.status].text, fontSize: "10px", marginLeft: "2px" }}>▾</span>
                    </button>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <IconBtn icon={<IcoEdit />} onClick={() => open("edit", a)} variant="primary" title="Editar" />
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
        <Modal title={modal === "create" ? "Nueva Cita" : "Editar Cita"} onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Cliente" required>
                <Select value={form.client} onChange={name => {
                  const client = clientOptions.find(option => option.name === name);
                  setForm(current => ({ ...current, client: name, phone: client?.phone ?? current.phone }));
                }} options={clientOptions.map(client => ({ label: client.name, value: client.name }))} />
              </FormRow>
              <FormRow label="Teléfono de contacto"><Input value={form.phone} onChange={f("phone")} placeholder="300 000 0000" /></FormRow>
            </div>
            <FormRow label="Servicio solicitado" required>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {serviceOptions.map(service => (
                  <label key={service} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 10px", border: "1px solid #E4E4E7", borderRadius: "8px", fontSize: "12px", color: "#221F20", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.service.includes(service)} onChange={() => toggleService(service)} />
                    {service}
                  </label>
                ))}
              </div>
            </FormRow>
            <FormRow label="Empleada asignada" required>
              <Select value={form.employee} onChange={f("employee")} options={employeeOptions.map(e => ({ label: e, value: e }))} />
            </FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Fecha" required><Input value={form.date} onChange={f("date")} type="date" /></FormRow>
              <FormRow label="Hora" required><Input value={form.time} onChange={f("time")} type="time" /></FormRow>
            </div>
            <FormRow label="Observaciones"><Textarea value={form.notes} onChange={f("notes")} placeholder="Detalles o solicitudes especiales del cliente..." /></FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Registrar Cita" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle de Cita" onClose={() => setModal(null)}>
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Cliente" value={selected.client} />
          <DetailRow label="Teléfono" value={selected.phone} />
          <DetailRow label="Servicios" value={selected.service.join(", ")} />
          <DetailRow label="Empleada" value={selected.employee} />
          <DetailRow label="Fecha" value={selected.date} />
          <DetailRow label="Hora" value={selected.time} />
          <DetailRow label="Estado" value={<Badge label={selected.status} />} />
          {selected.notes && <DetailRow label="Notas" value={selected.notes} />}
          {selected.obs && (
            <div style={{ marginTop: "14px", padding: "12px", background: "#F9F9FB", borderRadius: "8px" }}>
              <p style={{ fontSize: "11px", color: "#71717A", fontWeight: 600, marginBottom: "4px" }}>OBSERVACIONES DEL SERVICIO</p>
              <p style={{ fontSize: "13px", color: "#221F20", lineHeight: 1.6 }}>{selected.obs}</p>
            </div>
          )}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

      {/* Change Status */}
      {modal === "status" && selected && (
        <Modal title="Cambiar Estado de Cita" onClose={() => setModal(null)}>
          <p style={{ fontSize: "13px", color: "#71717A", marginBottom: "16px" }}>
            Cita de <strong style={{ color: "#221F20" }}>{selected.client}</strong> — {selected.service.join(", ")}, {selected.date} {selected.time}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {STATUSES.map(s => (
              <label key={s} onClick={() => setNewStatus(s)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", border: `1.5px solid ${newStatus === s ? "#E88099" : "#E4E4E7"}`, borderRadius: "10px", cursor: "pointer", background: newStatus === s ? "#FCE8EE" : "#FAFAFA" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${newStatus === s ? "#E88099" : "#E4E4E7"}`, background: newStatus === s ? "#E88099" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {newStatus === s && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FFFFFF" }} />}
                </div>
                <Badge label={s} />
              </label>
            ))}
          </div>
          {newStatus === "Atendida" && (
            <FormRow label="Observaciones del servicio prestado">
              <Textarea value={newObs} onChange={setNewObs} placeholder="Describe el servicio realizado, observaciones y resultado..." rows={3} />
            </FormRow>
          )}
          <ModalActions onClose={() => setModal(null)} onConfirm={saveStatus} confirmLabel="Confirmar Estado" />
        </Modal>
      )}
    </div>
  );
}

function localDateTime(date: string, time: string, offsetMinutes: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setMinutes(hours * 60 + minutes + offsetMinutes);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
}
