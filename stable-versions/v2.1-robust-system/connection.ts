// Mock implementation for useConnectionStore for isolated/stable-versions testing
export const useConnectionStore = {
  getState: () => ({
    isBackendConnected: true,
    checkConnection: async () => true,
  }),
};
