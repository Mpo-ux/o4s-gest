import React, { useState, useEffect } from "react";
// import { useAuthStore } from "../store/auth";
// TODO: The import above was removed/commented out because '../store/auth' does not exist in this stable-versions directory.
// If you need authentication logic, update the import path to point to the correct store/auth file in your main app source.
import { User, UserRole } from "@business-app/types";

interface PendingUser extends User {
  requestDate: string;
}

// Mock user and makeApiRequest for stable-versions usage
const mockUser = {
  id: "1",
  name: "Admin",
  email: "admin@example.com",
  role: "SUPER_ADMIN",
  status: "APPROVED",
  isActive: true,
};
// Enhanced mockMakeApiRequest to simulate both success and error responses
const mockMakeApiRequest = async (url: string, options?: any) => {
  // Simulate error for user creation with duplicate email
  if (url === "/api/admin/users" && options?.method === "POST") {
    const body = options.body ? JSON.parse(options.body) : {};
    if (body.email === "existing@example.com") {
      return {
        ok: false,
        json: async () => ({ message: "Email já existe." }),
      };
    }
  }
  // Default: always success with empty users array
  return {
    ok: true,
    json: async () => ({ users: [] }),
  };
};

const AdminPanel: React.FC = () => {
  // Replace with real store in main app
  const user = mockUser;
  const makeApiRequest = mockMakeApiRequest;
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: UserRole.USER,
    password: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Verificar se o utilizador é super admin
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      loadPendingUsers();
      loadAllUsers();
    }
  }, [user]);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await makeApiRequest("/api/admin/users/pending");
      if (response.ok) {
        const data = await response.json();
        if ("users" in data) {
          setPendingUsers(data.users || []);
        } else {
          setPendingUsers([]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar utilizadores pendentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await makeApiRequest("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        if ("users" in data) {
          setAllUsers(data.users || []);
        } else {
          setAllUsers([]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(
        `/api/admin/users/${userId}/approve`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        loadPendingUsers();
        loadAllUsers();
      }
    } catch (error) {
      console.error("Erro ao aprovar utilizador:", error);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(
        `/api/admin/users/${userId}/reject`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        loadPendingUsers();
        loadAllUsers();
      }
    } catch (error) {
      console.error("Erro ao rejeitar utilizador:", error);
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(
        `/api/admin/users/${userId}/suspend`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        loadAllUsers();
      }
    } catch (error) {
      console.error("Erro ao suspender utilizador:", error);
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(
        `/api/admin/users/${userId}/activate`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        loadAllUsers();
      }
    } catch (error) {
      console.error("Erro ao ativar utilizador:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      const response = await makeApiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadPendingUsers();
        loadAllUsers();
      }
    } catch (error) {
      console.error("Erro ao eliminar utilizador:", error);
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const response = await makeApiRequest("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      if (response.ok) {
        setNewUser({ name: "", email: "", role: UserRole.USER, password: "" });
        setShowCreateForm(false);
        loadAllUsers();
        alert("Utilizador criado com sucesso!");
      } else {
        const data = await response.json();
        const msg = "message" in data ? data.message : "Erro desconhecido";
        alert(`Erro ao criar utilizador: ${msg}`);
      }
    } catch (error) {
      console.error("Erro ao criar utilizador:", error);
      alert("Erro ao criar utilizador");
    }
  };

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para aceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
            <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
            <p className="text-blue-100">
              Gestão completa de utilizadores e sistema
            </p>
          </div>
        </div>

        {/* Criar Utilizador */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Criar Novo Utilizador
                </h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>{showCreateForm ? "Cancelar" : "Novo Utilizador"}</span>
                  <span className="text-lg">{showCreateForm ? "×" : "+"}</span>
                </button>
              </div>
            </div>

            {showCreateForm && (
              <div className="p-6 bg-gray-50 dark:bg-gray-750">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="email@exemplo.com"
                      aria-label="Email do utilizador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Palavra-passe *
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Palavra-passe segura"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Função
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      title="Selecionar função do utilizador"
                      aria-label="Função do utilizador"
                    >
                      <option value={UserRole.USER}>Utilizador</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                      {isSuperAdmin && (
                        <option value={UserRole.SUPER_ADMIN}>
                          Super Admin
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={createUser}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Criar Utilizador
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Utilizadores Pendentes */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Utilizadores Pendentes ({pendingUsers.length})
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {pendingUsers.map((pendingUser) => (
                    <div
                      key={pendingUser.id}
                      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {pendingUser.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            {pendingUser.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Solicitado em:{" "}
                            {new Date(
                              pendingUser.requestDate
                            ).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveUser(pendingUser.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => rejectUser(pendingUser.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Rejeitar
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => deleteUser(pendingUser.id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Todos os Utilizadores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Todos os Utilizadores ({allUsers.length})
              </h2>
              <button
                onClick={loadAllUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Carregando utilizadores...
                </p>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum utilizador encontrado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">
                        Nome
                      </th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">
                        Função
                      </th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {allUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                          {u.name}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                          {u.email}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : u.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              u.status === "APPROVED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : u.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : u.status === "SUSPENDED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {u.role !== "SUPER_ADMIN" && (
                            <div className="flex space-x-2">
                              {u.status === "APPROVED" && u.isActive && (
                                <button
                                  onClick={() => suspendUser(u.id)}
                                  className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                  Suspender
                                </button>
                              )}
                              {u.status === "SUSPENDED" && (
                                <button
                                  onClick={() => activateUser(u.id)}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  Ativar
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => deleteUser(u.id)}
                                  className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
