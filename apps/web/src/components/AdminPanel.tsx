import React, { useState } from "react";
import AdminTestPanel from "./AdminTestPanel";
import ExcelSheetsImporter from "./ExcelSheetsImporter";
import ListagemRegistos from "./ListagemRegistos";
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
  // Estado para seleção de módulo de importação
  const [importModule, setImportModule] = useState<"cliente" | "fornecedor">(
    "cliente"
  );

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

        {/* Painel de Testes Automatizados */}
        <div className="mb-8">
          <AdminTestPanel />
        </div>

        {/* Menu de seleção de módulo para importação */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label
            htmlFor="import-module-select"
            className="block text-sm font-medium"
          >
            Módulo de destino:
          </label>
          <select
            id="import-module-select"
            value={importModule}
            onChange={(e) =>
              setImportModule(e.target.value as "cliente" | "fornecedor")
            }
            className="px-3 py-2 rounded border border-slate-300"
            title="Selecionar módulo de destino para importação"
          >
            <option value="cliente">Clientes</option>
            <option value="fornecedor">Fornecedores</option>
            {/* Futuro: adicionar outros módulos */}
          </select>
        </div>

        {/* Importador Excel/Sheets dinâmico por módulo */}
        <ExcelSheetsImporter
          type={importModule}
          onImport={(data) => {
            // TODO: Integrar com backend/Supabase
            alert(`${data.length} registos prontos para importar!`);
          }}
        />

        {/* Listagem dos registos importados para o módulo selecionado */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">
            Registos Importados (
            {importModule === "cliente" ? "Clientes" : "Fornecedores"})
          </h3>
          <ListagemRegistos type={importModule} />
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
              <label className="block text-sm font-medium mb-2">
                Nome Completo
              </label>
              <input
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
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
              />
            </div>

            <div>
              <label
                htmlFor="user-role-select"
                className="block text-sm font-medium mb-2"
              >
                Nível de Acesso
              </label>
              <select
                id="user-role-select"
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
              >
                <option value={UserRole.USER}>👤 Utilizador</option>
                <option value={UserRole.ADMIN}>🔧 Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
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
                placeholder="Password"
              />
            </div>
          </div>
          <button
            className="mt-6 w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all duration-200 disabled:opacity-60"
            onClick={handleUserCreation}
            disabled={loading}
          >
            {loading ? "A criar utilizador..." : "Criar Utilizador"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
