import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./auth";

// Mock do supabase
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      auth: {
        signInWithPassword: vi.fn(async ({ email, password }) => {
          if (email === "user@example.com" && password === "password") {
            return { data: { user: { id: "1", email } }, error: null };
          }
          return {
            data: { user: null },
            error: { message: "Invalid credentials" },
          };
        }),
        signOut: vi.fn(async () => ({ error: null })),
        getUser: vi.fn(async () => ({
          data: { user: { id: "1", email: "user@example.com" } },
          error: null,
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "1",
                email: "user@example.com",
                role: "user",
                full_name: "Test User",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "1",
                email: "user@example.com",
                role: "user",
                full_name: "Test User",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null,
          })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "1",
                email: "user@example.com",
                role: "user",
                full_name: "Test User",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),
      })),
    }),
  };
});

describe("auth store", () => {
  beforeEach(() => {
    // Limpar estado entre testes
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

  it("faz login com sucesso", async () => {
    const { login } = useAuthStore.getState();
    await login("user@example.com", "password");
    const { user, isAuthenticated, error } = useAuthStore.getState();
    expect(user).toBeTruthy();
    expect(isAuthenticated).toBe(true);
    expect(error).toBeNull();
  });

  it("falha login com credenciais erradas", async () => {
    const { login } = useAuthStore.getState();
    await login("user@example.com", "wrong");
    const { user, isAuthenticated, error } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(error).toBeTruthy();
  });

  it("faz logout corretamente", async () => {
    const { login, logout } = useAuthStore.getState();
    await login("user@example.com", "password");
    await logout();
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });
});
