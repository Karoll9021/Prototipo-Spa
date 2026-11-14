import { useEffect, useState } from "react";
import { Card, PageHeader, PrimaryBtn, GhostBtn, IconBtn, SearchInput, Modal, FormRow, Input, Select, ModalActions, DetailRow, Th, Td, IcoPlus, IcoEdit, IcoEye, IcoClock } from "../components/ui";
import { useToast } from "../components/feedback";
import { readUserDirectory } from "../data/userDirectory";
import { nextPrefixedId, usePersistentState, writeTable, type HorarioEmpleadoRow } from "../data/prototypeDatabase";
import { DEFAULT_BUSINESS_HOURS, DEFAULT_EMPLOYEE_SCHEDULES, WEEKDAYS, type EmployeeSchedule } from "../data/scheduling";

const DAYS = WEEKDAYS;
const EMPLOYEES = ["Andrea López", "Camila Reyes", "Juliana Mora", "Paola Sierra"];

type Schedule = EmployeeSchedule;

const EMPTY = { employee: EMPLOYEES[0], days: [] as string[], startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00", notes: "" };
type ModalMode = "create" | "edit" | "detail" | "biz" | null;

export default function AgendaView() {
  const [schedules, setSchedules] = usePersistentState<Schedule[]>("eko-schedules", DEFAULT_EMPLOYEE_SCHEDULES);
  const [employeeOptions] = useState(() => {
    const available = readUserDirectory().filter(user => user.active && user.roles.includes("Empleada")).map(user => user.name);
    return available.length ? available : EMPLOYEES;
  });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [form, setForm] = useState({ ...EMPTY, employee: employeeOptions[0] });
  const [bizForm, setBizForm] = usePersistentState("eko-business-hours", DEFAULT_BUSINESS_HOURS);
  const [businessHoursDraft, setBusinessHoursDraft] = useState(bizForm);
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

  const open = (mode: ModalMode, sc?: Schedule) => {
    setSelected(sc ?? null);
    if (mode === "biz") setBusinessHoursDraft({ ...bizForm, days: [...bizForm.days] });
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

  const saveBusinessHours = () => {
    if (businessHoursDraft.open >= businessHoursDraft.close || businessHoursDraft.days.length === 0) {
      toast.show("error", "Configura un rango de atención y al menos un día");
      return;
    }
    setBizForm(businessHoursDraft);
    setModal(null);
  };

  const toggleDay = (day: string) =>
    setForm(p => ({ ...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day] }));

  const f = (k: keyof typeof EMPTY) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader title="Agenda — Horarios" desc="Configura horarios del establecimiento y gestiona turnos de empleadas">
        <GhostBtn onClick={() => setModal("biz")}><IcoClock /> Horario del negocio</GhostBtn>
        <PrimaryBtn onClick={() => open("create")}><IcoPlus /> Asignar Horario</PrimaryBtn>
      </PageHeader>

      {/* Business hours summary */}
      <div style={{ background: "linear-gradient(135deg, #FCE8EE 0%, #F7DCE5 100%)", border: "1px solid #E8B4C3", borderRadius: "12px", padding: "20px 24px", display: "flex", gap: "32px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", color: "#8F2442", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Horario de Atención</p>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "#6D1530", fontFamily: "'Montserrat', sans-serif" }}>{bizForm.open} – {bizForm.close}</p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#8F2442", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Días de Atención</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {DAYS.map(d => (
              <span key={d} style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: bizForm.days.includes(d) ? "#9F2F4D" : "#E5DDE1", color: bizForm.days.includes(d) ? "#FFFFFF" : "#393139", fontWeight: 700 }}>{d.slice(0, 3)}</span>
            ))}
          </div>
        </div>
      </div>

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
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E4E4E7" }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "15px", fontWeight: 600, color: "#221F20" }}>Vista Semanal</h2>
        </div>
        <div style={{ padding: "20px 24px", overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `120px repeat(7, 1fr)`, gap: "6px", minWidth: "700px" }}>
            <div />
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "8px" }}>{d.slice(0, 3)}</div>
            ))}
            {EMPLOYEES.map(emp => {
              const sc = schedules.find(s => s.employee === emp);
              return (
                <>
                  <div key={emp} style={{ fontSize: "12px", fontWeight: 500, color: "#221F20", paddingTop: "8px", paddingRight: "8px", display: "flex", alignItems: "flex-start" }}>{emp.split(" ")[0]}</div>
                  {DAYS.map(d => {
                    const on = sc?.days.includes(d);
                    return (
                      <div key={d} style={{ height: "40px", borderRadius: "8px", background: on ? "#FCE8EE" : "#F9F9FB", border: `1px solid ${on ? "#F0C4D0" : "#E4E4E7"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {on && <span style={{ fontSize: "10px", color: "#B8405E", fontWeight: 700 }}>{sc!.startTime}–{sc!.endTime.slice(0, 5)}</span>}
                      </div>
                    );
                  })}
                </>
              );
            })}
          </div>
        </div>
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

      {/* Business hours modal */}
      {modal === "biz" && (
        <Modal title="Configurar Horario del Negocio" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FormRow label="Apertura"><Input value={businessHoursDraft.open} onChange={v => setBusinessHoursDraft(p => ({ ...p, open: v }))} type="time" /></FormRow>
              <FormRow label="Cierre"><Input value={businessHoursDraft.close} onChange={v => setBusinessHoursDraft(p => ({ ...p, close: v }))} type="time" /></FormRow>
            </div>
            <FormRow label="Días de atención">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {DAYS.map(d => {
                  const on = businessHoursDraft.days.includes(d);
                  return (
                    <button key={d} onClick={() => setBusinessHoursDraft(p => ({ ...p, days: on ? p.days.filter(x => x !== d) : [...p.days, d] }))}
                      style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: `1.5px solid ${on ? "#E88099" : "#E4E4E7"}`, background: on ? "#FCE8EE" : "#FAFAFA", color: on ? "#B8405E" : "#71717A", cursor: "pointer" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </FormRow>
          </div>
          <ModalActions onClose={() => setModal(null)} onConfirm={saveBusinessHours} confirmLabel="Guardar Configuración" />
        </Modal>
      )}
    </div>
  );
}
