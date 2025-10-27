import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./auth";

// Mock do supabase para simular erro de rede
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      auth: {
        signInWithPassword: vi.fn(async () => {
          // Simula erro de rede
          throw new Error("Network error: Failed to connect to Supabase");
        }),
        signOut: vi.fn(async () => ({ error: null })),
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { message: "Network error" },
            })),
          })),
        })),
      })),
    }),
  };
});

describe("auth store - ligação Supabase", () => {
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

  it("deve lidar com erro de rede ao tentar login", async () => {
    const { login } = useAuthStore.getState();
    const result = await login("user@example.com", "password");
    const { user, isAuthenticated, error } = useAuthStore.getState();
    expect(result.success).toBe(false);
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(error).toContain("Network error");
  });
});
