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
    
    const user = await prisma.user.findUnique({
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
