import { useState } from "react";
import { Card, CardHeader, PrimaryBtn, GhostBtn, Badge, Avatar, IcoDownload } from "../components/ui";
import { downloadCsv } from "../data/prototypeDatabase";

type Period = "Día" | "Semana" | "Mes";
type DashboardData = {
  revenue: number;
  appointments: number;
  clients: number;
  services: number;
  employees: { name: string; services: number; revenue: number }[];
  appointments_data: { client: string; service: string; employee: string; time: string; status: string }[];
  services_data: { name: string; count: number; revenue: number }[];
  daily: { label: string; value: number }[];
};

const PERIOD_DATA: Record<Period, {
  revenue: number; appointments: number; clients: number; services: number;
  employees: { name: string; services: number; revenue: number }[];
  appointments_data: { client: string; service: string; employee: string; time: string; status: string }[];
  services_data: { name: string; count: number; revenue: number }[];
  daily: { label: string; value: number }[];
}> = {
  "Día": {
    revenue: 195000, appointments: 12, clients: 10, services: 12,
    employees: [
      { name: "Andrea López", services: 5, revenue: 90000 },
      { name: "Camila Reyes", services: 4, revenue: 70000 },
      { name: "Juliana Mora", services: 3, revenue: 35000 },
    ],
    appointments_data: [
      { client: "Valentina Torres", service: "Manicure Spa", employee: "Andrea López", time: "09:00", status: "Atendida" },
      { client: "Isabella Ramírez", service: "Nail Art Gel", employee: "Camila Reyes", time: "10:30", status: "Confirmada" },
      { client: "Sofía Mendoza", service: "Pedicure Clásico", employee: "Juliana Mora", time: "11:00", status: "Programada" },
      { client: "Mariana Castillo", service: "Uñas Acrílicas", employee: "Andrea López", time: "12:00", status: "Atendida" },
      { client: "Gabriela Vargas", service: "Manicure Express", employee: "Camila Reyes", time: "14:00", status: "Cancelada" },
    ],
    services_data: [
      { name: "Manicure Spa", count: 4, revenue: 140000 },
      { name: "Nail Art Gel", count: 3, revenue: 165000 },
      { name: "Pedicure Clásico", count: 3, revenue: 84000 },
      { name: "Uñas Acrílicas", count: 2, revenue: 160000 },
    ],
    daily: [
      { label: "08h", value: 1 }, { label: "09h", value: 2 }, { label: "10h", value: 2 }, { label: "11h", value: 3 }, { label: "12h", value: 1 }, { label: "13h", value: 0 }, { label: "14h", value: 2 }, { label: "15h", value: 1 },
    ],
  },
  "Semana": {
    revenue: 1240000, appointments: 67, clients: 54, services: 67,
    employees: [
      { name: "Andrea López", services: 28, revenue: 560000 },
      { name: "Camila Reyes", services: 23, revenue: 420000 },
      { name: "Juliana Mora", services: 16, revenue: 260000 },
    ],
    appointments_data: [
      { client: "Valentina Torres", service: "Manicure Spa", employee: "Andrea López", time: "Lun 09:00", status: "Atendida" },
      { client: "Paula Jiménez", service: "Gel Semipermanente", employee: "Juliana Mora", time: "Lun 15:30", status: "Atendida" },
      { client: "Natalia Ospina", service: "Manicure Spa", employee: "Andrea López", time: "Mar 09:30", status: "Programada" },
      { client: "Daniela Gutiérrez", service: "Nail Art Premium", employee: "Camila Reyes", time: "Mar 11:00", status: "Confirmada" },
      { client: "Mariana Castillo", service: "Pedicure Spa", employee: "Juliana Mora", time: "Mié 10:00", status: "Atendida" },
    ],
    services_data: [
      { name: "Manicure Spa", count: 18, revenue: 630000 },
      { name: "Nail Art Gel", count: 15, revenue: 825000 },
      { name: "Pedicure Clásico", count: 14, revenue: 392000 },
      { name: "Uñas Acrílicas", count: 12, revenue: 960000 },
      { name: "Gel Semipermanente", count: 8, revenue: 360000 },
    ],
    daily: [
      { label: "Lun", value: 12 }, { label: "Mar", value: 10 }, { label: "Mié", value: 14 }, { label: "Jue", value: 9 }, { label: "Vie", value: 13 }, { label: "Sáb", value: 9 }, { label: "Dom", value: 0 },
    ],
  },
  "Mes": {
    revenue: 4850000, appointments: 284, clients: 184, services: 284,
    employees: [
      { name: "Andrea López", services: 118, revenue: 2100000 },
      { name: "Camila Reyes", services: 97, revenue: 1650000 },
      { name: "Juliana Mora", services: 69, revenue: 1100000 },
    ],
    appointments_data: [
      { client: "Valentina Torres", service: "Manicure Spa", employee: "Andrea López", time: "14 Sep", status: "Atendida" },
      { client: "Mariana Castillo", service: "Uñas Acrílicas", employee: "Andrea López", time: "14 Sep", status: "Atendida" },
      { client: "Paula Jiménez", service: "Gel Semipermanente", employee: "Juliana Mora", time: "13 Sep", status: "Atendida" },
      { client: "Isabella Ramírez", service: "Nail Art Gel", employee: "Camila Reyes", time: "12 Sep", status: "Atendida" },
      { client: "Natalia Ospina", service: "Manicure Spa", employee: "Andrea López", time: "11 Sep", status: "Atendida" },
    ],
    services_data: [
      { name: "Manicure Spa", count: 72, revenue: 2520000 },
      { name: "Uñas Acrílicas", count: 51, revenue: 4080000 },
      { name: "Nail Art Gel", count: 63, revenue: 3465000 },
      { name: "Pedicure Clásico", count: 58, revenue: 1624000 },
      { name: "Gel Semipermanente", count: 40, revenue: 1800000 },
    ],
    daily: [
      { label: "S1", value: 64 }, { label: "S2", value: 71 }, { label: "S3", value: 68 }, { label: "S4", value: 81 },
    ],
  },
};

