import { createClient } from '@supabase/supabase-js';
import { localBackend } from './localBackend';

const USE_LOCAL = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';

// Supabase client (only used if not in local mode)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = USE_LOCAL 
  ? localBackend 
  : createClient(supabaseUrl, supabaseAnonKey);

export interface Sheet {
  id: string;
  user_id: string;
  name: string;
  sheet_url: string;
  sheet_id: string;
  headers?: string[];
  google_access_token?: string;
  google_refresh_token?: string;
  created_at: string;
  updated_at: string;
}

export interface SheetData {
  id: string;
  sheet_id: string;
  row_index: number;
  column_index: number;
  column_name: string;
  cell_value: string;
  created_at: string;
}

export interface SheetRow {
  id: string;
  sheet_id: string;
  row_index: number;
  row_array: unknown[];
  row_json: Record<string, unknown>;
  created_at: string;
}
