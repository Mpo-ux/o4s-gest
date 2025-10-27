// Simulação de base de dados de utilizadores partilhada
import logger from "../utils/logger.js";
interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER" | "PENDING";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  isActive: boolean;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

// Base de dados partilhada - usada por auth.ts e admin.ts
export let users: User[] = [
  {
    id: "0",
    name: "Sérgio Ramos",
    email: "sergioramos@o4s.tv",
    role: "SUPER_ADMIN",
    status: "APPROVED",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    approvedBy: "system",
    approvedAt: new Date("2025-01-01"),
  },
  {
    id: "1",
    name: "Administrador",
    email: "admin@empresa.pt",
    role: "ADMIN",
    status: "APPROVED",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    approvedBy: "0",
    approvedAt: new Date("2025-01-01"),
  },
  {
    id: "2",
    name: "João Silva",
    email: "joao@empresa.pt",
    role: "USER",
    status: "APPROVED",
    isActive: true,
    createdAt: new Date("2025-01-02"),
    approvedBy: "1",
    approvedAt: new Date("2025-01-02"),
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria@teste.pt",
    role: "PENDING",
    status: "PENDING",
    isActive: false,
    createdAt: new Date("2025-01-03"),
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@exemplo.pt",
    role: "PENDING",
    status: "PENDING",
    isActive: false,
    createdAt: new Date("2025-01-04"),
  },
];

// Funções para manipular utilizadores
export function addUser(user: User) {
  users.push(user);
  logger.info(`[DB] Utilizador adicionado: ${user.email} (${user.role})`);
}

export function updateUser(id: string, updates: Partial<User>) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    logger.info(
      `[DB] Utilizador atualizado: ${users[index].email} (${users[index].role})`,
      { updates }
    );
  } else {
    logger.warn(`[DB] Tentativa de atualizar utilizador inexistente: ${id}`);
  }
}

export function findUserById(id: string) {
  const user = users.find((user) => user.id === id);
  if (!user) logger.warn(`[DB] Utilizador não encontrado por ID: ${id}`);
  return user;
}

export function findUserByEmail(email: string) {
  const user = users.find((user) => user.email === email);
  if (!user) logger.warn(`[DB] Utilizador não encontrado por email: ${email}`);
  return user;
}
