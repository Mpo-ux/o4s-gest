import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth, userTracking, supabase } from "../lib/supabase";
import type { AuthUser } from "../lib/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAttempt: Date | null;
  lastSessionDate: string | null;
  rememberMe: boolean;
  showWelcomeMessage: boolean; // Novo campo para controlar mensagem de boas-vindas
  isSupabaseMode: boolean; // Flag para alternar entre sistemas

  // Actions
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "USER" | "ADMIN"
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearError: () => void;
  hideWelcomeMessage: () => void; // Novo método para ocultar mensagem
  initializeSupabaseAuth: () => Promise<void>; // Inicializar auth do Supabase

  // Helpers de role
  isAdmin: () => boolean;
  isManager: () => boolean;
  isUser: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginAttempt: null,
      lastSessionDate: null,
      rememberMe: false,
      showWelcomeMessage: false, // Inicialmente false
      isSupabaseMode: true, // SEMPRE SUPABASE - Usar apenas Supabase

      // Helpers de role
      isAdmin: () => {
        const user = get().user;
        return user?.role === "admin";
      },
      isManager: () => {
        const user = get().user;
        return user?.role === "manager";
      },
      isUser: () => {
        const user = get().user;
        return user?.role === "user";
      },

      login: async (
        email: string,
        password: string,
        rememberMe: boolean = false
      ): Promise<{ success: boolean; message?: string }> => {
        set({ isLoading: true, error: null, lastLoginAttempt: new Date() });

        try {
          // SEMPRE USAR SUPABASE
          console.log("🌐 Tentando login Supabase com:", {
            email,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          });

          const { data, error } = await auth.signIn(email, password);

          if (error) {
            console.error("❌ Erro no login Supabase:", error);

            // Verificar se é erro de credenciais ou configuração
            if (error.message.includes("Invalid login credentials")) {
              throw new Error(
                "Email ou password incorretos. Para testar use: admin@o4s.com / admin123"
              );
            } else if (error.message.includes("signup")) {
              throw new Error(
                "Conta não existe. Verifique se a conta foi criada no Supabase."
              );
            } else {
              throw new Error(`Erro Supabase: ${error.message}`);
            }
          }

          console.log("✅ Login Supabase bem-sucedido:", data.user?.email);

          if (data.user) {
            console.log("🔍 Buscando dados do usuário:", data.user.id);

            // Buscar dados completos do usuário
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.user.id)
              .single();

            console.log("📊 Dados do usuário encontrados:", userData);
            console.log("⚠️ Erro ao buscar usuário:", userError);

            // Se o usuário não existe na tabela users, criar um registro
            let userRole: "admin" | "manager" | "user" = "user";
            let userFullName = null;
            let userAvatarUrl = null;

            // Definir role baseado no email específico
            if (email === "sergioramos@o4s.tv" || email === "admin@o4s.com") {
              userRole = "admin";
            }

            if (userError && userError.code === "PGRST116") {
              // Usuário não existe na tabela, vamos criar
              console.log("👤 Criando registro de usuário na tabela users...");

              const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                  id: data.user.id,
                  email: data.user.email || email,
                  full_name: data.user.user_metadata?.full_name || null,
                  role: userRole, // Usar a role determinada acima
                } as any)
                .select()
                .single();

              if (insertError) {
                console.error("❌ Erro ao criar usuário:", insertError);
              } else if (newUser) {
                console.log("✅ Usuário criado com sucesso:", newUser);
                userRole = (newUser as any).role;
                userFullName = (newUser as any).full_name;
                userAvatarUrl = (newUser as any).avatar_url;
              }
            } else if (userData) {
              userRole = (userData as any).role;
              userFullName = (userData as any).full_name;
              userAvatarUrl = (userData as any).avatar_url;

              // Atualizar role se necessário (para emails específicos)
              if (
                (email === "sergioramos@o4s.tv" || email === "admin@o4s.com") &&
                userRole !== "admin"
              ) {
                console.log("🔄 Atualizando role para admin...");
                const { error: updateError } = await (supabase as any)
                  .from("users")
                  .update({ role: "admin" })
                  .eq("id", data.user.id);

                if (!updateError) {
                  userRole = "admin";
                  console.log("✅ Role atualizada para admin com sucesso!");
                }
              }
            }

            console.log("🎭 Role final do usuário:", userRole);

            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || email,
              full_name:
                userFullName || data.user.user_metadata?.full_name || null,
              avatar_url:
                userAvatarUrl || data.user.user_metadata?.avatar_url || null,
              role: userRole as "admin" | "manager" | "user",
            };

            console.log("👤 AuthUser criado:", authUser);

            // Marcar usuário como online
            await userTracking.markUserOnline(data.user.id);

            set({
              user: authUser,
              token: data.session?.access_token || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              lastSessionDate: new Date().toISOString(),
              rememberMe: rememberMe,
              showWelcomeMessage: true,
            });

            return { success: true };
          }

          return { success: false, message: "Erro inesperado no login" };
        } catch (error) {
          console.error("🚨 Erro no login:", error);

          const errorMessage =
            error instanceof Error ? error.message : "Erro de autenticação";

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, message: errorMessage };
        }
      },

      register: async (
        name: string,
        email: string,
        password: string,
        role: "USER" | "ADMIN" = "USER"
      ) => {
        set({ isLoading: true, error: null });

        try {
          // Verificar se o email já existe na tabela users
          const { data: existing, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

          if (fetchError) {
            set({ isLoading: false, error: fetchError.message });
            return {
              success: false,
              message: `Erro ao verificar duplicação: ${fetchError.message}`,
            };
          }
          if (existing) {
            set({ isLoading: false, error: "User already registered" });
            return { success: false, message: "User already registered" };
          }

          // SEMPRE USAR SUPABASE
          console.log("🌐 Tentando registo Supabase com:", {
            name,
            email,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          });

          const { data, error } = await auth.signUp(email, password);

          if (error) {
            console.error("❌ Erro no registo Supabase:", error);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: `Erro Supabase: ${error.message}`,
            });
            return {
              success: false,
              message: `Erro Supabase: ${error.message}`,
            };
          }

          console.log("✅ Registo Supabase bem-sucedido:", data.user?.email);

          // Criar entrada na tabela users do Supabase
          if (data.user) {
            // Converter role para formato Supabase
            const supabaseRole = role === "ADMIN" ? "admin" : "user";

            const { data: newUser, error: insertError } = await (
              supabase as any
            )
              .from("users")
              .insert([
                {
                  id: data.user.id,
                  email: email,
                  full_name: name,
                  role: supabaseRole,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();

            if (insertError) {
              console.error(
                "❌ Erro ao criar utilizador na tabela:",
                insertError
              );
              throw new Error(
                `Erro ao criar utilizador: ${insertError.message}`
              );
            }

            console.log("✅ Utilizador criado na tabela:", newUser);

            // Marcar utilizador como online
            await userTracking.markUserOnline(data.user.id);

            // Configurar estado de autenticação
            set({
              user: {
                id: data.user.id,
                full_name: name,
                email: email,
                role: supabaseRole, // Usar a role convertida
              },
              token: data.session?.access_token || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showWelcomeMessage: true,
            });

            return { success: true, message: "Conta criada com sucesso!" };
          }

          throw new Error("Falha no registo");
        } catch (error) {
          console.error("🚨 Erro no registo:", error);

          const errorMessage =
            error instanceof Error ? error.message : "Erro de registo";

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        const currentState = get();

        try {
          // SEMPRE USAR SUPABASE
          if (currentState.user) {
            // Marcar usuário como offline no Supabase
            await userTracking.markUserOffline(currentState.user.id);

            // Fazer logout do Supabase
            await auth.signOut();
          }
        } catch (error) {
          console.error("Erro durante logout:", error);
        }

        // Clear all auth data immediately
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          rememberMe: false,
          showWelcomeMessage: false, // Reset mensagem de boas-vindas
        });

        // Clear localStorage/sessionStorage immediately
        localStorage.removeItem("auth-storage");
        sessionStorage.removeItem("auth-storage");

        console.log("🚪 Logout realizado - sessão terminada");
      },

      clearError: () => {
        set({ error: null });
      },

      hideWelcomeMessage: () => {
        set({ showWelcomeMessage: false });
      },

      updatePassword: async (newPassword: string): Promise<boolean> => {
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            console.error("❌ Erro ao atualizar password:", error);
            return false;
          }

          console.log("✅ Password atualizada com sucesso");
          return true;
        } catch (error) {
          console.error("❌ Erro ao atualizar password:", error);
          return false;
        }
      },

      initializeSupabaseAuth: async () => {
        try {
          // Verificar sessão existente
          const {
            data: { session },
          } = await auth.getSession();

          if (session?.user) {
            // Buscar dados completos do usuário
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (userError) {
              console.warn("Erro ao buscar dados do usuário:", userError);
            }

            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || "",
              full_name:
                (userData as any)?.full_name ||
                session.user.user_metadata?.full_name ||
                null,
              avatar_url:
                (userData as any)?.avatar_url ||
                session.user.user_metadata?.avatar_url ||
                null,
              role: (userData as any)?.role || "user",
            };

            // Marcar usuário como online
            await userTracking.markUserOnline(session.user.id);

            set({
              user: authUser,
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              lastSessionDate: new Date().toISOString(),
            });

            console.log("✅ Sessão Supabase restaurada");
          } else {
            console.log("ℹ️ Nenhuma sessão Supabase encontrada");
          }

          // Configurar listener para mudanças de auth
          auth.onAuthStateChange(async (event, session) => {
            console.log("🔄 Auth state changed:", event);

            if (event === "SIGNED_IN" && session?.user) {
              // Atualizar estado quando usuário faz login
              const { data: userData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || "",
                full_name:
                  (userData as any)?.full_name ||
                  session.user.user_metadata?.full_name ||
                  null,
                avatar_url:
                  (userData as any)?.avatar_url ||
                  session.user.user_metadata?.avatar_url ||
                  null,
                role: (userData as any)?.role || "user",
              };

              await userTracking.markUserOnline(session.user.id);

              set({
                user: authUser,
                token: session.access_token,
                isAuthenticated: true,
                lastSessionDate: new Date().toISOString(),
              });
            } else if (event === "SIGNED_OUT") {
              // Limpar estado quando usuário faz logout
              const currentState = get();
              if (currentState.user) {
                await userTracking.markUserOffline(currentState.user.id);
              }

              set({
                user: null,
                token: null,
                isAuthenticated: false,
                showWelcomeMessage: false,
              });
            }
          });
        } catch (error) {
          console.error("❌ Erro ao inicializar auth Supabase:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastSessionDate: state.lastSessionDate,
        rememberMe: state.rememberMe,
        showWelcomeMessage: state.showWelcomeMessage, // Incluir no persist
        isSupabaseMode: state.isSupabaseMode, // Incluir modo Supabase
      }),
    }
  )
);
