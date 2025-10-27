/**
 * O4S Gestão - Widget de Utilizadores Online
 * Componente minimizável com dados reais de utilizadores conectados via Supabase
 */

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../stores/themeStore";
import { userTracking } from "../lib/supabase";

interface OnlineUserDisplay {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  lastActivity: Date;
  status: "online" | "away" | "busy";
}

export function UsersOnlineWidget() {
  const { user, isSupabaseMode } = useAuthStore();
  const { isDark } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserDisplay[]>([]);

  // Buscar usuários online (modo Supabase ou mock)
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        if (isSupabaseMode) {
          // Buscar usuários online do Supabase
          const supabaseUsers = await userTracking.getOnlineUsers();

          const displayUsers: OnlineUserDisplay[] = supabaseUsers
            .filter((su: any) => su.users) // Garantir que tem dados do usuário
            .map((su: any) => ({
              id: su.user_id,
              name:
                su.users!.full_name ||
                su.users!.email.split("@")[0] ||
                "Utilizador",
              role: su.users!.role.toUpperCase(),
              avatar: su.users!.avatar_url || undefined,
              lastActivity: new Date(su.last_seen),
              status: "online" as const,
            }));

          setOnlineUsers(displayUsers);
        } else {
          // Modo mock - apenas usuário atual
          if (user) {
            const currentUser: OnlineUserDisplay = {
              id: user.id || "1",
              name: user.full_name || user.email.split("@")[0] || "Utilizador",
              role: user.role.toUpperCase(),
              lastActivity: new Date(),
              status: "online",
            };

            setOnlineUsers([currentUser]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar usuários online:", error);

        // Fallback para modo mock em caso de erro
        if (user) {
          const currentUser: OnlineUserDisplay = {
            id: user.id || "1",
            name: user.full_name || user.email.split("@")[0] || "Utilizador",
            role: user.role.toUpperCase(),
            lastActivity: new Date(),
            status: "online",
          };

          setOnlineUsers([currentUser]);
        }
      }
    };

    fetchOnlineUsers();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchOnlineUsers, 30000);

    // Se estiver em modo Supabase, configurar subscription para updates em tempo real
    let subscription: any;
    if (isSupabaseMode) {
      subscription = userTracking.subscribeToOnlineUsers((users) => {
        const displayUsers: OnlineUserDisplay[] = users
          .filter((su) => su.users)
          .map((su) => ({
            id: su.user_id,
            name:
              su.users!.full_name ||
              su.users!.email.split("@")[0] ||
              "Utilizador",
            role: su.users!.role.toUpperCase(),
            avatar: su.users!.avatar_url || undefined,
            lastActivity: new Date(su.last_seen),
            status: "online" as const,
          }));

        setOnlineUsers(displayUsers);
      });
    }

    return () => {
      clearInterval(interval);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, isSupabaseMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "On-line";
      case "away":
        return "Ausente";
      case "busy":
        return "Ocupado";
      default:
        return "Offline";
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Agora";
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return `há ${Math.floor(diff / 86400)} dias`;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Administrador";
      case "USER":
        return "Utilizador";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "from-red-500 to-red-600";
      case "ADMIN":
        return "from-orange-500 to-orange-600";
      case "USER":
        return "from-blue-500 to-blue-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div
      className={`${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
      } rounded-2xl shadow-xl border transition-all duration-300`}
    >
      {/* Header clicável */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-4 cursor-pointer hover:${
          isDark ? "bg-gray-700/50" : "bg-slate-50"
        } transition-colors rounded-t-2xl`}
      >
        <div className="flex items-center space-x-3">
          <h3
            className={`text-lg font-bold ${
              isDark ? "text-gray-200" : "text-slate-800"
            }`}
          >
            Utilizadores Online
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isDark
                ? "bg-gray-700 text-gray-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {onlineUsers.length}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-slate-600"
              }`}
            >
              On-line
            </span>
          </div>

          <button
            className={`p-1 rounded-full transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            title={isExpanded ? "Minimizar" : "Expandir"}
            aria-label={
              isExpanded
                ? "Minimizar lista de utilizadores"
                : "Expandir lista de utilizadores"
            }
          >
            <svg
              className={`w-4 h-4 ${
                isDark ? "text-gray-400" : "text-slate-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo expansível */}
      {isExpanded && (
        <div
          className={`px-4 pb-4 border-t ${
            isDark ? "border-gray-700" : "border-slate-200"
          }`}
        >
          {onlineUsers.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-slate-500"
                }`}
              >
                Nenhum utilizador online
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(
                      user.role
                    )} rounded-full flex items-center justify-center shadow-lg relative`}
                  >
                    <span className="text-white text-sm font-bold">
                      {getUserInitials(user.name)}
                    </span>
                    {/* Status indicator */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        user.status
                      )} rounded-full border-2 ${
                        isDark ? "border-gray-800" : "border-white"
                      }`}
                    ></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p
                        className={`text-sm font-medium truncate ${
                          isDark ? "text-gray-200" : "text-slate-800"
                        }`}
                      >
                        {user.name}
                      </p>
                      {user.id === useAuthStore.getState().user?.id && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {getRoleDisplayName(user.role)}
                      </p>
                      <span
                        className={`text-xs ${
                          isDark ? "text-gray-500" : "text-slate-400"
                        }`}
                      >
                        •
                      </span>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {getStatusText(user.status)}{" "}
                        {getTimeAgo(user.lastActivity)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-2 h-2 ${getStatusColor(
                      user.status
                    )} rounded-full`}
                  ></div>
                </div>
              ))}
            </div>
          )}

          {/* Footer com timestamp da última atualização */}
          <div
            className={`mt-4 pt-3 border-t ${
              isDark ? "border-gray-700" : "border-slate-100"
            } text-center`}
          >
            <p
              className={`text-xs ${
                isDark ? "text-gray-500" : "text-slate-400"
              }`}
            >
              Atualizado: {new Date().toLocaleTimeString("pt-PT")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
