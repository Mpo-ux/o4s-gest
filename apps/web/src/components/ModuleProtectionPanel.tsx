/**
 * O4S Gestão - Painel de Administração de Proteção de Módulos
 * Interface para gerenciar o sistema de proteção
 */

import { useState, useEffect } from "react";
import { useThemeStore } from "../stores/themeStore";
import {
  useModuleProtectionSystem,
  useModuleProtection,
} from "../utils/useModuleProtection";
import { ModuleVersion } from "../utils/moduleProtection";

export function ModuleProtectionPanel() {
  const { isDark } = useThemeStore();
  const {
    systemState,
    isLoading,
    listModules,
    exportModules,
    importModules,
    cleanupBackups,
  } = useModuleProtectionSystem();

  const [modules, setModules] = useState<ModuleVersion[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [exportData, setExportData] = useState("");

  // Proteção do próprio painel
  const panelProtection = useModuleProtection({
    moduleId: "module-protection-panel",
    moduleName: "Painel de Proteção de Módulos",
    version: "1.0.0",
    autoRegister: true,
    features: [
      "module-management",
      "backup-control",
      "export-import",
      "system-monitoring",
    ],
    themeCompatible: true,
  });

  useEffect(() => {
    const moduleList = listModules();
    setModules(moduleList);
  }, [listModules, systemState]);

  const handleExport = () => {
    const data = exportModules();
    setExportData(data);
    setShowExport(true);
  };

  const handleImport = () => {
    if (importData.trim()) {
      const success = importModules(importData);
      if (success) {
        alert("✅ Módulos importados com sucesso!");
        setImportData("");
        setShowImport(false);
        // Recarregar lista de módulos
        setTimeout(() => {
          const moduleList = listModules();
          setModules(moduleList);
        }, 100);
      } else {
        alert("❌ Erro ao importar módulos. Verifique o formato dos dados.");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("📋 Dados copiados para área de transferência!");
    });
  };

  const getStatusIcon = (module: ModuleVersion) => {
    if (module.theme_compatible) return "🛡️";
    return "⚠️";
  };

  const getStatusColor = (module: ModuleVersion) => {
    if (module.theme_compatible)
      return isDark ? "text-green-400" : "text-green-600";
    return isDark ? "text-yellow-400" : "text-yellow-600";
  };

  if (isLoading) {
    return (
      <div
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        } rounded-2xl shadow-xl border p-8`}
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
          <span className={isDark ? "text-gray-300" : "text-gray-600"}>
            Carregando sistema de proteção...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
      } rounded-2xl shadow-xl border overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${
          isDark
            ? "from-purple-600 to-indigo-700"
            : "from-purple-500 to-indigo-600"
        } px-8 py-6`}
      >
        <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
          <span className="text-3xl">🛡️</span>
          <span>Sistema de Proteção de Módulos</span>
          {panelProtection.state.isProtected && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-auto">
              v1.0.0
            </span>
          )}
        </h3>
        <p className="text-purple-100 mt-2">
          Gerenciamento, backup e monitoramento de módulos da aplicação
        </p>
      </div>

      <div className="p-8">
        {/* Estatísticas do Sistema */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div
            className={`${
              isDark ? "bg-gray-700" : "bg-slate-50"
            } p-4 rounded-xl text-center`}
          >
            <div className="text-2xl font-bold text-teal-500">
              {systemState.totalModules}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Módulos
            </div>
          </div>
          <div
            className={`${
              isDark ? "bg-gray-700" : "bg-slate-50"
            } p-4 rounded-xl text-center`}
          >
            <div className="text-2xl font-bold text-blue-500">
              {systemState.totalBackups}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Backups
            </div>
          </div>
          <div
            className={`${
              isDark ? "bg-gray-700" : "bg-slate-50"
            } p-4 rounded-xl text-center`}
          >
            <div className="text-2xl font-bold text-green-500">
              {systemState.themeCompatible}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Compatíveis
            </div>
          </div>
          <div
            className={`${
              isDark ? "bg-gray-700" : "bg-slate-50"
            } p-4 rounded-xl text-center`}
          >
            <div className="text-2xl font-bold text-purple-500">
              {systemState.withDependencies}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Dependências
            </div>
          </div>
          <div
            className={`${
              isDark ? "bg-gray-700" : "bg-slate-50"
            } p-4 rounded-xl text-center`}
          >
            <div className="text-2xl font-bold text-orange-500">
              {systemState.featureFlags}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Features
            </div>
          </div>
        </div>

        {/* Controles de Sistema */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
          >
            <span>📤</span>
            <span>Exportar Configuração</span>
          </button>

          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <span>📥</span>
            <span>Importar Configuração</span>
          </button>

          <button
            onClick={() => cleanupBackups()}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <span>🧹</span>
            <span>Limpar Backups Antigos</span>
          </button>
        </div>

        {/* Lista de Módulos */}
        <div className="space-y-4">
          <h4
            className={`text-lg font-semibold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Módulos Registrados ({modules.length})
          </h4>

          {modules.length === 0 ? (
            <div
              className={`${
                isDark ? "bg-gray-700" : "bg-slate-50"
              } p-8 rounded-xl text-center`}
            >
              <span className="text-4xl">📦</span>
              <p
                className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                Nenhum módulo registrado ainda
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-slate-50 border-slate-200"
                  } border rounded-xl p-6 transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`text-2xl ${getStatusColor(module)}`}>
                          {getStatusIcon(module)}
                        </span>
                        <div>
                          <h5
                            className={`font-semibold ${
                              isDark ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            {module.name}
                          </h5>
                          <p
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            v{module.version} • {module.id}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span
                            className={`block font-medium ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Última Atualização
                          </span>
                          <span
                            className={
                              isDark ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            {new Date(module.timestamp).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`block font-medium ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Features
                          </span>
                          <span
                            className={
                              isDark ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            {module.features.length} implementadas
                          </span>
                        </div>

                        <div>
                          <span
                            className={`block font-medium ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Dependências
                          </span>
                          <span
                            className={
                              isDark ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            {module.dependencies.length} módulos
                          </span>
                        </div>

                        <div>
                          <span
                            className={`block font-medium ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Checksum
                          </span>
                          <span
                            className={`font-mono text-xs ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {module.checksum.substring(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      {module.features.length > 0 && (
                        <div className="mt-4">
                          <span
                            className={`block text-sm font-medium mb-2 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Funcionalidades:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {module.features.map((feature) => (
                              <span
                                key={feature}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  isDark
                                    ? "bg-gray-600 text-gray-200"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setSelectedModule(
                          selectedModule === module.id ? null : module.id
                        )
                      }
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        isDark
                          ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {selectedModule === module.id ? "Ocultar" : "Detalhes"}
                    </button>
                  </div>

                  {/* Detalhes expandidos */}
                  {selectedModule === module.id && (
                    <div
                      className={`mt-4 pt-4 border-t ${
                        isDark ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <pre
                        className={`text-xs ${
                          isDark
                            ? "text-gray-300 bg-gray-800"
                            : "text-gray-600 bg-gray-100"
                        } p-4 rounded-lg overflow-x-auto`}
                      >
                        {JSON.stringify(module, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Exportação */}
        {showExport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div
              className={`${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-xl p-6 max-w-2xl w-full max-h-96`}
            >
              <h4
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Exportar Configuração de Módulos
              </h4>
              <textarea
                id="export-config-textarea"
                value={exportData}
                readOnly
                className={`w-full h-64 p-4 rounded-lg font-mono text-sm resize-none ${
                  isDark
                    ? "bg-gray-700 text-gray-200 border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-300"
                } border`}
                aria-label="Configuração exportada dos módulos"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => copyToClipboard(exportData)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  📋 Copiar
                </button>
                <button
                  onClick={() => setShowExport(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importação */}
        {showImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div
              className={`${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-xl p-6 max-w-2xl w-full max-h-96`}
            >
              <h4
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Importar Configuração de Módulos
              </h4>
              <textarea
                id="import-config-textarea"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Cole aqui a configuração exportada..."
                className={`w-full h-64 p-4 rounded-lg font-mono text-sm resize-none ${
                  isDark
                    ? "bg-gray-700 text-gray-200 border-gray-600 placeholder-gray-400"
                    : "bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-500"
                } border`}
                aria-label="Configuração importada dos módulos"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  📥 Importar
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportData("");
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
