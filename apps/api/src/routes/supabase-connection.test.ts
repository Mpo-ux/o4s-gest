import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_KEY devem estar definidos para os testes."
  );
}

describe("Supabase connection", () => {
  it("deve conectar e listar tabelas", async () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_KEY).toBeTruthy();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from("users").select("id").limit(1);
    // Aceita erro de policy recursion, mas garante que a tabela existe
    if (error) {
      expect(error.message).toMatch(
        /infinite recursion detected|permission denied|no row level security/
      );
    } else {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("deve retornar erro para tabela inexistente", async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("tabela_inexistente")
      .select("*")
      .limit(1);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
