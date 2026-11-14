export type EmployeeSchedule = {
  id: string;
  employee: string;
  days: string[];
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  notes: string;
};

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const DEFAULT_EMPLOYEE_SCHEDULES: EmployeeSchedule[] = [
  { id: "H-001", employee: "Andrea López", days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"], startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00", notes: "Turno completo" },
  { id: "H-002", employee: "Camila Reyes", days: ["Lunes", "Miércoles", "Viernes", "Sábado"], startTime: "09:00", endTime: "18:00", breakStart: "13:00", breakEnd: "14:00", notes: "" },
  { id: "H-003", employee: "Juliana Mora", days: ["Martes", "Jueves", "Sábado"], startTime: "10:00", endTime: "19:00", breakStart: "14:00", breakEnd: "15:00", notes: "Solo mañanas disponibles para citas largas" },
];

export const DEFAULT_BUSINESS_HOURS = { open: "08:00", close: "19:00", days: WEEKDAYS.slice(0, 6) };
