/**
 * SUPABASE CLIENT CONFIGURATION
 * O4S Gestão - Configuração do cliente Supabase
 *
 * Este arquivo configura a conexão com o Supabase para:
 * - Autenticação de usuários
 * - Gerenciamento de sessões
 * - Tracking de usuários online
 * - Dados em tempo real
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Verificação de variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 ERRO: Variáveis de ambiente Supabase não configuradas!");
  console.error(
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env"
  );
  throw new Error("Configuração Supabase incompleta");
}

// Criação do cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Tipos para o contexto da aplicação
export type SupabaseClient = typeof supabase;

// Funções utilitárias para auth
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  getUser: () => supabase.auth.getUser(),

  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),
};

// Funções para tracking de usuários online
export const userTracking = {
  // Marcar usuário como online
  markUserOnline: async (userId: string) => {
    const { error } = await supabase.from("user_sessions").upsert({
      user_id: userId,
      last_seen: new Date().toISOString(),
      is_online: true,
    } as any);

    if (error) {
      console.error("Erro ao marcar usuário online:", error);
    }
  },

  // Marcar usuário como offline
  markUserOffline: async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        // @ts-ignore - Temporary fix for Supabase types
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Erro ao marcar usuário offline:", error);
      }
    } catch (err) {
      console.error("Erro ao marcar usuário offline:", err);
    }
  }, // Buscar usuários online
  getOnlineUsers: async () => {
    const { data, error } = await supabase
      .from("user_sessions")
      .select(
        `
        user_id,
        last_seen,
        is_online,
        users (
          id,
          email,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .eq("is_online", true)
      .gt("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Últimos 5 minutos

    if (error) {
      console.error("Erro ao buscar usuários online:", error);
      return [];
    }

    return data || [];
  },

  // Inscrever-se a mudanças em tempo real
  subscribeToOnlineUsers: (callback: (users: any[]) => void) => {
    return supabase
      .channel("user_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_sessions" },
        async () => {
          const users = await userTracking.getOnlineUsers();
          callback(users);
        }
      )
      .subscribe();
  },
};

// Log de inicialização
console.log("✅ Supabase client inicializado com sucesso");
console.log("🔗 URL:", supabaseUrl);
console.log("🔑 Anon Key configurada");

export default supabase;
