import React, { useState } from "react";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../stores/themeStore";

enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

const AdminPanel: React.FC = () => {
  const { user, register } = useAuthStore();
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: UserRole.USER,
    password: "",
  });

  const handleUserCreation = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        newUser.name,
        newUser.email,
        newUser.password,
        newUser.role === UserRole.ADMIN ? "ADMIN" : "USER"
      );

      if (result.success) {
        alert("Utilizador criado com sucesso!");
        setNewUser({
          name: "",
          email: "",
          role: UserRole.USER,
          password: "",
        });
      } else {
        alert(result.message || "Erro ao criar utilizador");
      }
    } catch (error) {
      console.error("Erro ao criar utilizador:", error);
      alert("Erro ao criar utilizador");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`text-center p-8 rounded-lg shadow-lg ${
            isDark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p>Apenas administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className={`rounded-xl p-6 mb-8 bg-gradient-to-r ${
            isDark
              ? "from-blue-900/50 to-purple-900/50 text-white"
              : "from-blue-500 to-purple-600 text-white"
          } shadow-lg`}
        >
          <div className="flex items-center space-x-3">
            <div className="text-3xl">⚙️</div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-blue-100">
                Gestão de utilizadores e permissões do sistema
              </p>
            </div>
          </div>
        </div>

        {/* User Creation Form */}
        <div
          className={`rounded-xl shadow-lg p-6 mb-8 ${
            isDark ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          }`}
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👤</span>
              <div>
                <h2 className="text-xl font-bold">Criar Novo Utilizador</h2>
                <p className="text-blue-100 text-sm">
                  Adicione um novo utilizador ao sistema
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="adminpanel-name"
                className="block text-sm font-medium mb-2"
              >
                Nome Completo
              </label>
              <input
                id="adminpanel-name"
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white"
                }`}
                placeholder="Ex: Catarina Mendes"
                aria-label="Nome Completo"
              />
            </div>

            <div>
              <label
                htmlFor="adminpanel-email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                id="adminpanel-email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white"
                }`}
                placeholder="cmendes@o4s.tv"
                aria-label="Email"
              />
            </div>

            <div>
              <label
                htmlFor="adminpanel-role"
                className="block text-sm font-medium mb-2"
              >
                Nível de Acesso
              </label>
              <select
                id="adminpanel-role"
                title="Nível de Acesso"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: e.target.value as UserRole,
                  })
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white"
                }`}
                aria-label="Nível de Acesso"
              >
                <option value={UserRole.USER}>👤 Utilizador</option>
                <option value={UserRole.ADMIN}>🔧 Administrador</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="adminpanel-password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                id="adminpanel-password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white"
                }`}
                placeholder="••••••••"
                aria-label="Password"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() =>
                setNewUser({
                  name: "",
                  email: "",
                  role: UserRole.USER,
                  password: "",
                })
              }
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ✕ Cancelar
            </button>
            <button
              onClick={handleUserCreation}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Criar Utilizador</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div
          className={`rounded-xl p-4 ${
            isDark
              ? "bg-blue-900/20 border border-blue-800 text-blue-200"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="font-medium">Sistema Supabase Ativo</p>
              <p className="text-sm opacity-80">
                Os utilizadores são criados diretamente no Supabase com
                autenticação segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
