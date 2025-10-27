/**
 * PROFILE PAGE COMPONENT
 * O4S Gestão - Página de perfil do utilizador
 *
 * Esta página permite aos utilizadores:
 * - Visualizar e editar informações pessoais
 * - Alterar password
 * - Upload de avatar
 * - Configurar preferências da conta
 */

import React, { useState, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../stores/themeStore";

interface ProfilePageProps {
  onBack?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, isSupabaseMode, updatePassword } = useAuthStore();
  const { isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences"
  >("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    company: "",
    position: "",
    bio: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoLogout: false,
    language: "pt",
  });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simular API call para atualizar perfil
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showMessage("success", "Perfil atualizado com sucesso!");
    } catch (error) {
      showMessage("error", "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("error", "As novas passwords não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage("error", "A nova password deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      // Usar Supabase para atualizar password
      const success = await updatePassword(passwordData.newPassword);

      if (success) {
        showMessage("success", "Password alterada com sucesso!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showMessage("error", "Erro ao alterar password");
      }
    } catch (error) {
      showMessage("error", "Erro ao alterar password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showMessage("error", "O ficheiro deve ter menos de 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
        showMessage("success", "Avatar atualizado! (Simulação)");
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Perfil", icon: "👤" },
    { id: "security" as const, label: "Segurança", icon: "🔒" },
    { id: "preferences" as const, label: "Preferências", icon: "⚙️" },
  ];

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
                }`}
              >
                ←
              </button>
            )}
            <div>
              <h1
                className={`text-3xl font-bold transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Meu Perfil
              </h1>
              <p
                className={`transition-colors duration-300 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Gerir informações da conta e preferências
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSupabaseMode
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {isSupabaseMode ? "🌐 Supabase" : "🧪 Mock"}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div
              className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* User Card */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-slate-700">
                <div className="relative inline-block">
                  <div
                    className={`w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ${
                      isDark ? "bg-slate-700" : "bg-gray-200"
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-3 right-1/2 transform translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 ${
                      isDark
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    📷
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    title="Upload de avatar"
                    aria-label="Selecionar ficheiro de avatar"
                  />
                </div>
                <h3
                  className={`font-semibold transition-colors duration-300 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user?.full_name || user?.email}
                </h3>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {user?.email}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user?.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user?.role === "admin" ? "👨‍💼 Admin" : "👤 Utilizador"}
                </span>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center space-x-3 transition-all duration-200 ${
                      activeTab === tab.id
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                        : isDark
                        ? "text-gray-300 hover:bg-slate-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div
              className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-8">
                  <h2
                    className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Informações Pessoais
                  </h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="profile-name"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Nome Completo
                        </label>
                        <input
                          id="profile-name"
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              name: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            isDark
                              ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                          placeholder="Nome completo"
                          aria-label="Nome completo"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="profile-email"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Email
                        </label>
                        <input
                          id="profile-email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            isDark
                              ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                          placeholder="Email"
                          aria-label="Email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="profile-phone"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Telefone
                        </label>
                        <input
                          id="profile-phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            isDark
                              ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                          placeholder="+351 123 456 789"
                          aria-label="Telefone"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="profile-company"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Empresa
                        </label>
                        <input
                          id="profile-company"
                          type="text"
                          value={profileData.company}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              company: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            isDark
                              ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                          placeholder="Nome da empresa"
                          aria-label="Empresa"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="profile-position"
                        className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Cargo/Posição
                      </label>
                      <input
                        id="profile-position"
                        type="text"
                        value={profileData.position}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            position: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Ex: Gestor de Projetos"
                        aria-label="Cargo ou posição"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-bio"
                        className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Biografia
                      </label>
                      <textarea
                        id="profile-bio"
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value,
                          })
                        }
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Conte um pouco sobre si..."
                        aria-label="Biografia"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        } text-white`}
                      >
                        {isLoading ? "A guardar..." : "Guardar Alterações"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="p-8">
                  <h2
                    className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Segurança da Conta
                  </h2>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Password Atual
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Digite sua password atual"
                        required
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Nova Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Digite a nova password"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Confirmar Nova Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Confirme a nova password"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        } text-white`}
                      >
                        {isLoading ? "A alterar..." : "Alterar Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="p-8">
                  <h2
                    className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Preferências
                  </h2>
                  <div className="space-y-6">
                    {/* Notifications */}
                    <div
                      className={`p-6 rounded-lg border transition-all duration-200 ${
                        isDark
                          ? "bg-slate-700 border-slate-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h3
                        className={`font-semibold mb-4 transition-colors duration-300 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Notificações
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span
                            className={`transition-colors duration-300 ${
                              isDark ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            Notificações por Email
                          </span>
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                emailNotifications: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            title="Ativar notificações por email"
                            aria-label="Ativar ou desativar notificações por email"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span
                            className={`transition-colors duration-300 ${
                              isDark ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            Notificações Push
                          </span>
                          <input
                            type="checkbox"
                            checked={preferences.pushNotifications}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                pushNotifications: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            title="Ativar notificações push"
                            aria-label="Ativar ou desativar notificações push"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Security */}
                    <div
                      className={`p-6 rounded-lg border transition-all duration-200 ${
                        isDark
                          ? "bg-slate-700 border-slate-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h3
                        className={`font-semibold mb-4 transition-colors duration-300 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Segurança
                      </h3>
                      <label className="flex items-center justify-between">
                        <span
                          className={`transition-colors duration-300 ${
                            isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          Logout automático (inatividade)
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.autoLogout}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              autoLogout: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          title="Ativar logout automático por inatividade"
                          aria-label="Ativar ou desativar logout automático"
                        />
                      </label>
                    </div>

                    {/* Language */}
                    <div
                      className={`p-6 rounded-lg border transition-all duration-200 ${
                        isDark
                          ? "bg-slate-700 border-slate-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h3
                        className={`font-semibold mb-4 transition-colors duration-300 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Idioma
                      </h3>
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            language: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark
                            ? "bg-slate-600 border-slate-500 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        title="Selecionar idioma da aplicação"
                        aria-label="Escolher idioma preferido"
                      >
                        <option value="pt">🇵🇹 Português</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="fr">🇫🇷 Français</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          showMessage("success", "Preferências guardadas!")
                        }
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Guardar Preferências
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