const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

function readLocalData<T>(key: string): T[] | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    const data: unknown = JSON.parse(stored);
    if (!Array.isArray(data)) throw new TypeError(`El dato guardado (${key}) no es una lista.`);
    return data as T[];
  } catch (error) {
    console.error(`No se pudo leer el dato guardado (${key}).`, error);
    return null;
  }
}

function getStoredDashboardData(): DashboardData | null {
  type StoredAppointment = { client: string; service: string[]; employee: string; date: string; time: string; status: string };
  type StoredSale = { client: string; service: string; employee: string; price: number; discount: number; status: string; date: string; time: string };
  const appointments = readLocalData<StoredAppointment>("eko-appointments");
  const clients = readLocalData<{ active: boolean }>("eko-clients");
  const services = readLocalData<{ name: string; active: boolean }>("eko-services");
  const sales = readLocalData<StoredSale>("eko-sales");
  if (!appointments && !clients && !services && !sales) return null;

  const appointmentRows = appointments ?? [];
  const paidSales = (sales ?? []).filter(sale => sale.status === "Pagada");
  const serviceMap = new Map<string, { count: number; revenue: number }>();
  const employeeMap = new Map<string, { services: number; revenue: number }>();
  for (const sale of paidSales) {
    const service = serviceMap.get(sale.service) ?? { count: 0, revenue: 0 };
    service.count++;
    service.revenue += sale.price - sale.discount;
    serviceMap.set(sale.service, service);
    const employee = employeeMap.get(sale.employee) ?? { services: 0, revenue: 0 };
    employee.services++;
    employee.revenue += sale.price - sale.discount;
    employeeMap.set(sale.employee, employee);
  }
  const servicesData = [...serviceMap].map(([name, data]) => ({ name, ...data })).sort((a, b) => b.count - a.count);
  const dailyMap = new Map<string, number>();
  for (const appointment of appointmentRows) {
    const label = appointment.time.slice(0, 2) ? `${appointment.time.slice(0, 2)}h` : appointment.date;
    dailyMap.set(label, (dailyMap.get(label) ?? 0) + 1);
  }
  const countByService = new Map<string, number>();
  appointmentRows.filter(appointment => appointment.status === "Atendida").forEach(appointment =>
    appointment.service.forEach(name => countByService.set(name, (countByService.get(name) ?? 0) + 1))
  );
  const revenue = paidSales.reduce((total, sale) => total + sale.price - sale.discount, 0);

  return {
    revenue,
    appointments: appointmentRows.length,
    clients: (clients ?? []).filter(client => client.active).length,
    services: [...countByService.values()].reduce((total, count) => total + count, 0),
    employees: [...employeeMap].map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue),
    appointments_data: appointmentRows.slice(0, 5).map(appointment => ({
      client: appointment.client,
      service: appointment.service.join(", "),
      employee: appointment.employee,
      time: appointment.time,
      status: appointment.status,
    })),
    services_data: servicesData.length ? servicesData : [...countByService].map(([name, count]) => ({ name, count, revenue: 0 })),
    daily: [...dailyMap].slice(0, 8).map(([label, value]) => ({ label, value })),
  };
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "100px", padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "100%", height: max > 0 ? `${(d.value / max) * 80}px` : "2px", background: d.value > 0 ? "linear-gradient(to top, #E88099, #FCE8EE)" : "#E4E4E7", borderRadius: "4px 4px 0 0", transition: "height 0.3s ease", minHeight: d.value > 0 ? "4px" : "2px" }} />
          <span style={{ fontSize: "10px", color: "#71717A", fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; count: number; revenue: number }[] }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  const COLORS = ["#E88099", "#D4607A", "#FCE8EE", "#F0C4D0", "#FADADF"];
  let cumulativePct = 0;
  const segments = data.map((d, i) => {
    const pct = d.count / total;
    const start = cumulativePct;
    cumulativePct += pct;
    return { ...d, pct, start, color: COLORS[i % COLORS.length] };
  });

  const r = 40;
  const cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {segments.map((s, i) => {
          const strokeDasharray = `${s.pct * circumference} ${circumference}`;
          const strokeDashoffset = -s.start * circumference;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#221F20" fontSize="14" fontWeight="700" fontFamily="Montserrat">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#71717A" fontSize="9">servicios</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 500, color: "#221F20", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#B8405E" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type FortnightRow = { employee: string; services: number; revenue: number };

function FortnightReport() {
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [fortnight, setFortnight] = useState<"1" | "2">("1");
  const [sales] = useState(() => readLocalData<{ employee: string; date: string; price: number; discount: number; status: string }>("eko-sales") ?? []);
  const [year, monthNumber] = month.split("-").map(Number);
  const startDay = fortnight === "1" ? 1 : 16;
  const endDay = fortnight === "1" ? 15 : new Date(year, monthNumber, 0).getDate();
  const startDate = `${month}-${String(startDay).padStart(2, "0")}`;
  const endDate = `${month}-${String(endDay).padStart(2, "0")}`;
  const report = new Map<string, FortnightRow>();

  for (const sale of sales) {
    if (sale.status !== "Pagada" || sale.date < startDate || sale.date > endDate) continue;
    const employee = report.get(sale.employee) ?? { employee: sale.employee, services: 0, revenue: 0 };
    employee.services++;
    employee.revenue += sale.price - sale.discount;
    report.set(sale.employee, employee);
  }
  const rows = [...report.values()].sort((a, b) => b.revenue - a.revenue);
  const total = rows.reduce((amount, row) => amount + row.revenue, 0);

  return (
    <Card>
      <CardHeader title="Ingresos quincenales por trabajadora">
        <button type="button" disabled={rows.length === 0} onClick={() => downloadCsv(`eko-reporte-${month}-quincena-${fortnight}`, rows.map(row => ({
          Trabajadora: row.employee,
          Servicios: row.services,
          Ingresos: row.revenue,
          Desde: startDate,
          Hasta: endDate,
        })))} style={{ display: "inline-flex", alignItems: "center", gap: "7px", minHeight: "34px", padding: "0 12px", border: "1px solid #E4E4E7", borderRadius: "8px", background: "#FFFFFF", color: rows.length ? "#B8405E" : "#A1A1AA", fontSize: "12px", fontWeight: 600, cursor: rows.length ? "pointer" : "not-allowed" }}><IcoDownload /> Exportar CSV</button>
      </CardHeader>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "12px", marginBottom: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", color: "#71717A", fontWeight: 600 }}>
            Mes
            <input aria-label="Mes del reporte quincenal" type="month" value={month} onChange={event => setMonth(event.target.value)} style={{ minHeight: "36px", border: "1px solid #E4E4E7", borderRadius: "8px", padding: "0 10px", color: "#221F20", font: "inherit" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", color: "#71717A", fontWeight: 600 }}>
            Quincena
            <select aria-label="Quincena" value={fortnight} onChange={event => setFortnight(event.target.value as "1" | "2")} style={{ minHeight: "36px", border: "1px solid #E4E4E7", borderRadius: "8px", padding: "0 10px", color: "#221F20", font: "inherit" }}>
              <option value="1">Del 1 al 15</option>
              <option value="2">Del 16 al {new Date(year, monthNumber, 0).getDate()}</option>
            </select>
          </label>
          <span style={{ fontSize: "12px", color: "#71717A", paddingBottom: "9px" }}>{startDate} – {endDate}</span>
          <strong style={{ fontSize: "14px", color: "#B8405E", paddingBottom: "8px" }}>Total pagado: {fmt(total)}</strong>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#F9F9FB" }}>
              {["Trabajadora", "Servicios pagados", "Ingresos"].map(label => <th key={label} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#71717A", textTransform: "uppercase" }}>{label}</th>)}
            </tr></thead>
            <tbody>
              {rows.length ? rows.map(row => (
                <tr key={row.employee} style={{ borderTop: "1px solid #E4E4E7" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#221F20" }}>{row.employee}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#71717A" }}>{row.services}</td>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: "#B8405E" }}>{fmt(row.revenue)}</td>
                </tr>
              )) : <tr><td colSpan={3} style={{ padding: "20px 12px", textAlign: "center", fontSize: "13px", color: "#71717A" }}>No hay ventas pagadas en esta quincena.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardView() {
  const [period, setPeriod] = useState<Period>("Mes");
  const [storedData] = useState(getStoredDashboardData);
  const data = storedData ?? PERIOD_DATA[period];

  const statCards = [
    { label: "Ingresos", value: fmt(data.revenue), sub: "total del período", bg: "#FCE8EE", text: "#B8405E" },
    { label: "Citas", value: String(data.appointments), sub: "realizadas", bg: "#E0F2FE", text: "#0369A1" },
    { label: "Clientas", value: String(data.clients), sub: "atendidas", bg: "#DCFCE7", text: "#15803D" },
    { label: "Servicios", value: String(data.services), sub: "prestados", bg: "#FEF3C7", text: "#B45309" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "22px", fontWeight: 700, color: "#221F20", marginBottom: "4px" }}>Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#71717A" }}>Métricas, estadísticas y reportes del establecimiento</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#F9F9FB", borderRadius: "10px", padding: "3px", border: "1px solid #E4E4E7" }}>
            {(["Día", "Semana", "Mes"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, border: "none", background: period === p ? "#B8405E" : "transparent", color: period === p ? "#FFFFFF" : "#71717A", cursor: "pointer", transition: "all 0.15s" }}>
                {p}
              </button>
            ))}
          </div>
          <GhostBtn onClick={() => window.print()}><IcoDownload /> Exportar PDF</GhostBtn>
          <GhostBtn onClick={() => downloadCsv(`eko-reporte-${period.toLowerCase()}`, data.services_data.map(service => ({ Servicio: service.name, Cantidad: service.count })))}><IcoDownload /> Excel</GhostBtn>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px", padding: "20px 22px", boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, marginBottom: "12px" }} />
            <div style={{ fontSize: "26px", fontWeight: 700, color: s.text, fontFamily: "'Montserrat', sans-serif", lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#221F20" }}>{s.label}</div>
            <div style={{ fontSize: "11px", color: "#71717A" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Bar chart */}
        <Card>
          <CardHeader title={`Actividad — por ${period}`}>
            <span style={{ fontSize: "11px", color: "#71717A" }}>Citas</span>
          </CardHeader>
          <div style={{ padding: "20px 24px" }}>
            <BarChart data={data.daily} />
          </div>
        </Card>

        {/* Services donut */}
        <Card>
          <CardHeader title="Servicios por tipo" />
          <div style={{ padding: "20px 24px" }}>
            <DonutChart data={data.services_data} />
          </div>
        </Card>
      </div>

      {/* Bottom section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
        {/* Appointments report */}
        <Card>
          <CardHeader title={`Reporte de Citas (${period})`}>
            <button style={{ fontSize: "12px", color: "#B8405E", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Ver todas →</button>
          </CardHeader>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9F9FB" }}>
                  {["Cliente", "Servicio", "Empleada", "Fecha/Hora", "Estado"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.appointments_data.map((a, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #E4E4E7" }} onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Avatar name={a.client} size={28} />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{a.client}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", color: "#71717A" }}>{a.service}</td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", color: "#71717A" }}>{a.employee}</td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{a.time}</td>
                    <td style={{ padding: "12px 20px" }}><Badge label={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Employee report */}
        <Card>
          <CardHeader title="Reporte Empleadas" />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.employees.map((emp, i) => {
              const maxRev = Math.max(...data.employees.map(e => e.revenue));
              const pct = maxRev > 0 ? (emp.revenue / maxRev) * 100 : 0;
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Avatar name={emp.name} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#221F20" }}>{emp.name}</div>
                      <div style={{ fontSize: "11px", color: "#71717A" }}>{emp.services} servicios</div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#B8405E", fontFamily: "'Montserrat', sans-serif" }}>{fmt(emp.revenue)}</span>
                  </div>
                  <div style={{ height: "4px", background: "#F4F4F5", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(to right, #E88099, #D4607A)", borderRadius: "999px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}

            {/* Services table */}
            <div style={{ marginTop: "8px", borderTop: "1px solid #E4E4E7", paddingTop: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#221F20", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Servicios más vendidos</p>
              {data.services_data.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FCE8EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#B8405E" }}>{i + 1}</span>
                    <span style={{ fontSize: "12px", color: "#221F20" }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#221F20" }}>{s.count}×</div>
                    <div style={{ fontSize: "10px", color: "#71717A" }}>{fmt(s.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "linear-gradient(135deg, #B8405E, #A33652)", borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Reporte quincenal</p>
              <p style={{ fontSize: "12px", color: "#FFFFFF", marginTop: "2px" }}>Consulta y exporta los ingresos pagados por trabajadora.</p>
              <a href="#fortnight-report" style={{ display: "inline-block", marginTop: "10px", fontSize: "11px", fontWeight: 600, color: "#B8405E", background: "#FFFFFF", borderRadius: "6px", padding: "6px 12px", textDecoration: "none" }}>
                Ver reporte
              </a>
            </div>
          </div>
        </Card>
      </div>
      <div id="fortnight-report"><FortnightReport /></div>
    </div>
  );
}
