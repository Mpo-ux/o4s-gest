import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js";
import { JWT_SECRET } from "../config/constants.js";

const superAdminToken = jwt.sign(
  { userId: "1", email: "super@admin.com", role: "SUPER_ADMIN" },
  JWT_SECRET,
  { expiresIn: "1h" }
);
const userToken = jwt.sign(
  { userId: "2", email: "user@normal.com", role: "USER" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

describe("/api/admin authorization", () => {
  it("deve recusar acesso sem token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token não fornecido/i);
  });

  it("deve recusar acesso a user sem role SUPER_ADMIN", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Acesso negado/i);
  });

  it("deve permitir acesso a SUPER_ADMIN", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
