import { useState, useEffect } from "react";
import { useAuthStore } from "./store/auth";
import { useThemeStore } from "./stores/themeStore";
import {
  LoginPage,
  ProfilePage,
  DashboardPage,
  ClientesPage,
  FornecedoresPage,
} from "./pages";
import { Navigation } from "./components/Navigation";
import AdminPanel from "./components/AdminPanel";
import InitializationLoader from "./components/InitializationLoader";
import PerformanceMonitor from "./components/PerformanceMonitor";
import AppInitializer, { InitializationResult } from "./utils/appInitializer";

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { isDark } = useThemeStore();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [initializationResult, setInitializationResult] =
    useState<InitializationResult | null>(null);

  // Initialize app systems
  useEffect(() => {
    const appInitializer = AppInitializer.getInstance();

    // Check if already initialized
    if (appInitializer.isAppInitialized()) {
      setIsAppInitialized(true);
      setInitializationResult(appInitializer.getInitializationResult());
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Handle initialization completion
  const handleInitializationComplete = (result: InitializationResult) => {
    setInitializationResult(result);
    setIsAppInitialized(true);

    // Log initialization results
    if (result.success) {
      console.log(
        `🎉 App initialized successfully in ${Math.round(result.duration)}ms`
      );
    } else {
      console.warn(
        `⚠️ App initialization completed with issues:`,
        result.errors
      );
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️ Initialization warnings:", result.warnings);
    }
  };

  // Show initialization loader if not ready
  if (!isAppInitialized) {
    return (
      <InitializationLoader
        onComplete={handleInitializationComplete}
        showDetails={process.env.NODE_ENV === "development"}
        enableSkip={process.env.NODE_ENV === "development"}
      />
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onPageChange={setCurrentPage} />;
      case "clientes":
        return <ClientesPage />;
      case "fornecedores":
        return <FornecedoresPage />;
      case "produtos":
        return (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-300" : "text-slate-600"
            } transition-all duration-300`}
          >
            📦 Módulo Produtos - Em desenvolvimento
          </div>
        );
      case "rma":
        return (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-300" : "text-slate-600"
            } transition-all duration-300`}
          >
            🔄 Sistema RMA - Em desenvolvimento
          </div>
        );
      case "calendario":
        return (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-300" : "text-slate-600"
            } transition-all duration-300`}
          >
            📅 Calendário - Em desenvolvimento
          </div>
        );
      case "admin":
        return <AdminPanel />;
      case "profile":
        return <ProfilePage onBack={() => setCurrentPage("dashboard")} />;
      default:
        return <DashboardPage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
      }`}
    >
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {/* Espaçamento para compensar header fixo (altura total do navigation: 20+14=34 * 0.25rem = 8.5rem) */}
      <div className="pt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderPage()}
        </div>
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === "development" && initializationResult && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg max-w-xs">
          <div>🚀 Init: {Math.round(initializationResult.duration)}ms</div>
          {initializationResult.errors.length > 0 && (
            <div className="text-red-400">
              ❌ {initializationResult.errors.length} errors
            </div>
          )}
          {initializationResult.warnings.length > 0 && (
            <div className="text-yellow-400">
              ⚠️ {initializationResult.warnings.length} warnings
            </div>
          )}
        </div>
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={true}
        userRole={user?.role as "SUPER_ADMIN" | "ADMIN" | "USER" | "PENDING"}
      />
    </div>
  );
}

export default App;
