import { Fragment, useEffect, useState } from "react";
import { Badge, Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, Modal, FormRow, Input, Select, ModalActions, DetailRow, Th, Td, IcoPlus, IcoEdit, IcoEye } from "../components/ui";
import { useToast } from "../components/feedback";
import { readUserDirectory } from "../data/userDirectory";
import { nextPrefixedId, usePersistentState, writeTable, type HorarioEmpleadoRow } from "../data/prototypeDatabase";
import { DEFAULT_EMPLOYEE_SCHEDULES, WEEKDAYS, type EmployeeSchedule } from "../data/scheduling";

const DAYS = WEEKDAYS;
const EMPLOYEES = ["Andrea López", "Camila Reyes", "Juliana Mora", "Paola Sierra"];

type Schedule = EmployeeSchedule;
type Appointment = { id: string; client: string; service: string[]; employee: string; date: string; time: string; status: string };

const EMPTY = { employee: EMPLOYEES[0], days: [] as string[], startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00", notes: "" };
type ModalMode = "create" | "edit" | "detail" | null;

function localDateString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function mondayOfWeek(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

export default function AgendaView() {
  const [schedules, setSchedules] = usePersistentState<Schedule[]>("eko-schedules", DEFAULT_EMPLOYEE_SCHEDULES);
  const [appointments] = useState<Appointment[]>(() => {
    const stored = localStorage.getItem("eko-appointments");
    if (!stored) return [];
    try {
      return JSON.parse(stored) as Appointment[];
    } catch (error) {
      console.error("No se pudieron leer las citas para la agenda diaria.", error);
      return [];
    }
  });
  const [employeeOptions] = useState(() => {
    const available = readUserDirectory().filter(user => user.active && user.roles.includes("Empleada")).map(user => user.name);
    return available.length ? available : EMPLOYEES;
  });
  const [search, setSearch] = useState("");
  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(new Date()));
  const [selectedScheduleCell, setSelectedScheduleCell] = useState<{ employee: string; date: string } | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [form, setForm] = useState({ ...EMPTY, employee: employeeOptions[0] });
  const toast = useToast();

  useEffect(() => {
    const users = readUserDirectory();
    const rows: HorarioEmpleadoRow[] = schedules.flatMap(schedule => {
      const employeeId = users.find(user => user.name === schedule.employee)?.id;
      if (!employeeId) return [];
      return schedule.days.map(day => ({
        id: Number(schedule.id.replace(/\D/g, "")) * 10 + DAYS.indexOf(day) + 1,
        empleadoId: employeeId,
        diaSemana: DAYS.indexOf(day) + 1,
        horarioInicio: schedule.startTime,
        horarioFin: schedule.endTime,
      }));
    });
    writeTable("horario_empleado", rows);
  }, [schedules]);

  const filtered = schedules.filter(s => s.employee.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));
  const weekDates = DAYS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const dailyAppointments = appointments
    .filter(appointment => appointment.date === selectedScheduleCell?.date && appointment.employee === selectedScheduleCell?.employee)
    .sort((a, b) => a.time.localeCompare(b.time));
  const selectedDateLabel = selectedScheduleCell
    ? new Date(`${selectedScheduleCell.date}T12:00:00`).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })
    : "";

  const open = (mode: ModalMode, sc?: Schedule) => {
    setSelected(sc ?? null);
    if (mode === "create") setForm({ ...EMPTY, employee: employeeOptions[0], days: [] });
    if (mode === "edit" && sc) setForm({ employee: sc.employee, days: [...sc.days], startTime: sc.startTime, endTime: sc.endTime, breakStart: sc.breakStart, breakEnd: sc.breakEnd, notes: sc.notes });
    setModal(mode);
  };

  const save = () => {
    if (!form.employee || form.days.length === 0 || form.startTime >= form.endTime) {
      toast.show("error", "Selecciona la empleada, al menos un día y un rango de horas válido");
      return;
    }
    if (modal === "create") {
      const ns: Schedule = { id: nextPrefixedId("H-", schedules.map(schedule => schedule.id)), ...form };
      setSchedules(p => [...p, ns]);
    } else if (modal === "edit" && selected) {
      setSchedules(p => p.map(s => s.id === selected.id ? { ...s, ...form } : s));
    }
    setModal(null);
  };

  const toggleDay = (day: string) =>
    setForm(p => ({ ...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day] }));

  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const changeWeek = (offset: number) => {
    setWeekStart(current => {
      const next = new Date(current);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
    setSelectedScheduleCell(null);
  };
  const weekRange = `${weekDates[0].toLocaleDateString("es-CO", { day: "numeric", month: "short" })} – ${weekDates[6].toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Agenda — Horarios" desc="Consulta las citas del día y gestiona los horarios de cada empleada">
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Asignar Horario</PrimaryBtn>
      </PageHeader>

      <div style={{ display: "flex", gap: "12px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por empleada o ID..." />
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><Th>Empleada</Th><Th>Días asignados</Th><Th>Entrada</Th><Th>Salida</Th><Th>Descanso</Th><Th>Notas</Th><Th>Acciones</Th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Td style={{ fontWeight: 500, color: "#221F20" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconBtn icon={<IcoEye />} onClick={() => open("detail", s)} title="Ver detalle" />
                      {s.employee}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {s.days.map(d => <span key={d} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px", background: "#FCE8EE", color: "#B8405E", fontWeight: 600 }}>{d.slice(0, 3)}</span>)}
                    </div>
                  </Td>
                  <Td style={{ fontWeight: 500, color: "#221F20" }}>{s.startTime}</Td>
                  <Td style={{ fontWeight: 500, color: "#221F20" }}>{s.endTime}</Td>
                  <Td>{s.breakStart} – {s.breakEnd}</Td>
                  <Td>{s.notes || <span style={{ color: "#71717A" }}>—</span>}</Td>
                  <Td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <IconBtn icon={<IcoEdit />} onClick={() => open("edit", s)} variant="primary" title="Editar" />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weekly grid view */}
      <Card>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "15px", fontWeight: 600, color: "#221F20" }}>Vista Semanal</h2>
            <p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>{weekRange} · Selecciona un día para ver sus citas.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <GhostBtn onClick={() => changeWeek(-1)}>‹ Semana anterior</GhostBtn>
            <GhostBtn onClick={() => changeWeek(1)}>Semana siguiente ›</GhostBtn>
          </div>
        </div>
        <div style={{ padding: "20px 24px", overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `120px repeat(7, 1fr)`, gap: "6px", minWidth: "700px" }}>
            <div />
            {DAYS.map((day, index) => {
              return (
                <div key={day} style={{ borderRadius: "8px", color: "#71717A", textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 2px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span>{day.slice(0, 3)}</span>
                  <span>{weekDates[index].toLocaleDateString("es-CO", { day: "numeric" })}</span>
                </div>
              );
            })}
            {employeeOptions.map(emp => {
              return (
                <Fragment key={emp}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#221F20", paddingTop: "8px", paddingRight: "8px", display: "flex", alignItems: "flex-start" }}>{emp.split(" ")[0]}</div>
                  {DAYS.map((d, index) => {
                    const sc = schedules.find(s => s.employee === emp && s.days.includes(d));
                    const on = Boolean(sc);
                    const date = localDateString(weekDates[index]);
                    const selected = date === selectedScheduleCell?.date && emp === selectedScheduleCell.employee;
                    return (
                      <button key={d} type="button"
                        onClick={() => setSelectedScheduleCell(current => current?.employee === emp && current.date === date ? null : { employee: emp, date })}
                        aria-pressed={selected}
                        aria-label={`Ver citas de ${emp} para el ${d}`}
                        style={{ height: "40px", borderRadius: "8px", background: selected ? "#F7DCE5" : on ? "#FCE8EE" : "#F9F9FB", border: `1px solid ${selected ? "#E88099" : on ? "#F0C4D0" : "#E4E4E7"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {sc && <span style={{ fontSize: "10px", color: "#B8405E", fontWeight: 700 }}>{sc.startTime}–{sc.endTime.slice(0, 5)}</span>}
                      </button>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
        {selectedScheduleCell && (
          <div style={{ borderTop: "1px solid #E4E4E7" }}>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "14px", fontWeight: 600, color: "#221F20", textTransform: "capitalize" }}>Citas de {selectedScheduleCell.employee} · {selectedDateLabel}</h3>
                <p style={{ fontSize: "12px", color: "#71717A", marginTop: "4px" }}>Solo se muestran las citas asignadas a esta empleada.</p>
              </div>
              <GhostBtn onClick={() => setSelectedScheduleCell(null)}>Cerrar</GhostBtn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Hora</Th><Th>Cliente</Th><Th>Servicio</Th><Th>Empleada</Th><Th>Estado</Th></tr></thead>
                <tbody>
                  {dailyAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <Td style={{ fontWeight: 600, color: "#221F20" }}>{appointment.time}</Td>
                      <Td style={{ color: "#221F20" }}>{appointment.client}</Td>
                      <Td>{appointment.service.join(", ")}</Td>
                      <Td>{appointment.employee}</Td>
                      <Td><Badge label={appointment.status} /></Td>
                    </tr>
                  ))}
                  {dailyAppointments.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#71717A", fontSize: "13px" }}>No hay citas registradas para este día.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Asignar Horario" : "Editar Horario"} onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <FormRow label="Empleada" required>
              <Select value={form.employee} onChange={f("employee")} options={employeeOptions.map(e => ({ label: e, value: e }))} />
            </FormRow>
            <FormRow label="Días de atención" required>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {DAYS.map(d => {
                  const on = form.days.includes(d);
                  return (
                    <button key={d} onClick={() => toggleDay(d)}
                      style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: `1.5px solid ${on ? "#E88099" : "#E4E4E7"}`, background: on ? "#FCE8EE" : "#FAFAFA", color: on ? "#B8405E" : "#71717A", cursor: "pointer", transition: "all 0.15s" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Hora de entrada" required><Input value={form.startTime} onChange={f("startTime")} type="time" /></FormRow>
              <FormRow label="Hora de salida" required><Input value={form.endTime} onChange={f("endTime")} type="time" /></FormRow>
              <FormRow label="Inicio descanso"><Input value={form.breakStart} onChange={f("breakStart")} type="time" /></FormRow>
              <FormRow label="Fin descanso"><Input value={form.breakEnd} onChange={f("breakEnd")} type="time" /></FormRow>
            </div>
            <FormRow label="Notas adicionales">
              <Input value={form.notes} onChange={f("notes")} placeholder="Observaciones sobre el horario..." />
            </FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={save} confirmLabel={modal === "create" ? "Asignar Horario" : "Guardar Cambios"} />
        </Modal>
      )}

      {/* Detail */}
      {modal === "detail" && selected && (
        <Modal title="Detalle del Horario" onClose={() => setModal(null)}>
          <DetailRow label="ID" value={selected.id} />
          <DetailRow label="Empleada" value={selected.employee} />
          <DetailRow label="Hora entrada" value={selected.startTime} />
          <DetailRow label="Hora salida" value={selected.endTime} />
          <DetailRow label="Descanso" value={`${selected.breakStart} – ${selected.breakEnd}`} />
          <DetailRow label="Días asignados" value={
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {selected.days.map(d => <span key={d} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "#FCE8EE", color: "#B8405E", fontWeight: 600 }}>{d}</span>)}
            </div>
          } />
          {selected.notes && <DetailRow label="Notas" value={selected.notes} />}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}><GhostBtn onClick={() => setModal(null)}>Cerrar</GhostBtn></div>
        </Modal>
      )}

    </div>
  );
}
