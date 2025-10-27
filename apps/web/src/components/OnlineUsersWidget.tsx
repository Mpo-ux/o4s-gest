import React from "react";
import { useAuthStore } from "../store/auth";

export default function OnlineUsersWidget() {
  const { user } = useAuthStore();

  // Mock data for demonstration
  const onlineUsers = [
    { id: "1", name: "Admin User", email: "admin@o4s.com", status: "online" },
    {
      id: "2",
      name: "Current User",
      email: user?.email || "",
      status: "online",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Utilizadores Online
        </h3>
        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
          {onlineUsers.length} online
        </span>
      </div>

      <div className="space-y-3">
        {onlineUsers.map((onlineUser) => (
          <div key={onlineUser.id} className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {onlineUser.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {onlineUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {onlineUser.email}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Dados de demonstração. Integração com Supabase em desenvolvimento.
          </p>
        </div>
      </div>
    </div>
  );
}
