import { describe, it, expect, vi, beforeEach } from "vitest";
import * as supabaseJs from "@supabase/supabase-js";
import { useAuthStore } from "./auth";

// Mock do supabase para simular email duplicado
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => {
      return {
        auth: {
          signUp: vi.fn(async (email, password) => {
            if (email === "duplicado@example.com") {
              return {
                data: { user: null },
                error: { message: "User already registered" },
              };
            }
            return { data: { user: { id: "2", email } }, error: null };
          }),
        },
        from: vi.fn((table) => {
          if (table === "users") {
            return {
              select: vi.fn(function (fields) {
                return {
                  eq: vi.fn(function (col, value) {
                    return {
                      single: vi.fn(async function () {
                        if (value === "duplicado@example.com") {
                          return { data: { id: "1" }, error: null };
                        }
                        return { data: null, error: null };
                      }),
                    };
                  }),
                };
              }),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "2",
                      email: "novo@example.com",
                      role: "user",
                      full_name: "Novo User",
                      avatar_url: null,
                    },
                    error: null,
                  })),
                })),
              })),
              upsert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "2",
                      email: "novo@example.com",
                      role: "user",
                      full_name: "Novo User",
                      avatar_url: null,
                    },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "user_sessions") {
            return {
              upsert: vi.fn(async () => ({ error: null })),
              update: vi.fn(async () => ({ error: null })),
            };
          }
          return {};
        }),
      };
    },
  };
});

describe("auth store - evitar duplicação de email", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginAttempt: null,
      lastSessionDate: null,
      rememberMe: false,
      showWelcomeMessage: false,
      isSupabaseMode: true,
    });
  });

  it("deve impedir registo com email já existente", async () => {
    const { register } = useAuthStore.getState();
    // Espiar o método insert/upsert do mock do supabase
    const client = (supabaseJs as any).createClient();
    const usersFrom = client.from("users");
    const insertSpy = usersFrom.insert;
    const upsertSpy = usersFrom.upsert;

    const result = await register(
      "Utilizador Duplicado",
      "duplicado@example.com",
      "password123"
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("User already registered");
    const { user, isAuthenticated, error } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(error).toContain("User already registered");
    // Garantir que insert/upsert não foram chamados
    expect(insertSpy).not.toHaveBeenCalled();
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("deve permitir registo com email novo", async () => {
    const { register } = useAuthStore.getState();
    const result = await register(
      "Novo User",
      "novo@example.com",
      "password123"
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain("Conta criada");
    const { user, isAuthenticated, error } = useAuthStore.getState();
    expect(user).toBeTruthy();
    expect(isAuthenticated).toBe(true);
    expect(error).toBeNull();
  });
});
