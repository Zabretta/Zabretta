// backend/src/config/auth.ts
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  refreshExpiresIn: '7d'
};

export const PASSWORD_CONFIG = {
  saltRounds: 10,
  minLength: 6
};

export const ADMIN_ROLES = ['ADMIN', 'MODERATOR'];

export const isAdminRole = (role: string): boolean => {
  return ADMIN_ROLES.includes(role);
};