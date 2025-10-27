import { useState, useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../stores/themeStore";
import { UserRole } from "@business-app/types";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user, logout, hideWelcomeMessage, isSupabaseMode } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-dropdown-container")) {
        setIsUserDropdownOpen(false);
      }
      if (!target.closest(".menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "clientes", label: "Clientes", icon: "👥" },
    { id: "fornecedores", label: "Fornecedores", icon: "🏢" },
    { id: "produtos", label: "Produtos", icon: "📦" },
    { id: "rma", label: "RMAs", icon: "🔄" },
  ];

  // Adicionar item admin se for administrador ou super admin
  if (user?.role === "admin" || user?.role === "manager") {
    menuItems.push({ id: "admin", label: "Admin", icon: "⚙️" });
  }

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handlePageChange = (page: string) => {
    hideWelcomeMessage(); // Ocultar mensagem ao navegar
    onPageChange(page);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-700"
          : "bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 border-blue-800"
      } shadow-2xl border-b transition-all duration-300 backdrop-blur-lg`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between h-20">
          {/* Logo O4S + Menu Hamburger à esquerda */}
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 ${
                isDark
                  ? "bg-gradient-to-br from-gray-600 to-gray-700"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              } rounded-xl flex items-center justify-center shadow-lg transition-all duration-300`}
            >
              <span className="text-white font-bold text-xl">O4S</span>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${
                isDark
                  ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  : "text-slate-300 hover:text-white hover:bg-blue-800/30"
              } focus:outline-none focus:text-white p-3 rounded-xl transition-all duration-200`}
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Controles do Usuário - Direita */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/25"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
              } group`}
              title={isDark ? "Modo Claro" : "Modo Escuro"}
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                {isDark ? "☀️" : "🌙"}
              </span>
            </button>

            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-gray-100" : "text-white"
                } transition-all duration-300`}
              >
                {user?.email}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-slate-300"
                } transition-all duration-300`}
              >
                {user?.role}
              </p>
            </div>

            {/* User Dropdown */}
            <div className="relative user-dropdown-container">
              {/* User Avatar - clickable */}
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`w-10 h-10 ${
                  isDark
                    ? "bg-gradient-to-br from-gray-600 to-gray-700"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                } rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-105`}
                title="Menu do utilizador"
              >
                {user?.email?.charAt(0).toUpperCase()}
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 z-50">
                  <div
                    className={`${
                      isDark
                        ? "bg-gray-800/95 border-gray-600"
                        : "bg-white/95 border-gray-200"
                    } border rounded-xl shadow-2xl backdrop-blur-lg transition-all duration-300`}
                  >
                    {/* User Info Header */}
                    <div
                      className={`p-4 border-b ${
                        isDark ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {user?.email}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        } flex items-center space-x-1`}
                      >
                        <span>{user?.role}</span>
                        <span className="text-xs">•</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            isSupabaseMode
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isSupabaseMode ? "🌐 Supabase" : "🧪 Mock"}
                        </span>
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {/* Profile Button */}
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onPageChange("profile");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center space-x-3 ${
                          isDark
                            ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <span>👤</span>
                        <span>Perfil</span>
                      </button>

                      {/* Mode Display */}
                      <div
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center space-x-3 ${
                          isDark
                            ? "text-gray-300 bg-gray-700/50"
                            : "text-gray-700 bg-gray-100"
                        }`}
                      >
                        <span>🌐</span>
                        <span>Modo Supabase (Always On)</span>
                      </div>

                      {/* Divider */}
                      <div
                        className={`my-2 border-t ${
                          isDark ? "border-gray-600" : "border-gray-200"
                        }`}
                      ></div>

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-header com módulos - Zona Azul */}
        <div
          className={`${
            isDark
              ? "bg-gray-700/30 border-gray-600"
              : "bg-blue-800/20 border-blue-600"
          } border-b-2 transition-all duration-300`}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex items-center space-x-2 py-3 overflow-x-auto">
              {menuItems
                .filter((item) => item.id !== "admin")
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 group whitespace-nowrap ${
                      currentPage === item.id
                        ? `${
                            isDark
                              ? "bg-gray-600 text-white shadow-lg shadow-gray-500/25"
                              : "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                          }`
                        : `${
                            isDark
                              ? "text-gray-200 hover:text-white hover:bg-gray-600/50"
                              : "text-blue-100 hover:text-white hover:bg-blue-700/50"
                          }`
                    }`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Menu Dropdown - Todos os módulos */}
        {isMenuOpen && (
          <div className="absolute top-20 left-6 sm:left-8 lg:left-10 z-50 menu-container">
            <div
              className={`min-w-[280px] w-max ${
                isDark
                  ? "bg-gray-800/95 border-gray-600"
                  : "bg-blue-900/95 border-blue-700"
              } border rounded-xl shadow-2xl backdrop-blur-lg transition-all duration-300`}
            >
              <div className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-3 group ${
                      currentPage === item.id
                        ? `${
                            isDark
                              ? "bg-gray-700 text-white shadow-lg"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          }`
                        : `${
                            isDark
                              ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                              : "text-slate-300 hover:text-white hover:bg-blue-700/50"
                          }`
                    }`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
