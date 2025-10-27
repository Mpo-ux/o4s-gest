import { describe, it, expect, beforeEach } from "vitest";
import {
  addUser,
  updateUser,
  findUserByEmail,
  getAllUsers,
  users,
} from "../data/users.js";

// Limpar e repor utilizadores antes de cada teste
beforeEach(() => {
  users.length = 0;
  addUser({
    id: "1",
    name: "Test User",
    email: "test@o4s.com",
    role: "USER",
    status: "APPROVED",
    isActive: true,
    createdAt: new Date(),
  });
});

describe("User Data Module", () => {
  it("adiciona um novo utilizador", () => {
    addUser({
      id: "2",
      name: "Novo",
      email: "novo@o4s.com",
      role: "USER",
      status: "PENDING",
      isActive: false,
      createdAt: new Date(),
    });
    expect(users.length).toBe(2);
    expect(findUserByEmail("novo@o4s.com")).toBeDefined();
  });

  it("atualiza um utilizador existente", () => {
    updateUser("1", { status: "SUSPENDED", isActive: false });
    const user = findUserByEmail("test@o4s.com");
    expect(user?.status).toBe("SUSPENDED");
    expect(user?.isActive).toBe(false);
  });

  it("retorna todos os utilizadores", () => {
    addUser({
      id: "2",
      name: "Novo",
      email: "novo@o4s.com",
      role: "USER",
      status: "PENDING",
      isActive: false,
      createdAt: new Date(),
    });
    const all = getAllUsers();
    expect(all.length).toBe(2);
    expect(all[0].email).toBe("test@o4s.com");
    expect(all[1].email).toBe("novo@o4s.com");
  });
});
