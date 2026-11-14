import { joinFullName, readTable, splitFullName, toDatabaseDateTime, writeTable, type RolRow, type UsuarioRolRow, type UsuarioRow } from "./prototypeDatabase";

export type UserAccount = {
  id: string;
  name: string;
  doc: string;
  email: string;
  phone: string;
  roles: string[];
  active: boolean;
  lastLogin: string;
  createdAt: string;
};

export const USER_DIRECTORY_KEY = "eko-users";

export const INITIAL_USER_DIRECTORY: UserAccount[] = [
  { id: "U-001", name: "Ana Sofía García", doc: "1.020.001.001", email: "asofia@ekoplus.co", phone: "300 000 1111", roles: ["Administrador"], active: true, lastLogin: "14 Sep 2026, 08:30", createdAt: "01 Ene 2026" },
  { id: "U-002", name: "Andrea López", doc: "1.023.456.789", email: "andrea@ekoplus.co", phone: "300 111 2222", roles: ["Empleada"], active: true, lastLogin: "14 Sep 2026, 09:00", createdAt: "15 Mar 2026" },
  { id: "U-003", name: "Camila Reyes", doc: "1.024.567.890", email: "camila@ekoplus.co", phone: "301 333 4444", roles: ["Empleada"], active: true, lastLogin: "14 Sep 2026, 10:15", createdAt: "20 Abr 2026" },
  { id: "U-004", name: "Juliana Mora", doc: "1.025.678.901", email: "juliana@ekoplus.co", phone: "310 555 6666", roles: ["Empleada"], active: true, lastLogin: "13 Sep 2026, 17:00", createdAt: "05 May 2026" },
  { id: "U-005", name: "Paola Sierra", doc: "1.026.789.012", email: "paola@ekoplus.co", phone: "312 777 8888", roles: ["Recepcionista"], active: false, lastLogin: "05 Sep 2026, 09:00", createdAt: "10 Jun 2026" },
];

function roleNameKey(role: string) {
  return role.trim().toLocaleLowerCase("es");
}

function uniqueRoleNames(roles: string[]) {
  const unique = new Map<string, string>();
  for (const role of roles) {
    const name = role.trim();
    if (name) unique.set(roleNameKey(name), unique.get(roleNameKey(name)) ?? name);
  }
  return [...unique.values()];
}

export function readUserDirectory(): UserAccount[] {
  const users = readTable<UsuarioRow>("usuario", []);
  if (users.length > 0) {
    const roles = readTable<RolRow>("rol", []);
    const userRoles = readTable<UsuarioRolRow>("usuario_rol", []);
    const roleNames = new Map(roles.map(role => [role.id, role.nombre]));
    const storedDirectory = localStorage.getItem(USER_DIRECTORY_KEY);
    let metadataById = new Map<string, UserAccount>();
    if (storedDirectory) {
      try {
        const metadata = JSON.parse(storedDirectory) as UserAccount[];
        metadataById = new Map(metadata.map(user => [user.id, user]));
      } catch (error) {
        console.error("No se pudo leer la información adicional del directorio.", error);
      }
    }
    return users.map(user => ({
      ...metadataById.get(user.id),
      id: user.id,
      name: metadataById.get(user.id)?.name ?? joinFullName(user),
      doc: metadataById.get(user.id)?.doc ?? "",
      email: user.email,
      phone: user.telefono,
      roles: uniqueRoleNames(userRoles.filter(link => link.usuarioId === user.id).map(link => roleNames.get(link.rolId)).filter((name): name is string => Boolean(name))),
      active: user.activo,
      lastLogin: metadataById.get(user.id)?.lastLogin ?? "—",
      createdAt: metadataById.get(user.id)?.createdAt ?? user.fechaRegistro,
    }));
  }

  const stored = localStorage.getItem(USER_DIRECTORY_KEY);
  if (!stored) return INITIAL_USER_DIRECTORY;
  try {
    const directory = JSON.parse(stored) as UserAccount[];
    return directory.map(user => ({ ...user, roles: uniqueRoleNames(user.roles) }));
  } catch (error) {
    console.error("No se pudo leer el directorio de usuarios guardado.", error);
    return INITIAL_USER_DIRECTORY;
  }
}

export function saveUserDirectory(users: UserAccount[]) {
  const currentRoles = readTable<RolRow>("rol", []);
  const roleIds = new Map(currentRoles.map(role => [roleNameKey(role.nombre), role.id]));
  let nextRoleId = currentRoles.reduce((highest, role) => Math.max(highest, role.id), 0) + 1;
  for (const user of users) {
    for (const roleName of user.roles) {
      const key = roleNameKey(roleName);
      if (!roleIds.has(key)) {
        roleIds.set(key, nextRoleId);
        currentRoles.push({ id: nextRoleId, nombre: roleName });
        nextRoleId++;
      }
    }
  }

  const existingUsers = readTable<UsuarioRow>("usuario", []);
  const existingById = new Map(existingUsers.map(user => [user.id, user]));
  const dbUsers = users.map(user => ({
    id: user.id,
    ...splitFullName(user.name),
    telefono: user.phone,
    email: user.email,
    password: existingById.get(user.id)?.password ?? "",
    activo: user.active,
    fechaRegistro: existingById.get(user.id)?.fechaRegistro ?? toDatabaseDateTime(user.createdAt),
  }));
  const userRoles: UsuarioRolRow[] = users.flatMap(user => uniqueRoleNames(user.roles).map(roleName => ({
    usuarioId: user.id,
    rolId: roleIds.get(roleNameKey(roleName))!,
  })));

  writeTable("usuario", dbUsers);
  writeTable("rol", currentRoles);
  writeTable("usuario_rol", userRoles);
  localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(users));
}

type EmployeeAccountData = Pick<UserAccount, "name" | "doc" | "email" | "phone" | "active">;

export function syncEmployeeAccount(employee: EmployeeAccountData) {
  const users = [...readUserDirectory()];
  const index = users.findIndex(user =>
    (employee.email && user.email.toLowerCase() === employee.email.toLowerCase())
    || (employee.doc && user.doc === employee.doc)
  );

  if (index >= 0) {
    users[index] = { ...users[index], ...employee };
  } else {
    let sequence = users.length + 1;
    while (users.some(user => user.id === `U-${String(sequence).padStart(3, "0")}`)) sequence++;
    users.push({
      id: `U-${String(sequence).padStart(3, "0")}`,
      ...employee,
      roles: ["Empleada"],
      lastLogin: "—",
      createdAt: "14 Sep 2026",
    });
  }

  saveUserDirectory(users);
}

export function removeEmployeeAccount(employee: Pick<UserAccount, "doc" | "email">) {
  const users = readUserDirectory().filter(user =>
    (!employee.email || user.email.toLowerCase() !== employee.email.toLowerCase())
    && (!employee.doc || user.doc !== employee.doc)
  );
  saveUserDirectory(users);
}
