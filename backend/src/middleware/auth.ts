// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_CONFIG } from '../config/auth';
import { createErrorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    login: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json(createErrorResponse('Требуется авторизация'));
      return;
    }
    
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: string };
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      res.status(401).json(createErrorResponse('Пользователь не найден или заблокирован'));
      return;
    }
    
    req.user = {
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    res.status(401).json(createErrorResponse('Неверный токен'));
  }
};

// ✅ Middleware для проверки прав администратора
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Проверяем, что пользователь авторизован
  if (!req.user) {
    res.status(401).json(createErrorResponse('Требуется авторизация'));
    return;
  }

  // Проверяем роль
  if (req.user.role !== 'ADMIN') {
    res.status(403).json(createErrorResponse('Доступ запрещён. Требуются права администратора'));
    return;
  }

  next();
};

// ✅ Middleware для проверки прав модератора (если понадобится)
export const requireModerator = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json(createErrorResponse('Требуется авторизация'));
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
    res.status(403).json(createErrorResponse('Доступ запрещён. Требуются права модератора'));
    return;
  }

  next();
};

// ✅ Middleware для проверки, что пользователь является владельцем ресурса
export const requireOwner = (getResourceUserId: (req: AuthRequest) => Promise<string | null>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        res.status(404).json(createErrorResponse('Ресурс не найден'));
        return;
      }

      // Админ может всё
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Проверяем, что пользователь - владелец
      if (req.user.id !== resourceUserId) {
        res.status(403).json(createErrorResponse('У вас нет прав на это действие'));
        return;
      }

      next();
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при проверке прав'));
    }
  };
};