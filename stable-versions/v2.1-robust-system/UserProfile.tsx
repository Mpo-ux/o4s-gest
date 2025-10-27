import { useState } from "react";

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock user for isolated testing
const mockUser = {
  name: "Test User",
  email: "testuser@example.com",
  role: "ADMIN",
  isActive: true,
  status: "APPROVED",
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
};

export function UserProfile(props: UserProfileProps) {
  // Use props directly to avoid unused destructure warning
  const user = mockUser;
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const loading = false;

  if (!props.isOpen) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrador";
      case "ADMIN":
        return "Administrador";
      case "USER":
        return "Utilizador";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "👑";
      case "ADMIN":
        return "👨‍💼";
      case "USER":
        return "👤";
      default:
        return "👤";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Meu Perfil</h2>
            <button
              onClick={props.onClose}
              className="text-white hover:text-gray-200 transition-colors"
              title="Fechar"
              aria-label="Fechar perfil"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{getRoleIcon(user.role)}</span>
                <span className="text-sm font-medium text-blue-600">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Estado da Conta</h4>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  user.isActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {user.isActive ? "Ativa" : "Inativa"}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  user.status === "APPROVED"
                    ? "bg-green-500"
                    : user.status === "PENDING"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">{user.status}</span>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Segurança</h4>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {isChangingPassword ? "Cancelar" : "Alterar Password"}
              </button>
            </div>

            {isChangingPassword && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // mock password change handler
                  alert("Password change submitted (mock)");
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password Atual
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Digite sua password atual"
                    aria-label="Password atual"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nova Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                    placeholder="Digite a nova password"
                    aria-label="Nova password"
                    title="Digite a nova password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirmar Nova Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                    placeholder="Confirme a nova password"
                    aria-label="Confirmar nova password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Alterando..." : "Alterar Password"}
                </button>
              </form>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-sm text-gray-500 text-center">
            <p>
              Membro desde{" "}
              {new Date(user.createdAt || Date.now()).toLocaleDateString(
                "pt-PT"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
