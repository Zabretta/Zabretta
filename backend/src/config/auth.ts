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

// Массив ролей, имеющих доступ в админку
export const ADMIN_ROLES = ['ADMIN', 'MODERATOR'];

// Проверка на админа или модератора (доступ в админку)
export const isAdminRole = (role: string): boolean => {
  return ADMIN_ROLES.includes(role);
};

// Проверка только на админа (для особо важных разделов)
export const isSuperAdminRole = (role: string): boolean => {
  return role === 'ADMIN';
};