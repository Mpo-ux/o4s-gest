import React from "react";
import { useAuthStore } from "../store/auth";

export default function UserProfile() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Utilizador não autenticado</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user.full_name || "Utilizador"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mt-1">
            {user.role === "admin" ? "👑 Administrador" : "👤 Utilizador"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="profile-fullname"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nome Completo
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={user.full_name || ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="Nome Completo"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="Email"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="profile-role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Função
            </label>
            <input
              id="profile-role"
              type="text"
              value={user.role === "admin" ? "Administrador" : "Utilizador"}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="Função"
            />
          </div>

          <div>
            <label
              htmlFor="profile-id"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              ID do Utilizador
            </label>
            <input
              id="profile-id"
              type="text"
              value={user.id}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
              aria-label="ID do Utilizador"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Perfil Supabase
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Este perfil é gerido pelo sistema Supabase. Para alterações,
              contacte o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
