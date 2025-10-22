// Configurações partilhadas do servidor
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

export const API_CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_EXPIRY: '24h'
}