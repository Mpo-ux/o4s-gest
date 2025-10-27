import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("API Health Check", () => {
  it("GET /health deve retornar status OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});
