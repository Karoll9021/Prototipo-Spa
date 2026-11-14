import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export type UsuarioRow = {
  id: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  password: string;
  activo: boolean;
  fechaRegistro: string;
};

export type ClienteRow = {
  id: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  activo: boolean;
  fechaRegistro: string;
};

export type ServicioRow = {
  id: number;
  nombre: string;
  precio: number;
  duracionEstimada: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
};

export type CitaRow = {
  id: number;
  clienteId: string;
  fechaCreacion: string;
  fechaHoraInicio: string;
  estado: string;
  observaciones: string;
};

export type CitaServicioRow = {
  id: number;
  citaId: number;
  servicioId: number;
  empleadoId: string;
  inicioPlanificado: string;
  finPlanificado: string;
  duracionAplicada: number;
  precioAplicado: number;
};

export type HorarioEmpleadoRow = {
  id: number;
  empleadoId: string;
  diaSemana: number;
  horarioInicio: string;
  horarioFin: string;
};

export type PagoRow = {
  id: number;
  citaId: number;
  fecha: string;
  montoTotal: number;
};

export type DetallePagoRow = {
  id: number;
  pagoId: number;
  metodoPagoId: number;
  monto: number;
};

export type MetodoPagoRow = { id: number; nombre: string };
export type DevolucionRow = { id: number; pagoId: number; fecha: string; monto: number; motivo: string };
export type RolRow = { id: number; nombre: string };
export type PermisoRow = { id: number; modulo: string; accion: string; nombre: string };
export type RolPermisoRow = { rolId: number; permisoId: number };
export type UsuarioRolRow = { usuarioId: string; rolId: number };

export type PrototypeTables = {
  usuario: UsuarioRow[];
  cliente: ClienteRow[];
  servicio: ServicioRow[];
  cita: CitaRow[];
  cita_servicio: CitaServicioRow[];
  horario_empleado: HorarioEmpleadoRow[];
  pago: PagoRow[];
  detalle_pago: DetallePagoRow[];
  metodo_pago: MetodoPagoRow[];
  devolucion: DevolucionRow[];
  rol: RolRow[];
  permiso: PermisoRow[];
  rol_permiso: RolPermisoRow[];
  usuario_rol: UsuarioRolRow[];
};

const TABLE_KEY = "eko-prototype-table:";

export function readTable<T>(table: keyof PrototypeTables, fallback: T[]): T[] {
  const stored = localStorage.getItem(`${TABLE_KEY}${table}`);
  if (!stored) return fallback;
  try {
    const rows: unknown = JSON.parse(stored);
    if (!Array.isArray(rows)) throw new TypeError(`La tabla local ${table} no contiene una lista.`);
    return rows as T[];
  } catch (error) {
    console.error(`No se pudo leer la tabla local ${table}.`, error);
    return fallback;
  }
}

export function writeTable<T>(table: keyof PrototypeTables, rows: T[]) {
  localStorage.setItem(`${TABLE_KEY}${table}`, JSON.stringify(rows));
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    primerNombre: parts[0] ?? "",
    segundoNombre: parts.length === 3 || parts.length > 3 ? parts[1] : "",
    primerApellido: parts.length > 3 ? parts[2] : parts.length === 3 ? parts[2] : parts[1] ?? "",
    segundoApellido: parts.length > 3 ? parts.slice(3).join(" ") : "",
  };
}

export function joinFullName(person: Pick<UsuarioRow, "primerNombre" | "segundoNombre" | "primerApellido" | "segundoApellido">) {
  return [person.primerNombre, person.segundoNombre, person.primerApellido, person.segundoApellido].filter(Boolean).join(" ");
}

export function nextPrefixedId(prefix: string, ids: string[], padding = 3) {
  const nextNumber = ids.reduce((highest, id) => {
    const value = Number(id.replace(prefix, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0) + 1;
  let number = nextNumber;
  while (ids.includes(`${prefix}${String(number).padStart(padding, "0")}`)) number++;
  return `${prefix}${String(number).padStart(padding, "0")}`;
}

export function toDatabaseDateTime(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function downloadCsv(fileName: string, rows: Record<string, string | number | boolean>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
  const content = [headers, ...rows.map(row => headers.map(header => row[header] ?? ""))]
    .map(values => values.map(escape).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function usePersistentState<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored) as T;
      } catch (error) {
        console.error(`No se pudo leer la información local (${key}).`, error);
      }
    }
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
