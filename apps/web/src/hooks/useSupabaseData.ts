import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";

interface DashboardStats {
  clientesTotal: number;
  clientesAtivos: number;
  fornecedoresTotal: number;
  fornecedoresAtivos: number;
  usersOnline: number;
  isLoading: boolean;
  error: string | null;
}

export function useSupabaseData(): DashboardStats {
  const { isSupabaseMode } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    clientesTotal: 0,
    clientesAtivos: 0,
    fornecedoresTotal: 0,
    fornecedoresAtivos: 0,
    usersOnline: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseMode) {
      // Dados mock para desenvolvimento
      setStats({
        clientesTotal: 89,
        clientesAtivos: 76,
        fornecedoresTotal: 23,
        fornecedoresAtivos: 21,
        usersOnline: 3,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Buscar dados reais do Supabase
    const fetchStats = async () => {
      try {
        setStats((prev) => ({ ...prev, isLoading: true, error: null }));

        console.log("📊 Buscando estatísticas do Supabase...");

        // Por agora, usar dados mock para clientes e fornecedores
        // até que as tabelas sejam criadas no Supabase
        const clientesTotal = 89;
        const clientesAtivos = 76;
        const fornecedoresTotal = 23;
        const fornecedoresAtivos = 21;

        // Buscar usuários online reais
        let onlineCount = 3; // default
        try {
          const { data: usersOnline, error: usersError } = await supabase
            .from("user_sessions")
            .select("id", { count: "exact" })
            .eq("is_online", true)
            .gte(
              "last_seen",
              new Date(Date.now() - 15 * 60 * 1000).toISOString()
            ); // 15 minutos

          if (usersError) {
            console.warn("⚠️ Erro ao buscar users online:", usersError);
          } else {
            onlineCount = usersOnline?.length || 0;
          }
        } catch (error) {
          console.warn("⚠️ Erro ao conectar com user_sessions:", error);
        }

        console.log("✅ Estatísticas obtidas:", {
          clientesTotal,
          clientesAtivos,
          fornecedoresTotal,
          fornecedoresAtivos,
          usersOnline: onlineCount,
        });

        setStats({
          clientesTotal,
          clientesAtivos,
          fornecedoresTotal,
          fornecedoresAtivos,
          usersOnline: onlineCount,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("❌ Erro ao buscar estatísticas:", error);
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }));
      }
    };

    fetchStats();

    // Atualizar dados a cada 30 segundos se estiver em modo Supabase
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [isSupabaseMode]);

  return stats;
}
