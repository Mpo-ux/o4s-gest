/**
 * SUPABASE DATABASE TYPES
 * O4S Gestão - Definições de tipos para o banco de dados
 *
 * Este arquivo contém todas as definições de tipos TypeScript
 * para as tabelas e estruturas do banco de dados Supabase
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "manager" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "manager" | "user";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "manager" | "user";
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          last_seen: string;
          is_online: boolean;
          session_data: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          last_seen?: string;
          is_online?: boolean;
          session_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          last_seen?: string;
          is_online?: boolean;
          session_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          telefone: string | null;
          empresa: string | null;
          status: "ativo" | "inativo" | "pendente";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          empresa?: string | null;
          status?: "ativo" | "inativo" | "pendente";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          empresa?: string | null;
          status?: "ativo" | "inativo" | "pendente";
          created_at?: string;
          updated_at?: string;
        };
      };
      fornecedores: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          telefone: string | null;
          empresa: string | null;
          categoria: string | null;
          status: "ativo" | "inativo" | "bloqueado";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          empresa?: string | null;
          categoria?: string | null;
          status?: "ativo" | "inativo" | "bloqueado";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          empresa?: string | null;
          categoria?: string | null;
          status?: "ativo" | "inativo" | "bloqueado";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "manager" | "user";
      record_status: "ativo" | "inativo" | "pendente" | "bloqueado";
    };
  };
}

// Tipos auxiliares para uso na aplicação
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];

// Tipos para inserção
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserSessionInsert =
  Database["public"]["Tables"]["user_sessions"]["Insert"];
export type ClienteInsert = Database["public"]["Tables"]["clientes"]["Insert"];
export type FornecedorInsert =
  Database["public"]["Tables"]["fornecedores"]["Insert"];

// Tipos para atualização
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type UserSessionUpdate =
  Database["public"]["Tables"]["user_sessions"]["Update"];
export type ClienteUpdate = Database["public"]["Tables"]["clientes"]["Update"];
export type FornecedorUpdate =
  Database["public"]["Tables"]["fornecedores"]["Update"];

// Enums
export type UserRole = Database["public"]["Enums"]["user_role"];
export type RecordStatus = Database["public"]["Enums"]["record_status"];

// Tipos para usuários online
export interface OnlineUser {
  user_id: string;
  last_seen: string;
  is_online: boolean;
  users: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
  } | null;
}

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}
