import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("/api/auth/register validation", () => {
  it("deve rejeitar registro sem nome", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@o4s.com", password: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Nome obrigatório|Dados inválidos/i);
  });

  it("deve rejeitar registro com email inválido", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Teste", email: "invalido", password: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(
      /Email inválido|Formato de email inválido|Dados inválidos/i
    );
  });

  it("deve rejeitar registro com password curta", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Teste", email: "test@o4s.com", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password.*6|Dados inválidos/i);
  });

  it("deve rejeitar registro com role inválida", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Teste",
        email: "test@o4s.com",
        password: "123456",
        role: "INVALID",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Dados inválidos|role/i);
  });
});
