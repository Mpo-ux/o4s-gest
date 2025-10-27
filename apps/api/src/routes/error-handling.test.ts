import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";
import { beforeAll } from "vitest";

// Adiciona rota de erro antes dos testes
beforeAll(() => {
  app.get("/api/forcar-erro", () => {
    throw new Error("Erro forçado para teste");
  });
});

describe("Error handling middleware", () => {
  it("deve retornar 404 para endpoint inexistente", async () => {
    const res = await request(app).get("/api/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/não encontrado/i);
  });

  it("deve retornar 500 para erro inesperado", async () => {
    const res = await request(app).get("/api/forcar-erro");
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/algo correu mal/i);
  });
});
